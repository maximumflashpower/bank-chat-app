import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Logger } from '@nestjs/common';
import { TellerVault } from '../entities/teller-vault.entity';
import { TellerVaultMovement, VaultMovementType, VaultMovementStatus } from '../entities/teller-vault-movement.entity';
import { VaultMoveDto } from '../dto/vault-move.dto';

@Injectable()
export class VaultService {
  private readonly logger = new Logger(VaultService.name);

  constructor(
    @InjectRepository(TellerVault)
    private vaultRepo: Repository<TellerVault>,
    @InjectRepository(TellerVaultMovement)
    private movementRepo: Repository<TellerVaultMovement>,
  ) {}

  /**
   * VLT-001: Listar todas las cajas fuertes activas
   */
  async findAll(branchId?: string): Promise<TellerVault[]> {
    const where: Record<string, unknown> = {};
    if (branchId) where.branchId = branchId;

    return this.vaultRepo.find({
      where: { isActive: true },
      order: { vaultIdentifier: 'ASC' },
    });
  }

  /**
   * VLT-002: Obtener caja fuerte por ID
   */
  async getById(vaultId: string): Promise<TellerVault> {
    const vault = await this.vaultRepo.findOne({ where: { id: vaultId } });
    if (!vault) {
      throw new NotFoundException(`Caja fuerte ${vaultId} no encontrada`);
    }
    return vault;
  }

  /**
   * VLT-003: Crear caja fuerte de sucursal
   */
  async createVault(data: {
    branchId: string;
    vaultIdentifier: string;
    vaultGrade: string;
    primaryCustodianId: string;
    dualControlRequired: boolean;
    initialBalance: number;
  }): Promise<TellerVault> {
    const existing = await this.vaultRepo.findOne({
      where: { branchId: data.branchId, vaultIdentifier: data.vaultIdentifier },
    });

    if (existing) {
      throw new BadRequestException(`Caja fuerte ${data.vaultIdentifier} ya existe`);
    }

    const vaultData: Partial<TellerVault> = {
      branchId: data.branchId,
      vaultIdentifier: data.vaultIdentifier,
      vaultGrade: data.vaultGrade,
      currentBalanceTotal: data.initialBalance,
      primaryCustodianId: data.primaryCustodianId,
      dualControlRequired: data.dualControlRequired,
      isLocked: false,
      isActive: true,
    };

    const vault = this.vaultRepo.create(vaultData) as unknown as TellerVault;
    const saved = await this.vaultRepo.save(vault);

    // Registrar movimiento inicial
    await this.registerMovement({
      vaultId: saved.id,
      movementType: VaultMovementType.CASH_IN,
      amountTotal: data.initialBalance,
      requestedByUserId: data.primaryCustodianId,
      purposeDescription: 'Apertura inicial de caja fuerte',
    });

    return saved;
  }

  /**
   * VLT-004: Ejecutar movimiento de caja fuerte
   */
  async executeMovement(dto: VaultMoveDto): Promise<TellerVaultMovement> {
    this.logger.log(`Ejecutando movimiento: type=${dto.movementType}, amount=${dto.amountTotal}`);

    const vault = await this.getById(dto.vaultId);

    // Validar saldos según tipo de movimiento
    if (dto.movementType === VaultMovementType.CASH_OUT ||
        dto.movementType === VaultMovementType.TRANSFER_OUT) {
      if ((vault.currentBalanceTotal ?? 0) < dto.amountTotal) {
        throw new BadRequestException('Saldo insuficiente en caja fuerte');
      }
    }

    // Verificar control dual si aplica
    if (vault.dualControlRequired && !dto.requestedByUserId) {
      throw new BadRequestException('Se requiere control dual para esta caja fuerte');
    }

    const movementData: Partial<TellerVaultMovement> = {
      vaultId: dto.vaultId,
      movementType: dto.movementType,
      amountTotal: dto.amountTotal,
      denominationBreakdown: dto.denominationBreakdown
        ? dto.denominationBreakdown as unknown as Record<string, unknown>
        : undefined,
      currencyCode: dto.currencyCode || 'USD',
      sourceBranchId: dto.sourceBranchId,
      destinationBranchId: dto.destinationBranchId,
      requestedByUserId: dto.requestedByUserId,
      purposeDescription: dto.purposeDescription,
      movementStatus: VaultMovementStatus.PENDING,
    };

    const movement = this.movementRepo.create(movementData) as unknown as TellerVaultMovement;
    const saved = await this.movementRepo.save(movement);

    // Actualizar balance del vault
    await this.updateVaultBalance(
      dto.vaultId,
      dto.movementType,
      dto.amountTotal,
    );

    this.logger.log(`Movimiento registrado: ref=${saved.id}, status=PENDING`);

    return saved;
  }

  /**
   * VLT-005: Confirmar movimiento (con dual control)
   */
  async confirmMovement(
    movementId: string,
    authorizedByUserId: string,
    witnessUserId?: string,
  ): Promise<TellerVaultMovement> {
    const movement = await this.getMovementById(movementId);

    if (movement.movementStatus !== VaultMovementStatus.PENDING) {
      throw new BadRequestException('Movimiento no está en estado pendiente');
    }

    movement.movementStatus = VaultMovementStatus.COMPLETED;
    movement.authorizedByUserId = authorizedByUserId;
    movement.dualControlApproved = true;
    movement.dualControlWitnessId = witnessUserId;
    movement.executedAt = new Date();

    const saved = await this.movementRepo.save(movement);
    this.logger.log(`Movimiento confirmado: ref=${saved.id}`);

    return saved;
  }

  /**
   * VLT-006: Cancelar movimiento pendiente
   */
  async cancelMovement(
    movementId: string,
    reason: string,
    canceledByUserId: string,
  ): Promise<TellerVaultMovement> {
    const movement = await this.getMovementById(movementId);

    if (movement.movementStatus !== VaultMovementStatus.PENDING) {
      throw new BadRequestException('Solo se pueden cancelar movimientos pendientes');
    }

    movement.movementStatus = VaultMovementStatus.CANCELLED;
    movement.authorizationNotes = reason;
    movement.executedAt = undefined;

    return this.movementRepo.save(movement);
  }

  /**
   * VLT-007: Revertir movimiento completado
   */
  async reverseMovement(
    movementId: string,
    reason: string,
    reversedByUserId: string,
  ): Promise<TellerVaultMovement> {
    const movement = await this.getMovementById(movementId);

    if (movement.movementStatus !== VaultMovementStatus.COMPLETED) {
      throw new BadRequestException('Solo se pueden revertir movimientos completados');
    }

    movement.movementStatus = VaultMovementStatus.REVERSED;
    movement.reversalReasonId = reversedByUserId;
    movement.reversedAt = new Date();

    // Revertir balance del vault
    await this.revertVaultBalance(
      movement.vaultId,
      movement.movementType,
      movement.amountTotal,
    );

    return this.movementRepo.save(movement);
  }

  /**
   * VLT-008: Listar movimientos de caja fuerte
   */
  async getMovements(
    vaultId?: string,
    movementType?: VaultMovementType,
    status?: VaultMovementStatus,
    fromDate?: Date,
    toDate?: Date,
  ): Promise<TellerVaultMovement[]> {
    const queryBuilder = this.movementRepo.createQueryBuilder('mv')
      .orderBy('mv.createdAt', 'DESC')
      .take(100);

    if (vaultId) {
      queryBuilder.andWhere('mv.vaultId = :vaultId', { vaultId });
    }
    if (movementType) {
      queryBuilder.andWhere('mv.movementType = :movementType', { movementType });
    }
    if (status) {
      queryBuilder.andWhere('mv.movementStatus = :status', { status });
    }
    if (fromDate) {
      queryBuilder.andWhere('mv.createdAt >= :fromDate', { fromDate });
    }
    if (toDate) {
      queryBuilder.andWhere('mv.createdAt <= :toDate', { toDate });
    }

    return queryBuilder.getMany();
  }

  /**
   * VLT-009: Obtener balance actual de caja fuerte
   */
  async getCurrentBalance(vaultId: string): Promise<{
    vaultId: string;
    vaultIdentifier: string;
    currentBalanceTotal: number;
    lastAuditAt: Date | null;
  }> {
    const vault = await this.getById(vaultId);

    return {
      vaultId: vault.id,
      vaultIdentifier: vault.vaultIdentifier,
      currentBalanceTotal: vault.currentBalanceTotal ?? 0,
      lastAuditAt: vault.lastAuditAt ?? null,
    };
  }

  /**
   * VLT-010: Registrar auditoría física
   */
  async registerAudit(
    vaultId: string,
    auditedByUserId: string,
    physicalCountTotal: number,
    varianceAmount?: number,
    notes?: string,
  ): Promise<void> {
    const vault = await this.getById(vaultId);

    vault.lastAuditAt = new Date();
    vault.lastAuditedBy = auditedByUserId;

    if (varianceAmount !== undefined && Math.abs(varianceAmount) > 0.01) {
      vault.varianceAmount = varianceAmount;
    }

    await this.vaultRepo.save(vault);

    this.logger.log(
      `Auditoría registrada: vault=${vaultId}, physical=${physicalCountTotal}, variance=${varianceAmount}`,
    );
  }

  /**
   * Actualizar balance del vault tras movimiento
   */
  private async updateVaultBalance(
    vaultId: string,
    movementType: VaultMovementType,
    amount: number,
  ): Promise<void> {
    const vault = await this.getById(vaultId);
    const current = vault.currentBalanceTotal ?? 0;

    switch (movementType) {
      case VaultMovementType.CASH_IN:
      case VaultMovementType.TRANSFER_IN:
      case VaultMovementType.NIGHT_DEPOSIT:
      case VaultMovementType.ATM_RESTOCK:
        vault.currentBalanceTotal = current + amount;
        break;
      case VaultMovementType.CASH_OUT:
      case VaultMovementType.TRANSFER_OUT:
      case VaultMovementType.ADJUSTMENT:
        vault.currentBalanceTotal = current - amount;
        break;
    }

    await this.vaultRepo.save(vault);
  }

  /**
   * Revertir balance del vault tras reversión
   */
  private async revertVaultBalance(
    vaultId: string,
    movementType: VaultMovementType,
    amount: number,
  ): Promise<void> {
    const vault = await this.getById(vaultId);
    const current = vault.currentBalanceTotal ?? 0;

    // Invertir la lógica
    switch (movementType) {
      case VaultMovementType.CASH_IN:
      case VaultMovementType.TRANSFER_IN:
      case VaultMovementType.NIGHT_DEPOSIT:
      case VaultMovementType.ATM_RESTOCK:
        vault.currentBalanceTotal = current - amount;
        break;
      case VaultMovementType.CASH_OUT:
      case VaultMovementType.TRANSFER_OUT:
      case VaultMovementType.ADJUSTMENT:
        vault.currentBalanceTotal = current + amount;
        break;
    }

    await this.vaultRepo.save(vault);
  }

  /**
   * Helper: obtener movimiento por ID
   */
  private async getMovementById(movementId: string): Promise<TellerVaultMovement> {
    const movement = await this.movementRepo.findOne({ where: { id: movementId } });
    if (!movement) {
      throw new NotFoundException(`Movimiento ${movementId} no encontrado`);
    }
    return movement;
  }

  /**
   * Helper: registrar movimiento interno
   */
  private async registerMovement(dto: {
    vaultId: string;
    movementType: VaultMovementType;
    amountTotal: number;
    requestedByUserId: string;
    purposeDescription?: string;
  }): Promise<TellerVaultMovement> {
    const movementData: Partial<TellerVaultMovement> = {
      ...dto,
      currencyCode: 'USD',
      movementStatus: VaultMovementStatus.COMPLETED,
      executedAt: new Date(),
    };

    const movement = this.movementRepo.create(movementData) as unknown as TellerVaultMovement;
    return this.movementRepo.save(movement);
  }
}
