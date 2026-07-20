import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Logger } from '@nestjs/common';
import { TellerTransaction, TellerTransactionType, TellerTransactionStatus } from '../entities/teller-transaction.entity';
import { TellerCashDrawer, DrawerShiftStatus } from '../entities/teller-cash-drawer.entity';
import { TransactDto } from '../dto/transact.dto';

@Injectable()
export class TellerService {
  private readonly logger = new Logger(TellerService.name);

  constructor(
    @InjectRepository(TellerTransaction)
    private transactionRepo: Repository<TellerTransaction>,
    @InjectRepository(TellerCashDrawer)
    private drawerRepo: Repository<TellerCashDrawer>,
  ) {}

  /**
   * TX-001: Ejecutar transacción de cajero con validaciones
   */
  async executeTransaction(dto: TransactDto): Promise<TellerTransaction> {
    this.logger.log(
      `Ejecutando transacción: type=${dto.transactionType}, amount=${dto.amountPrincipal}, branch=${dto.branchId}`,
    );

    // Validar que el drawer esté abierto/activo
    const drawer = await this.drawerRepo.findOne({
      where: { branchId: dto.branchId, shiftStatus: DrawerShiftStatus.OPEN },
    });

    if (!drawer) {
      throw new BadRequestException('No hay drawer abierto en esta sucursal');
    }

    // Validación de límites según tipo de transacción
    this.validateTransactionLimits(dto, drawer);

    const totalAmount = dto.amountPrincipal + (dto.feeCharged || 0);

    const transactionData: Partial<TellerTransaction> = {
      transactionType: dto.transactionType,
      amountPrincipal: dto.amountPrincipal,
      totalAmount,
      feeCharged: dto.feeCharged || 0,
      currencyCode: 'USD',
      foreignExchangeRate: dto.foreignExchangeRate ? dto.foreignExchangeRate : undefined,
      fromAccountId: dto.sourceAccountId,
      toAccountId: dto.destinationAccountId,
      overrideRequired: this.checkOverrideRequired(dto),
      receiptPrinted: false,
      transactionStatus: TellerTransactionStatus.PENDING,
      transactionReference: this.generateTransactionReference(),
    };

    // TypeORM create() tiene bug de tipado - usar cast
    const transaction = this.transactionRepo.create(transactionData) as unknown as TellerTransaction;
    
    transaction.branchId = dto.branchId;
    transaction.tellerUserId = dto.tellerUserId;
    transaction.customerId = dto.customerId;

    const saved = await this.transactionRepo.save(transaction);
    this.logger.log(`Transacción creada: ref=${saved.transactionReference}, status=PENDING`);

    // Incrementar contador de drawer (si existe)
    if (drawer.totalTransactionsCount !== undefined) {
      drawer.totalTransactionsCount += 1;
      await this.drawerRepo.save(drawer);
    }

    return saved;
  }

  /**
   * TX-002: Obtener transacción por referencia
   */
  async getByReference(transactionReference: string): Promise<TellerTransaction> {
    const tx = await this.transactionRepo.findOne({ where: { transactionReference } });
    if (!tx) {
      throw new NotFoundException(`Transacción ${transactionReference} no encontrada`);
    }
    return tx;
  }

  /**
   * TX-003: Listar transacciones con filtros
   */
  async findByCriteria(
    branchId?: string,
    tellerUserId?: string,
    transactionType?: TellerTransactionType,
    fromDate?: Date,
    toDate?: Date,
  ): Promise<TellerTransaction[]> {
    const queryBuilder = this.transactionRepo.createQueryBuilder('tx')
      .orderBy('tx.processedAt', 'DESC')
      .take(100);

    if (branchId) {
      queryBuilder.andWhere('tx.branchId = :branchId', { branchId });
    }
    if (tellerUserId) {
      queryBuilder.andWhere('tx.tellerUserId = :tellerUserId', { tellerUserId });
    }
    if (transactionType) {
      queryBuilder.andWhere('tx.transactionType = :transactionType', { transactionType });
    }
    if (fromDate) {
      queryBuilder.andWhere('tx.processedAt >= :fromDate', { fromDate });
    }
    if (toDate) {
      queryBuilder.andWhere('tx.processedAt <= :toDate', { toDate });
    }

    return queryBuilder.getMany();
  }

  /**
   * TX-004: Confirmar/completar transacción
   */
  async confirmTransaction(
    transactionId: string,
    confirmationData: {
      ledgerJournalEntryId?: string;
      dualControlWitnessId?: string;
    },
  ): Promise<TellerTransaction> {
    const tx = await this.getByReference(transactionId);

    tx.transactionStatus = TellerTransactionStatus.COMPLETED;
    if (confirmationData.ledgerJournalEntryId) {
      tx.ledgerJournalEntryId = confirmationData.ledgerJournalEntryId;
    }
    if (confirmationData.dualControlWitnessId) {
      tx.dualControlWitnessId = confirmationData.dualControlWitnessId;
    }
    tx.receiptPrinted = true;
    tx.processedAt = new Date();

    const updated = await this.transactionRepo.save(tx);
    this.logger.log(`Transacción confirmada: ref=${updated.transactionReference}`);

    return updated;
  }

  /**
   * TX-005: Revertir transacción
   */
  async reverseTransaction(
    transactionId: string,
    reversalReason: string,
    reversedByUserId: string,
  ): Promise<TellerTransaction> {
    const tx = await this.getByReference(transactionId);

    if (tx.transactionStatus === TellerTransactionStatus.REVERSED) {
      throw new BadRequestException('Transacción ya está revertida');
    }

    if (tx.transactionStatus !== TellerTransactionStatus.COMPLETED) {
      throw new BadRequestException('Solo se pueden revertir transacciones completadas');
    }

    tx.transactionStatus = TellerTransactionStatus.REVERSED;
    tx.reversalReason = reversalReason;
    tx.overrideApprovedBy = reversedByUserId;

    const updated = await this.transactionRepo.save(tx);
    this.logger.log(`Transacción revertida: ref=${updated.transactionReference}, reason=${reversalReason}`);

    return updated;
  }

  /**
   * TX-006: Void (anular) transacción pendiente
   */
  async voidTransaction(
    transactionId: string,
    voidReason: string,
  ): Promise<TellerTransaction> {
    const tx = await this.getByReference(transactionId);

    if (tx.transactionStatus === TellerTransactionStatus.COMPLETED) {
      throw new BadRequestException('Transacción completada debe revertirse, no voidarse');
    }

    tx.transactionStatus = TellerTransactionStatus.VOIDED;
    tx.reversalReason = voidReason;

    return this.transactionRepo.save(tx);
  }

  /**
   * Generar número de referencia único para transacción
   */
  private generateTransactionReference(): string {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `TX-${yearMonth}-${random}`;
  }

  /**
   * Determinar si requiere override según monto y tipo
   */
  private checkOverrideRequired(dto: TransactDto): boolean {
    const { amountPrincipal, transactionType } = dto;

    switch (transactionType) {
      case TellerTransactionType.WITHDRAWAL_CASH:
        return amountPrincipal > 10000;
      case TellerTransactionType.TRANSFER_INTERNAL:
        return amountPrincipal > 50000;
      case TellerTransactionType.FOREIGN_EXCHANGE:
        return amountPrincipal > 25000;
      default:
        return false;
    }
  }

  /**
   * Valida límites de transacción según configuración del drawer
   */
  private validateTransactionLimits(dto: TransactDto, drawer: TellerCashDrawer): void {
    const { amountPrincipal, transactionType } = dto;

    // Límite diario acumulado (placeholder - en prod consultar histórico)
    const dailyTotal = 0;

    const limit = drawer.maxCashLimit;
    if (limit && (dailyTotal + amountPrincipal > limit)) {
      throw new BadRequestException('La transacción excede el límite diario del drawer');
    }

    // Límites específicos por tipo
    switch (transactionType) {
      case TellerTransactionType.WITHDRAWAL_CASH:
        if (amountPrincipal > 10000) {
          throw new BadRequestException('Retiro mayor a $10,000 requiere autorización de supervisor');
        }
        break;
      case TellerTransactionType.DEPOSIT_CASH:
      case TellerTransactionType.DEPOSIT_CHECK:
        // Depósitos generalmente ilimitados
        break;
      case TellerTransactionType.TRANSFER_INTERNAL:
        if (amountPrincipal > 50000) {
          throw new BadRequestException('Transferencia mayor a $50,000 requiere doble control');
        }
        break;
      case TellerTransactionType.FOREIGN_EXCHANGE:
        if (amountPrincipal > 25000) {
          throw new BadRequestException('Intercambio FX mayor a $25,000 requiere autorización');
        }
        break;
      default:
        break;
    }
  }
}
