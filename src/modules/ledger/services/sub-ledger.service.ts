import {
  Injectable, NotFoundException, BadRequestException, Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  LedgerSubLedgerRule,
  LedgerSubLedgerEntry,
  SubLedgerType,
  DistributionRuleType,
  DistributionStatus,
} from '../entities/ledger-sub-ledger-rule.entity';

export interface PostSubLedgerResult {
  posted: number;
  totalDebit: number;
  totalCredit: number;
  journalEntryCreated: boolean;
  journalEntryId: string | null;
}

@Injectable()
export class SubLedgerService {
  private readonly logger = new Logger(SubLedgerService.name);

  constructor(
    @InjectRepository(LedgerSubLedgerRule)
    private readonly ruleRepo: Repository<LedgerSubLedgerRule>,
    @InjectRepository(LedgerSubLedgerEntry)
    private readonly entryRepo: Repository<LedgerSubLedgerEntry>,
  ) {}

  /**
   * LEDGER-SUB-002: Crear regla de distribución
   */
  async createRule(data: {
    ruleCode: string;
    ruleName: string;
    subLedgerType: SubLedgerType;
    description?: string;
    glAccountId: string;
    distributionType: DistributionRuleType;
    distributionConfig?: Record<string, unknown>;
    autoPost?: boolean;
    requiresApproval?: boolean;
    approvalThreshold?: number;
    currency?: string;
    effectiveFrom: string;
    effectiveUntil?: string;
    createdBy: string;
  }): Promise<LedgerSubLedgerRule> {
    const exists = await this.ruleRepo.findOne({
      where: { ruleCode: data.ruleCode },
    });
    if (exists) {
      throw new BadRequestException(`Código de regla ya existe: ${data.ruleCode}`);
    }

    const rule = this.ruleRepo.create({
      ...data,
      effectiveFrom: new Date(data.effectiveFrom),
      effectiveUntil: data.effectiveUntil ? new Date(data.effectiveUntil) : null,
      currency: data.currency || 'USD',
      autoPost: data.autoPost ?? false,
      requiresApproval: data.requiresApproval ?? false,
      status: DistributionStatus.ACTIVE,
    });

    const saved = await this.ruleRepo.save(rule);

    this.logger.log(
      `Regla sub-ledger creada: ${saved.ruleCode}, type=${saved.subLedgerType}, autoPost=${saved.autoPost}`,
    );

    return saved;
  }

  /**
   * LEDGER-SUB-001: Crear entrada sub-ledger desde sistema externo
   */
  async createEntry(data: {
    entryCode: string;
    subLedgerType: SubLedgerType;
    subLedgerEntityId: string;
    subLedgerReference: string;
    ruleId: string;
    glAccountId: string;
    debitAmount?: number;
    creditAmount?: number;
    currency?: string;
    transactionDate: string;
    description?: string;
    referenceDoc?: string;
    segmentBranchId?: string;
    segmentDeptId?: string;
    segmentProjectId?: string;
    createdBy: string;
  }): Promise<LedgerSubLedgerEntry> {
    const rule = await this.findRuleById(data.ruleId);

    if (rule.status !== DistributionStatus.ACTIVE) {
      throw new BadRequestException(
        `Regla no está activa: ${rule.ruleCode} (status=${rule.status})`,
      );
    }

    const entry = this.entryRepo.create({
      ...data,
      transactionDate: new Date(data.transactionDate),
      currency: data.currency || 'USD',
      debitAmount: data.debitAmount || 0,
      creditAmount: data.creditAmount || 0,
      posted: false,
    });

    const saved = await this.entryRepo.save(entry);

    this.logger.log(
      `Entrada sub-ledger creada: ${saved.entryCode}, type=${saved.subLedgerType}, debit=${saved.debitAmount}, credit=${saved.creditAmount}`,
    );

    // Auto-post si la regla lo permite y no requiere aprobación
    if (rule.autoPost && !rule.requiresApproval) {
      await this.postEntries([saved.id]);
    }

    return saved;
  }

  /**
   * LEDGER-SUB-002: Postear entradas al GL (genera journal entries)
   */
  async postEntries(entryIds: string[]): Promise<PostSubLedgerResult> {
    const entries = await this.entryRepo.find({
      where: entryIds.map((id) => ({ id })),
    });

    if (entries.length === 0) {
      throw new NotFoundException('No se encontraron entradas para postear');
    }

    // Validar que no estén ya posteadas
    const alreadyPosted = entries.filter((e) => e.posted);
    if (alreadyPosted.length > 0) {
      throw new BadRequestException(
        `${alreadyPosted.length} entradas ya están posteadas`,
      );
    }

    // Validar que requiere aprobación si la regla lo indica
    for (const entry of entries) {
      if (!entry.approvedBy) {
        const rule = await this.findRuleById(entry.ruleId);
        if (rule.requiresApproval) {
          throw new BadRequestException(
            `Entrada ${entry.entryCode} requiere aprobación antes de postear`,
          );
        }
      }
    }

    // Calcular totales
    const totalDebit = entries.reduce((sum, e) => sum + e.debitAmount, 0);
    const totalCredit = entries.reduce((sum, e) => sum + e.creditAmount, 0);

    if (totalDebit !== totalCredit) {
      throw new BadRequestException(
        `Asiento no balanceado: debit=${totalDebit}, credit=${totalCredit}`,
      );
    }

    // Marcar como posteadas (placeholder: en producción generaría journal entry real)
    const journalEntryId = `JE-SUB-${Date.now()}`;

    for (const entry of entries) {
      entry.posted = true;
      entry.journalEntryId = journalEntryId;
    }

    await this.entryRepo.save(entries);

    // Actualizar contador de la regla
    const ruleIds = [...new Set(entries.map((e) => e.ruleId))];
    for (const ruleId of ruleIds) {
      const rule = await this.findRuleById(ruleId);
      rule.totalPosts += entries.filter((e) => e.ruleId === ruleId).length;
      rule.lastRunAt = new Date();
      await this.ruleRepo.save(rule);
    }

    this.logger.log(
      `Sub-ledger postings: ${entries.length} entradas, debit=${totalDebit}, credit=${totalCredit}, JE=${journalEntryId}`,
    );

    return {
      posted: entries.length,
      totalDebit,
      totalCredit,
      journalEntryCreated: true,
      journalEntryId,
    };
  }

  /**
   * LEDGER-SUB-001: Aprobar entrada para posting
   */
  async approveEntry(entryId: string, approvedBy: string): Promise<LedgerSubLedgerEntry> {
    const entry = await this.findEntryById(entryId);

    entry.approvedBy = approvedBy;
    entry.approvedAt = new Date();

    return this.entryRepo.save(entry);
  }

  /**
   * LEDGER-SUB-001: Listar entradas con filtros
   */
  async findEntries(filters?: {
    subLedgerType?: SubLedgerType;
    posted?: boolean;
    ruleId?: string;
  }): Promise<LedgerSubLedgerEntry[]> {
    const where: Record<string, unknown> = {};
    if (filters?.subLedgerType) where.subLedgerType = filters.subLedgerType;
    if (filters?.posted !== undefined) where.posted = filters.posted;
    if (filters?.ruleId) where.ruleId = filters.ruleId;

    return this.entryRepo.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * LEDGER-SUB-002: Listar reglas activas
   */
  async findActiveRules(subLedgerType?: SubLedgerType): Promise<LedgerSubLedgerRule[]> {
    const where: Record<string, unknown> = { status: DistributionStatus.ACTIVE };
    if (subLedgerType) where.subLedgerType = subLedgerType;

    return this.ruleRepo.find({
      where,
      order: { ruleCode: 'ASC' },
    });
  }

  /**
   * Helpers
   */
  async findRuleById(id: string): Promise<LedgerSubLedgerRule> {
    const rule = await this.ruleRepo.findOne({ where: { id } });
    if (!rule) {
      throw new NotFoundException(`Regla sub-ledger no encontrada: ${id}`);
    }
    return rule;
  }

  async findEntryById(id: string): Promise<LedgerSubLedgerEntry> {
    const entry = await this.entryRepo.findOne({ where: { id } });
    if (!entry) {
      throw new NotFoundException(`Entrada sub-ledger no encontrada: ${id}`);
    }
    return entry;
  }

  /**
   * LEDGER-SUB-002: Desactivar regla
   */
  async deactivateRule(ruleId: string): Promise<LedgerSubLedgerRule> {
    const rule = await this.findRuleById(ruleId);
    rule.status = DistributionStatus.INACTIVE;
    return this.ruleRepo.save(rule);
  }
}
