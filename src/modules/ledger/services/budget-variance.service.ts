import {
  Injectable, NotFoundException, BadRequestException, Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  LedgerBudget,
  LedgerEncumbrance,
  BudgetType,
  BudgetStatus,
  EncumbranceType,
  EncumbranceStatus,
} from '../entities/ledger-budget.entity';
import { CreateBudgetDto } from '../dto/create-budget.dto';

export interface VarianceReport {
  budgetId: string;
  budgetCode: string;
  budgetedAmount: number;
  actualAmount: number;
  committedAmount: number;
  encumberedAmount: number;
  availableBalance: number;
  varianceAmount: number;
  variancePercentage: number;
  isOverBudget: boolean;
}

@Injectable()
export class BudgetVarianceService {
  private readonly logger = new Logger(BudgetVarianceService.name);

  constructor(
    @InjectRepository(LedgerBudget)
    private readonly budgetRepo: Repository<LedgerBudget>,
    @InjectRepository(LedgerEncumbrance)
    private readonly encumbranceRepo: Repository<LedgerEncumbrance>,
  ) {}

  /**
   * LEDGER-BUD-001: Crear nuevo presupuesto
   */
  async createBudget(dto: CreateBudgetDto): Promise<LedgerBudget> {
    const exists = await this.budgetRepo.findOne({
      where: { budgetCode: dto.budgetCode },
    });
    if (exists) {
      throw new BadRequestException(`Código de presupuesto ya existe: ${dto.budgetCode}`);
    }

    const budget = this.budgetRepo.create({
      ...dto,
      currency: dto.currency || 'USD',
      remainingBalance: dto.budgetedAmount,
      status: BudgetStatus.DRAFT,
    });

    const saved = await this.budgetRepo.save(budget);

    this.logger.log(
      `Presupuesto creado: ${saved.budgetCode}, año=${saved.fiscalYear}, monto=${saved.budgetedAmount}`,
    );

    return saved;
  }

  /**
   * LEDGER-BUD-001: Aprobar presupuesto
   */
  async approveBudget(budgetId: string, approvedBy: string): Promise<LedgerBudget> {
    const budget = await this.findById(budgetId);

    if (budget.status !== BudgetStatus.DRAFT && budget.status !== BudgetStatus.REVISED) {
      throw new BadRequestException(
        `Presupuesto debe estar en draft o revised para aprobar (actual: ${budget.status})`,
      );
    }

    budget.status = BudgetStatus.APPROVED;
    budget.approvedBy = approvedBy;
    budget.approvedAt = new Date();

    return this.budgetRepo.save(budget);
  }

  /**
   * LEDGER-BUD-001: Obtener presupuesto por ID
   */
  async findById(id: string): Promise<LedgerBudget> {
    const budget = await this.budgetRepo.findOne({ where: { id } });
    if (!budget) {
      throw new NotFoundException(`Presupuesto no encontrado: ${id}`);
    }
    return budget;
  }

  /**
   * LEDGER-BUD-001: Listar presupuestos con filtros
   */
  async findAll(filters?: {
    budgetType?: BudgetType;
    status?: BudgetStatus;
    fiscalYear?: number;
  }): Promise<LedgerBudget[]> {
    const where: Record<string, unknown> = {};
    if (filters?.budgetType) where.budgetType = filters.budgetType;
    if (filters?.status) where.status = filters.status;
    if (filters?.fiscalYear) where.fiscalYear = filters.fiscalYear;

    return this.budgetRepo.find({
      where,
      order: { fiscalYear: 'DESC', budgetCode: 'ASC' },
    });
  }

  /**
   * LEDGER-BUD-001: Generar reporte de variación (Budget vs Actual)
   */
  async getVarianceReport(budgetId: string): Promise<VarianceReport> {
    const budget = await this.findById(budgetId);

    const availableBalance =
      budget.budgetedAmount - budget.actualAmount - budget.committedAmount - budget.encumberedAmount;

    const varianceAmount = budget.actualAmount - budget.budgetedAmount;
    const variancePercentage =
      budget.budgetedAmount > 0
        ? (varianceAmount / budget.budgetedAmount) * 100
        : 0;

    return {
      budgetId: budget.id,
      budgetCode: budget.budgetCode,
      budgetedAmount: budget.budgetedAmount,
      actualAmount: budget.actualAmount,
      committedAmount: budget.committedAmount,
      encumberedAmount: budget.encumberedAmount,
      availableBalance,
      varianceAmount,
      variancePercentage,
      isOverBudget: varianceAmount > 0,
    };
  }

  /**
   * LEDGER-BUD-001: Actualizar monto actual del presupuesto
   */
  async updateActualAmount(budgetId: string, actualAmount: number): Promise<LedgerBudget> {
    const budget = await this.findById(budgetId);
    budget.actualAmount = actualAmount;
    budget.varianceAmount = actualAmount - budget.budgetedAmount;
    budget.variancePercentage =
      budget.budgetedAmount > 0
        ? (budget.varianceAmount / budget.budgetedAmount) * 100
        : 0;

    return this.budgetRepo.save(budget);
  }

  /**
   * LEDGER-BUD-002: Crear encumbrance (reserva de presupuesto)
   */
  async createEncumbrance(data: {
    encumbranceCode: string;
    encumbranceType: EncumbranceType;
    description: string;
    budgetId: string;
    accountId: string;
    amount: number;
    currency?: string;
    referenceDoc?: string;
    encumbranceDate: string;
    expectedFulfillmentDate?: string;
    createdBy: string;
  }): Promise<LedgerEncumbrance> {
    const budget = await this.findById(data.budgetId);

    if (budget.status !== BudgetStatus.APPROVED) {
      throw new BadRequestException(
        `Presupuesto debe estar aprobado para crear encumbrances (actual: ${budget.status})`,
      );
    }

    // Validar fondos disponibles
    const available =
      budget.budgetedAmount - budget.actualAmount - budget.committedAmount - budget.encumberedAmount;

    if (data.amount > available) {
      throw new BadRequestException(
        `Fondos insuficientes: solicitado=${data.amount}, disponible=${available}`,
      );
    }

    const encumbrance = this.encumbranceRepo.create({
      ...data,
      encumbranceDate: new Date(data.encumbranceDate),
      expectedFulfillmentDate: data.expectedFulfillmentDate
        ? new Date(data.expectedFulfillmentDate)
        : null,
      currency: data.currency || 'USD',
      fulfilledAmount: 0,
      remainingAmount: data.amount,
      status: EncumbranceStatus.OPEN,
    });

    const saved = await this.encumbranceRepo.save(encumbrance);

    // Actualizar budget
    budget.encumberedAmount += data.amount;
    budget.remainingBalance =
      budget.budgetedAmount - budget.actualAmount - budget.committedAmount - budget.encumberedAmount;
    await this.budgetRepo.save(budget);

    this.logger.log(
      `Encumbrance creado: ${saved.encumbranceCode}, monto=${saved.amount}, budget=${budget.budgetCode}`,
    );

    return saved;
  }

  /**
   * LEDGER-BUD-002: Cumplir parcial o totalmente un encumbrance
   */
  async fulfillEncumbrance(
    encumbranceId: string,
    fulfillmentAmount: number,
  ): Promise<LedgerEncumbrance> {
    const encumbrance = await this.encumbranceRepo.findOne({
      where: { id: encumbranceId },
    });

    if (!encumbrance) {
      throw new NotFoundException(`Encumbrance no encontrado: ${encumbranceId}`);
    }

    if (encumbrance.status === EncumbranceStatus.FULFILLED ||
        encumbrance.status === EncumbranceStatus.CANCELLED) {
      throw new BadRequestException(
        `Encumbrance no puede cumplirse (status=${encumbrance.status})`,
      );
    }

    encumbrance.fulfilledAmount += fulfillmentAmount;
    encumbrance.remainingAmount = encumbrance.amount - encumbrance.fulfilledAmount;

    if (encumbrance.remainingAmount <= 0) {
      encumbrance.status = EncumbranceStatus.FULFILLED;
    } else {
      encumbrance.status = EncumbranceStatus.PARTIALLY_FULFILLED;
    }

    // Liberar encumbrance del presupuesto y mover a actual
    const budget = await this.findById(encumbrance.budgetId);
    budget.encumberedAmount -= fulfillmentAmount;
    budget.actualAmount += fulfillmentAmount;
    budget.varianceAmount = budget.actualAmount - budget.budgetedAmount;
    budget.remainingBalance =
      budget.budgetedAmount - budget.actualAmount - budget.committedAmount - budget.encumberedAmount;
    await this.budgetRepo.save(budget);

    this.logger.log(
      `Encumbrance cumplido: ${encumbrance.encumbranceCode}, monto=${fulfillmentAmount}, remaining=${encumbrance.remainingAmount}`,
    );

    return this.encumbranceRepo.save(encumbrance);
  }

  /**
   * LEDGER-BUD-002: Cancelar encumbrance
   */
  async cancelEncumbrance(encumbranceId: string): Promise<LedgerEncumbrance> {
    const encumbrance = await this.encumbranceRepo.findOne({
      where: { id: encumbranceId },
    });

    if (!encumbrance) {
      throw new NotFoundException(`Encumbrance no encontrado: ${encumbranceId}`);
    }

    // Liberar fondos del presupuesto
    const budget = await this.findById(encumbrance.budgetId);
    budget.encumberedAmount -= encumbrance.remainingAmount;
    budget.remainingBalance =
      budget.budgetedAmount - budget.actualAmount - budget.committedAmount - budget.encumberedAmount;
    await this.budgetRepo.save(budget);

    encumbrance.status = EncumbranceStatus.CANCELLED;
    encumbrance.remainingAmount = 0;

    this.logger.warn(`Encumbrance cancelado: ${encumbrance.encumbranceCode}`);

    return this.encumbranceRepo.save(encumbrance);
  }
}
