import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Logger } from '@nestjs/common';
import { TellerCashDrawer, DrawerShiftStatus, VarianceType } from '../entities/teller-cash-drawer.entity';
import { DrawerOpenDto } from '../dto/drawer-open.dto';
import { DrawerCloseDto } from '../dto/drawer-close.dto';

@Injectable()
export class DrawerManagementService {
  private readonly logger = new Logger(DrawerManagementService.name);

  constructor(
    @InjectRepository(TellerCashDrawer)
    private drawerRepo: Repository<TellerCashDrawer>,
  ) {}

  /**
   * DRW-001: Abrir drawer de cajero
   */
  async openDrawer(dto: DrawerOpenDto): Promise<TellerCashDrawer> {
    this.logger.log(`Abriendo drawer ${dto.drawerNumber} para teller=${dto.tellerUserId}`);

    // Verificar que no haya un drawer abierto para este cajero
    const existing = await this.drawerRepo.findOne({
      where: { tellerUserId: dto.tellerUserId, shiftStatus: DrawerShiftStatus.OPEN },
    });

    if (existing) {
      throw new BadRequestException(`Cajero ya tiene drawer abierto: ${existing.drawerNumber}`);
    }

    // Verificar que el drawer no esté ya en uso
    const drawerInUse = await this.drawerRepo.findOne({
      where: { drawerNumber: dto.drawerNumber, shiftStatus: DrawerShiftStatus.OPEN },
    });

    if (drawerInUse) {
      throw new BadRequestException(`Drawer ${dto.drawerNumber} ya está en uso`);
    }

    const drawerData: Partial<TellerCashDrawer> = {
      drawerNumber: dto.drawerNumber,
      branchId: dto.branchId,
      tellerUserId: dto.tellerUserId,
      shiftStatus: DrawerShiftStatus.OPEN,
      openingBalanceTotal: dto.openingBalanceTotal,
      currentBalanceTotal: dto.openingBalanceTotal,
      denominationBreakdownOpen: dto.denominationBreakdown ? dto.denominationBreakdown as unknown as Record<string, unknown> : undefined,
      maxCashLimit: dto.maxCashLimit,
      varianceAmount: 0,
      varianceType: VarianceType.BALANCED,
      totalTransactionsCount: 0,
      openedAt: new Date(),
    };

    const drawer = this.drawerRepo.create(drawerData) as unknown as TellerCashDrawer;

    const saved = await this.drawerRepo.save(drawer);
    this.logger.log(`Drawer abierto: ${saved.drawerNumber}, balance=${saved.openingBalanceTotal}`);

    return saved;
  }

  /**
   * DRW-002: Cerrar drawer con conteo de billetes
   */
  async closeDrawer(dto: DrawerCloseDto): Promise<TellerCashDrawer> {
    this.logger.log(`Cerrando drawer id=${dto.drawerId}`);

    const drawer = await this.drawerRepo.findOne({ where: { id: dto.drawerId } });
    if (!drawer) {
      throw new NotFoundException(`Drawer ${dto.drawerId} no encontrado`);
    }

    if (drawer.shiftStatus === DrawerShiftStatus.CLOSED) {
      throw new BadRequestException('Drawer ya está cerrado');
    }

    const currentBalance = drawer.currentBalanceTotal ?? 0;
    const variance = dto.closingBalanceTotal - currentBalance;
    const absVariance = Math.abs(variance);

    // Determinar tipo de varianza
    let varianceType: VarianceType;
    if (absVariance < 0.01) {
      varianceType = VarianceType.BALANCED;
    } else if (variance > 0) {
      varianceType = VarianceType.SURPLUS;
    } else {
      varianceType = VarianceType.SHORTAGE;
    }

    // Si la varianza es significativa, requiere override
    const VARIANCE_THRESHOLD = 50.00;
    if (absVariance > VARIANCE_THRESHOLD && !dto.overrideApprovedBy) {
      throw new BadRequestException(
        `Varianza de $${absVariance.toFixed(2)} requiere autorización de supervisor`,
      );
    }

    drawer.shiftStatus = DrawerShiftStatus.CLOSED;
    drawer.closingBalanceTotal = dto.closingBalanceTotal;
    drawer.denominationBreakdownClose = dto.denominationBreakdownClose
      ? dto.denominationBreakdownClose as unknown as Record<string, unknown>
      : undefined;
    drawer.varianceAmount = variance;
    drawer.varianceType = varianceType;
    drawer.closedAt = new Date();

    if (dto.overrideApprovedBy) {
      drawer.overrideApprovedBy = dto.overrideApprovedBy;
    }

    const saved = await this.drawerRepo.save(drawer);
    this.logger.log(
      `Drawer cerrado: ${saved.drawerNumber}, variance=${variance.toFixed(2)}, type=${varianceType}`,
    );

    return saved;
  }

  /**
   * DRW-003: Listar drawers activos por sucursal
   */
  async getActiveDrawers(branchId: string): Promise<TellerCashDrawer[]> {
    return this.drawerRepo.find({
      where: { branchId, shiftStatus: DrawerShiftStatus.OPEN },
      order: { openedAt: 'DESC' },
    });
  }

  /**
   * DRW-004: Listar todos los drawers con filtros
   */
  async getAllDrawers(
    branchId?: string,
    shiftStatus?: DrawerShiftStatus,
  ): Promise<TellerCashDrawer[]> {
    const where: Record<string, unknown> = {};
    if (branchId) where.branchId = branchId;
    if (shiftStatus) where.shiftStatus = shiftStatus;

    return this.drawerRepo.find({
      where,
      order: { openedAt: 'DESC' },
    });
  }

  /**
   * DRW-005: Obtener drawer por ID
   */
  async getById(drawerId: string): Promise<TellerCashDrawer> {
    const drawer = await this.drawerRepo.findOne({ where: { id: drawerId } });
    if (!drawer) {
      throw new NotFoundException(`Drawer ${drawerId} no encontrado`);
    }
    return drawer;
  }

  /**
   * DRW-006: Actualizar balance actual del drawer (tras transacción)
   */
  async updateCurrentBalance(
    drawerId: string,
    adjustment: number,
  ): Promise<void> {
    const drawer = await this.getById(drawerId);
    const current = drawer.currentBalanceTotal ?? 0;
    drawer.currentBalanceTotal = current + adjustment;
    await this.drawerRepo.save(drawer);
  }

  /**
   * DRW-007: Estadísticas diarias del cajero
   */
  async getDailyStats(tellerUserId: string, branchId: string): Promise<{
    totalDrawers: number;
    activeDrawers: number;
    totalTransactions: number;
    totalCashHandled: number;
    totalVariance: number;
  }> {
    const drawers = await this.drawerRepo.find({
      where: { tellerUserId, branchId },
    });

    const activeDrawers = drawers.filter(d => d.shiftStatus === DrawerShiftStatus.OPEN);
    const totalTransactions = drawers.reduce((sum, d) => sum + d.totalTransactionsCount, 0);
    const totalCashHandled = drawers.reduce((sum, d) => sum + Number(d.currentBalanceTotal ?? 0), 0);
    const totalVariance = drawers.reduce((sum, d) => sum + Number(d.varianceAmount ?? 0), 0);

    return {
      totalDrawers: drawers.length,
      activeDrawers: activeDrawers.length,
      totalTransactions,
      totalCashHandled,
      totalVariance,
    };
  }

  /**
   * DRW-008: Incrementar contadores de depósitos/retiros
   */
  async incrementTransactionCounts(
    drawerId: string,
    isDeposit: boolean,
    amount: number,
  ): Promise<void> {
    const drawer = await this.getById(drawerId);

    drawer.totalTransactionsCount += 1;
    if (isDeposit) {
      drawer.totalDepositsAmount = (drawer.totalDepositsAmount ?? 0) + amount;
    } else {
      drawer.totalWithdrawalsAmount = (drawer.totalWithdrawalsAmount ?? 0) + amount;
    }

    await this.drawerRepo.save(drawer);
  }
}
