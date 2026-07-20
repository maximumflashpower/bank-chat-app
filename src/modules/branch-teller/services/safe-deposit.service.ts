import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Logger } from '@nestjs/common';
import { TellerSafeDepositBox, SafeDepositBoxStatus, SafeDepositBoxSize } from '../entities/teller-safe-deposit-box.entity';
import { SafeBoxRentDto, SafeBoxAccessDto, SafeBoxReturnDto } from '../dto/safe-box.dto';

@Injectable()
export class SafeDepositService {
  private readonly logger = new Logger(SafeDepositService.name);

  constructor(
    @InjectRepository(TellerSafeDepositBox)
    private safeBoxRepo: Repository<TellerSafeDepositBox>,
  ) {}

  /**
   * SDB-001: Rentar caja de seguridad a cliente
   */
  async rentBox(dto: SafeBoxRentDto): Promise<TellerSafeDepositBox> {
    this.logger.log(`Rentando caja ${dto.boxNumber} a cliente=${dto.customerId}`);

    const box = await this.safeBoxRepo.findOne({
      where: { boxNumber: dto.boxNumber, branchId: dto.branchId },
    });

    if (!box) {
      throw new NotFoundException(`Caja ${dto.boxNumber} no encontrada en sucursal`);
    }

    if (box.boxStatus !== SafeDepositBoxStatus.AVAILABLE) {
      throw new BadRequestException(`Caja ${dto.boxNumber} no está disponible (status=${box.boxStatus})`);
    }

    box.boxStatus = SafeDepositBoxStatus.RENTED;
    box.customerId = dto.customerId;
    box.jointRenterId = dto.jointRenterId;
    box.billingAccountId = dto.billingAccountId;
    box.currencyCode = dto.currencyCode || 'USD';
    box.autoRenew = dto.autoRenew ?? true;
    box.rentalStartDate = new Date();

    // Fecha de vencimiento: 1 año
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1);
    box.rentalEndDate = endDate;
    box.nextBillingDate = endDate;

    const saved = await this.safeBoxRepo.save(box);
    this.logger.log(`Caja rentada: ${saved.boxNumber}, cliente=${dto.customerId}, vence=${endDate.toISOString()}`);

    return saved;
  }

  /**
   * SDB-002: Registrar acceso a caja de seguridad
   */
  async registerAccess(dto: SafeBoxAccessDto): Promise<TellerSafeDepositBox> {
    this.logger.log(`Acceso a caja ${dto.safeDepositBoxId} por cliente=${dto.customerId}`);

    const box = await this.safeBoxRepo.findOne({ where: { id: dto.safeDepositBoxId } });
    if (!box) {
      throw new NotFoundException(`Caja ${dto.safeDepositBoxId} no encontrada`);
    }

    if (box.boxStatus !== SafeDepositBoxStatus.RENTED) {
      throw new BadRequestException('La caja no está rentada actualmente');
    }

    // Validar que el cliente sea el rentador o cotenante
    if (box.customerId !== dto.customerId && box.jointRenterId !== dto.customerId) {
      throw new BadRequestException('Cliente no autorizado para acceder a esta caja');
    }

    // Verificar pago al corriente
    if (box.overduePayment) {
      throw new BadRequestException(
        `Pago vencido de $${box.overdueAmount ?? 0}. Regularice antes de acceder.`,
      );
    }

    // Validar control dual
    if (box.dualControlRequired && !dto.witnessUserId) {
      throw new BadRequestException('Se requiere testigo (dual control) para acceder a esta caja');
    }

    box.lastAccessedAt = new Date();
    box.lastAccessedByCustomerId = dto.customerId;
    if (dto.witnessUserId) {
      box.lastAccessedByUserId = dto.witnessUserId;
    }
    box.totalAccessCount = (box.totalAccessCount ?? 0) + 1;

    const saved = await this.safeBoxRepo.save(box);
    this.logger.log(`Acceso registrado: caja=${saved.boxNumber}, total=${saved.totalAccessCount}`);

    return saved;
  }

  /**
   * SDB-003: Devolver caja de seguridad (fin de renta)
   */
  async returnBox(dto: SafeBoxReturnDto): Promise<TellerSafeDepositBox> {
    this.logger.log(`Devolución de caja ${dto.safeDepositBoxId}`);

    const box = await this.safeBoxRepo.findOne({ where: { id: dto.safeDepositBoxId } });
    if (!box) {
      throw new NotFoundException(`Caja ${dto.safeDepositBoxId} no encontrada`);
    }

    if (box.boxStatus !== SafeDepositBoxStatus.RENTED) {
      throw new BadRequestException('La caja no está rentada actualmente');
    }

    if (box.customerId !== dto.customerId) {
      throw new BadRequestException('Solo el rentador puede devolver la caja');
    }

    // Verificar pagos pendientes
    if (box.overduePayment) {
      throw new BadRequestException(
        `No se puede devolver: pago vencido de $${box.overdueAmount ?? 0}`,
      );
    }

    box.boxStatus = SafeDepositBoxStatus.AVAILABLE;
    box.customerId = undefined;
    box.jointRenterId = undefined;
    box.billingAccountId = undefined;
    box.rentalStartDate = undefined;
    box.rentalEndDate = undefined;
    box.nextBillingDate = undefined;
    box.autoRenew = false;
    box.lastAccessedAt = undefined;
    box.lastAccessedByUserId = undefined;
    box.lastAccessedByCustomerId = undefined;
    box.totalAccessCount = 0;
    box.overduePayment = false;
    box.overdueAmount = undefined;
    if (dto.returnNotes) {
      box.notes = dto.returnNotes;
    }

    const saved = await this.safeBoxRepo.save(box);
    this.logger.log(`Caja devuelta: ${saved.boxNumber}, ahora disponible`);

    return saved;
  }

  /**
   * SDB-004: Listar cajas de un cliente
   */
  async listByCustomer(customerId: string): Promise<TellerSafeDepositBox[]> {
    return this.safeBoxRepo.find({
      where: { customerId },
      order: { rentalStartDate: 'DESC' },
    });
  }

  /**
   * SDB-005: Listar cajas por sucursal
   */
  async listByBranch(
    branchId: string,
    status?: SafeDepositBoxStatus,
  ): Promise<TellerSafeDepositBox[]> {
    const where: Record<string, unknown> = { branchId };
    if (status) where.boxStatus = status;

    return this.safeBoxRepo.find({
      where,
      order: { boxNumber: 'ASC' },
    });
  }

  /**
   * SDB-006: Obtener caja por ID
   */
  async getById(boxId: string): Promise<TellerSafeDepositBox> {
    const box = await this.safeBoxRepo.findOne({ where: { id: boxId } });
    if (!box) {
      throw new NotFoundException(`Caja ${boxId} no encontrada`);
    }
    return box;
  }

  /**
   * SDB-007: Crear nueva caja de seguridad (admin)
   */
  async createBox(data: {
    boxNumber: string;
    branchId: string;
    boxSize: SafeDepositBoxSize;
    vaultLocation?: string;
    annualRentalFee: number;
    requiredKeysCount?: number;
    dualControlRequired?: boolean;
  }): Promise<TellerSafeDepositBox> {
    const existing = await this.safeBoxRepo.findOne({
      where: { boxNumber: data.boxNumber, branchId: data.branchId },
    });

    if (existing) {
      throw new BadRequestException(`Caja ${data.boxNumber} ya existe`);
    }

    const boxData: Partial<TellerSafeDepositBox> = {
      boxNumber: data.boxNumber,
      branchId: data.branchId,
      boxSize: data.boxSize,
      vaultLocation: data.vaultLocation,
      boxStatus: SafeDepositBoxStatus.AVAILABLE,
      annualRentalFee: data.annualRentalFee,
      currencyCode: 'USD',
      requiredKeysCount: data.requiredKeysCount ?? 2,
      dualControlRequired: data.dualControlRequired ?? true,
      autoRenew: false,
      totalAccessCount: 0,
      overduePayment: false,
    };

    const box = this.safeBoxRepo.create(boxData) as unknown as TellerSafeDepositBox;
    const saved = await this.safeBoxRepo.save(box);
    this.logger.log(`Caja creada: ${saved.boxNumber}, size=${data.boxSize}, fee=${data.annualRentalFee}`);

    return saved;
  }

  /**
   * SDB-008: Poner caja en mantenimiento
   */
  async setMaintenance(boxId: string, reason: string): Promise<TellerSafeDepositBox> {
    const box = await this.getById(boxId);

    if (box.boxStatus === SafeDepositBoxStatus.RENTED) {
      throw new BadRequestException('No se puede poner en mantenimiento una caja rentada');
    }

    box.boxStatus = SafeDepositBoxStatus.MAINTENANCE;
    box.notes = `Mantenimiento: ${reason}`;

    return this.safeBoxRepo.save(box);
  }

  /**
   * SDB-009: Reactivar caja de mantenimiento
   */
  async reactivateBox(boxId: string): Promise<TellerSafeDepositBox> {
    const box = await this.getById(boxId);

    if (box.boxStatus !== SafeDepositBoxStatus.MAINTENANCE) {
      throw new BadRequestException('Solo se pueden reactivar cajas en mantenimiento');
    }

    box.boxStatus = SafeDepositBoxStatus.AVAILABLE;

    return this.safeBoxRepo.save(box);
  }

  /**
   * SDB-010: Renovar renta anual
   */
  async renewRental(boxId: string, renewedByUserId: string): Promise<TellerSafeDepositBox> {
    const box = await this.getById(boxId);

    if (box.boxStatus !== SafeDepositBoxStatus.RENTED) {
      throw new BadRequestException('Solo se pueden renovar cajas rentadas');
    }

    const newEndDate = new Date(box.rentalEndDate ?? new Date());
    newEndDate.setFullYear(newEndDate.getFullYear() + 1);

    box.rentalEndDate = newEndDate;
    box.nextBillingDate = newEndDate;
    box.overduePayment = false;
    box.overdueAmount = undefined;

    const saved = await this.safeBoxRepo.save(box);
    this.logger.log(`Renta renovada: caja=${saved.boxNumber}, nuevo vencimiento=${newEndDate.toISOString()}`);

    return saved;
  }
}
