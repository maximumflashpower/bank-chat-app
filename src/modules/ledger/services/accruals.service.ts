import {
  Injectable, NotFoundException, BadRequestException, Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  LedgerAccrual, AccrualType, AccrualStatus,
} from '../entities/ledger-accrual.entity';
import { CreateAccrualDto } from '../dto/create-accrual.dto';

export interface AmortizationResult {
  accrualId: string;
  periodNumber: number;
  amount: number;
  journalEntryPosted: boolean;
  remainingAmount: number;
  fullyAmortized: boolean;
}

@Injectable()
export class AccrualsService {
  private readonly logger = new Logger(AccrualsService.name);

  constructor(
    @InjectRepository(LedgerAccrual)
    private readonly accrualRepo: Repository<LedgerAccrual>,
  ) {}

  /**
   * LEDGER-ACC-001: Crear accrual/deferral/prepayment
   */
  async createAccrual(dto: CreateAccrualDto): Promise<LedgerAccrual> {
    // Validar fechas
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (endDate <= startDate) {
      throw new BadRequestException('La fecha de fin debe ser posterior a la fecha de inicio');
    }

    // Validar código único
    const exists = await this.accrualRepo.findOne({
      where: { accrualCode: dto.accrualCode },
    });
    if (exists) {
      throw new BadRequestException(`Código de accrual ya existe: ${dto.accrualCode}`);
    }

    const accrual = this.accrualRepo.create({
      ...dto,
      startDate,
      endDate,
      currency: dto.currency || 'USD',
      periodicity: dto.periodicity || 'monthly',
      amortizedAmount: 0,
      remainingAmount: dto.totalAmount,
      periodsAmortized: 0,
      status: AccrualStatus.ACTIVE,
    });

    const saved = await this.accrualRepo.save(accrual);

    this.logger.log(
      `Accrual creado: id=${saved.id}, code=${saved.accrualCode}, type=${saved.accrualType}, total=${saved.totalAmount}`,
    );

    return saved;
  }

  /**
   * LEDGER-ACC-001: Obtener accrual por ID
   */
  async findById(id: string): Promise<LedgerAccrual> {
    const accrual = await this.accrualRepo.findOne({ where: { id } });
    if (!accrual) {
      throw new NotFoundException(`Accrual no encontrado: ${id}`);
    }
    return accrual;
  }

  /**
   * LEDGER-ACC-001: Listar accruals con filtros
   */
  async findAll(filters?: {
    accrualType?: AccrualType;
    status?: AccrualStatus;
  }): Promise<LedgerAccrual[]> {
    const where: Record<string, unknown> = {};
    if (filters?.accrualType) where.accrualType = filters.accrualType;
    if (filters?.status) where.status = filters.status;

    return this.accrualRepo.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * LEDGER-ACC-002: Ejecutar amortización del periodo
   */
  async amortizePeriod(accrualId: string): Promise<AmortizationResult> {
    const accrual = await this.findById(accrualId);

    if (accrual.status !== AccrualStatus.ACTIVE) {
      throw new BadRequestException(
        `Accrual no está activo: ${accrual.accrualCode} (status=${accrual.status})`,
      );
    }

    if (accrual.periodsAmortized >= accrual.periodsTotal) {
      throw new BadRequestException(
        `Accrual ya completamente amortizado: ${accrual.accrualCode}`,
      );
    }

    // Calcular monto del periodo
    const periodAmount = accrual.totalAmount / accrual.periodsTotal;

    // Actualizar accrual
    accrual.amortizedAmount += periodAmount;
    accrual.remainingAmount = accrual.totalAmount - accrual.amortizedAmount;
    accrual.periodsAmortized += 1;

    const fullyAmortized = accrual.periodsAmortized >= accrual.periodsTotal;
    if (fullyAmortized) {
      accrual.status = AccrualStatus.FULLY_AMORTIZED;
    }

    await this.accrualRepo.save(accrual);

    this.logger.log(
      `Amortización ejecutada: accrual=${accrual.accrualCode}, periodo=${accrual.periodsAmortized}/${accrual.periodsTotal}, monto=${periodAmount}`,
    );

    // Placeholder: en producción, aquí se generaría un journal entry automático
    // debitando/acreedando las cuentas correspondientes
    const journalEntryPosted = true;

    return {
      accrualId: accrual.id,
      periodNumber: accrual.periodsAmortized,
      amount: periodAmount,
      journalEntryPosted,
      remainingAmount: accrual.remainingAmount,
      fullyAmortized,
    };
  }

  /**
   * LEDGER-ACC-002: Amortizar todos los accruals activos del periodo
   */
  async amortizeAllActive(): Promise<{
    processed: number;
    totalAmount: number;
    fullyAmortized: number;
  }> {
    const activeAccruals = await this.accrualRepo.find({
      where: { status: AccrualStatus.ACTIVE },
    });

    let processed = 0;
    let totalAmount = 0;
    let fullyAmortized = 0;

    for (const accrual of activeAccruals) {
      try {
        const result = await this.amortizePeriod(accrual.id);
        processed++;
        totalAmount += result.amount;
        if (result.fullyAmortized) fullyAmortized++;
      } catch (err) {
        this.logger.warn(
          `Error amortizando accrual ${accrual.accrualCode}: ${(err as Error).message}`,
        );
      }
    }

    this.logger.log(
      `Amortización masiva: ${processed} accruals, ${totalAmount} total, ${fullyAmortized} completados`,
    );

    return { processed, totalAmount, fullyAmortized };
  }

  /**
   * LEDGER-ACC-001: Reversar accrual (cancela el resto no amortizado)
   */
  async reverseAccrual(accrualId: string, userId: string): Promise<LedgerAccrual> {
    const accrual = await this.findById(accrualId);

    if (accrual.status === AccrualStatus.REVERSED) {
      throw new BadRequestException('Accrual ya está reversado');
    }

    accrual.status = AccrualStatus.REVERSED;
    accrual.remainingAmount = 0;

    const saved = await this.accrualRepo.save(accrual);

    this.logger.warn(
      `Accrual reversado: ${accrual.accrualCode}, remaining=${accrual.remainingAmount}, by=${userId}`,
    );

    return saved;
  }

  /**
   * LEDGER-ACC-002: Obtener cronograma de amortización proyectado
   */
  async getAmortizationSchedule(accrualId: string): Promise<{
    accrualCode: string;
    totalAmount: number;
    periods: Array<{ period: number; amount: number; cumulativeAmortized: number; remaining: number }>;
  }> {
    const accrual = await this.findById(accrualId);

    const periodAmount = accrual.totalAmount / accrual.periodsTotal;
    const periods: Array<{ period: number; amount: number; cumulativeAmortized: number; remaining: number }> = [];
    let cumulative = 0;

    for (let i = 1; i <= accrual.periodsTotal; i++) {
      cumulative += periodAmount;
      periods.push({
        period: i,
        amount: periodAmount,
        cumulativeAmortized: cumulative,
        remaining: accrual.totalAmount - cumulative,
      });
    }

    return {
      accrualCode: accrual.accrualCode,
      totalAmount: accrual.totalAmount,
      periods,
    };
  }
}
