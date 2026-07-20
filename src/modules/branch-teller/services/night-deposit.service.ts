import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Logger } from '@nestjs/common';
import { TellerNightDeposit, NightDepositType, NightDepositStatus } from '../entities/teller-night-deposit.entity';
import { NightDepositDto } from '../dto/night-deposit.dto';

@Injectable()
export class NightDepositService {
  private readonly logger = new Logger(NightDepositService.name);

  constructor(
    @InjectRepository(TellerNightDeposit)
    private nightDepositRepo: Repository<TellerNightDeposit>,
  ) {}

  /**
   * NDP-001: Registrar depósito nocturno recibido
   */
  async createDeposit(dto: NightDepositDto): Promise<TellerNightDeposit> {
    this.logger.log(`Registrando depósito nocturno: ${dto.depositReference}`);

    // Verificar que el depósito no exista
    const existing = await this.nightDepositRepo.findOne({
      where: { depositReference: dto.depositReference },
    });

    if (existing) {
      throw new BadRequestException(`Depósito ${dto.depositReference} ya registrado`);
    }

    const depositData: Partial<TellerNightDeposit> = {
      depositReference: dto.depositReference,
      branchId: dto.branchId,
      customerId: dto.customerId,
      accountId: dto.accountId,
      depositType: dto.depositType,
      bagIdentifier: dto.bagIdentifier,
      statedCashAmount: dto.statedCashAmount,
      statedCheckCount: dto.statedCheckCount,
      statedCheckTotal: dto.statedCheckTotal,
      currencyCode: dto.currencyCode || 'USD',
      depositStatus: NightDepositStatus.RECEIVED,
      depositedAt: new Date(),
    };

    const deposit = this.nightDepositRepo.create(depositData) as unknown as TellerNightDeposit;
    const saved = await this.nightDepositRepo.save(deposit);

    this.logger.log(`Depósito registrado: ref=${saved.depositReference}, status=RECEIVED`);

    return saved;
  }

  /**
   * NDP-002: Obtener depósito por ID
   */
  async getById(depositId: string): Promise<TellerNightDeposit> {
    const deposit = await this.nightDepositRepo.findOne({ where: { id: depositId } });
    if (!deposit) {
      throw new NotFoundException(`Depósito ${depositId} no encontrado`);
    }
    return deposit;
  }

  /**
   * NDP-003: Obtener depósito por referencia
   */
  async getByReference(reference: string): Promise<TellerNightDeposit> {
    const deposit = await this.nightDepositRepo.findOne({
      where: { depositReference: reference },
    });
    if (!deposit) {
      throw new NotFoundException(`Depósito ${reference} no encontrado`);
    }
    return deposit;
  }

  /**
   * NDP-004: Listar depósitos nocturnos con filtros
   */
  async findByCriteria(
    branchId?: string,
    customerId?: string,
    status?: NightDepositStatus,
    fromDate?: Date,
    toDate?: Date,
  ): Promise<TellerNightDeposit[]> {
    const queryBuilder = this.nightDepositRepo.createQueryBuilder('nd')
      .orderBy('nd.depositedAt', 'DESC')
      .take(100);

    if (branchId) {
      queryBuilder.andWhere('nd.branchId = :branchId', { branchId });
    }
    if (customerId) {
      queryBuilder.andWhere('nd.customerId = :customerId', { customerId });
    }
    if (status) {
      queryBuilder.andWhere('nd.depositStatus = :status', { status });
    }
    if (fromDate) {
      queryBuilder.andWhere('nd.depositedAt >= :fromDate', { fromDate });
    }
    if (toDate) {
      queryBuilder.andWhere('nd.depositedAt <= :toDate', { toDate });
    }

    return queryBuilder.getMany();
  }

  /**
   * NDP-005: Iniciar apertura de depósito (con doble control)
   */
  async initiateOpening(
    depositId: string,
    openedByUserId: string,
    witnessUserId?: string,
  ): Promise<TellerNightDeposit> {
    const deposit = await this.getById(depositId);

    if (deposit.depositStatus !== NightDepositStatus.RECEIVED) {
      throw new BadRequestException('Solo se pueden abrir depósitos en estado RECEIVED');
    }

    deposit.receivedByUserId = openedByUserId;
    deposit.depositStatus = NightDepositStatus.OPENED;
    deposit.processedAt = undefined;

    const saved = await this.nightDepositRepo.save(deposit);
    this.logger.log(`Depósito abierto: ref=${saved.depositReference}`);

    return saved;
  }

  /**
   * NDP-006: Completar procesamiento del depósito con conteo
   */
  async completeProcessing(
    depositId: string,
    processingData: {
      processedByUserId: string;
      countedCashAmount?: number;
      countedCheckCount?: number;
      countedCheckTotal?: number;
      denominationBreakdown?: Record<string, unknown>;
      checkDetails?: Record<string, unknown>;
      discrepancyNotes?: string;
      ledgerJournalEntryId?: string;
    },
  ): Promise<TellerNightDeposit> {
    const deposit = await this.getById(depositId);

    if (deposit.depositStatus !== NightDepositStatus.OPENED) {
      throw new BadRequestException('Solo se pueden procesar depósitos en estado OPENED');
    }

    // Calcular discrepancia
    let varianceAmount = 0;
    if (processingData.countedCashAmount !== undefined && deposit.statedCashAmount !== undefined) {
      varianceAmount = (processingData.countedCashAmount ?? 0) - deposit.statedCashAmount;
    }

    // Determinar estado basado en discrepancia
    const absVariance = Math.abs(varianceAmount);
    const VARIANCE_THRESHOLD = 1.00;

    if (absVariance > VARIANCE_THRESHOLD) {
      deposit.depositStatus = NightDepositStatus.DISCREPANCY;
      deposit.discrepancyNotes = processingData.discrepancyNotes || `Varianza de $${varianceAmount.toFixed(2)}`;
    } else {
      deposit.depositStatus = NightDepositStatus.PROCESSED;
    }

    // Aplicar datos de conteo
    deposit.processedByUserId = processingData.processedByUserId;
    deposit.countedCashAmount = processingData.countedCashAmount;
    deposit.countedCheckCount = processingData.countedCheckCount;
    deposit.countedCheckTotal = processingData.countedCheckTotal;
    deposit.denominationBreakdown = processingData.denominationBreakdown;
    deposit.checkDetails = processingData.checkDetails;
    deposit.varianceAmount = varianceAmount;
    deposit.processedAt = new Date();
    deposit.ledgerJournalEntryId = processingData.ledgerJournalEntryId;

    const saved = await this.nightDepositRepo.save(deposit);
    this.logger.log(
      `Depósito procesado: ref=${saved.depositReference}, status=${saved.depositStatus}, variance=${varianceAmount.toFixed(2)}`,
    );

    return saved;
  }

  /**
   * NDP-007: Marcar depósito como rechazado
   */
  async rejectDeposit(
    depositId: string,
    rejectionReason: string,
    rejectedByUserId: string,
  ): Promise<TellerNightDeposit> {
    const deposit = await this.getById(depositId);

    if (deposit.depositStatus === NightDepositStatus.PROCESSED) {
      throw new BadRequestException('Depósito ya procesado, no puede rechazarse');
    }

    deposit.depositStatus = NightDepositStatus.REJECTED;
    deposit.discrepancyNotes = rejectionReason;
    deposit.processedByUserId = rejectedByUserId;

    const saved = await this.nightDepositRepo.save(deposit);
    this.logger.log(`Depósito rechazado: ref=${saved.depositReference}, reason=${rejectionReason}`);

    return saved;
  }

  /**
   * NDP-008: Resumir discrepancia
   */
  async recordDiscrepancyResolution(
    depositId: string,
    resolutionNotes: string,
    resolvedByUserId: string,
  ): Promise<TellerNightDeposit> {
    const deposit = await this.getById(depositId);

    if (deposit.depositStatus !== NightDepositStatus.DISCREPANCY) {
      throw new BadRequestException('Solo se pueden resolver depósitos en estado DISCREPANCY');
    }

    deposit.depositStatus = NightDepositStatus.PROCESSED;
    deposit.discrepancyNotes = `${deposit.discrepancyNotes}\nResolución: ${resolutionNotes}`;
    deposit.processedByUserId = resolvedByUserId;

    return this.nightDepositRepo.save(deposit);
  }
}
