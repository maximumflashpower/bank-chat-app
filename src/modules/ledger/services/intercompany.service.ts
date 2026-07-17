import {
  Injectable, NotFoundException, BadRequestException, Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  LedgerIntercompany,
  IntercompanyTxnType,
  IntercompanyStatus,
} from '../entities/ledger-intercompany.entity';
import { CreateIntercompanyDto } from '../dto/create-intercompany.dto';

export interface EliminationResult {
  eliminationEntriesCreated: number;
  totalEliminated: number;
  consolidatedNet: number;
}

export interface CostAllocationResult {
  allocationsCreated: number;
  totalAllocated: number;
  basis: string;
}

@Injectable()
export class IntercompanyService {
  private readonly logger = new Logger(IntercompanyService.name);

  constructor(
    @InjectRepository(LedgerIntercompany)
    private readonly icRepo: Repository<LedgerIntercompany>,
  ) {}

  /**
   * LEDGER-INT-001: Crear transacción intercompany
   */
  async createTxn(dto: CreateIntercompanyDto): Promise<LedgerIntercompany> {
    if (dto.fromEntityId === dto.toEntityId) {
      throw new BadRequestException('La entidad origen y destino no pueden ser la misma');
    }

    // Validar código único
    const exists = await this.icRepo.findOne({
      where: { txnCode: dto.txnCode },
    });
    if (exists) {
      throw new BadRequestException(`Código intercompany ya existe: ${dto.txnCode}`);
    }

    const txnDate = new Date(dto.txnDate);
    const dueDate = dto.dueDate ? new Date(dto.dueDate) : null;

    const txn = this.icRepo.create({
      ...dto,
      txnDate,
      dueDate,
      currency: dto.currency || 'USD',
      amountBaseCurrency: dto.amount, // Placeholder: convertir si hay exchangeRate
      status: IntercompanyStatus.PENDING,
    });

    const saved = await this.icRepo.save(txn);

    this.logger.log(
      `Intercompany creado: ${saved.txnCode}, type=${saved.txnType}, amount=${saved.amount} ${saved.currency}`,
    );

    return saved;
  }

  /**
   * LEDGER-INT-001: Obtener intercompany por ID
   */
  async findById(id: string): Promise<LedgerIntercompany> {
    const txn = await this.icRepo.findOne({ where: { id } });
    if (!txn) {
      throw new NotFoundException(`Transacción intercompany no encontrada: ${id}`);
    }
    return txn;
  }

  /**
   * LEDGER-INT-001: Listar transacciones intercompany
   */
  async findAll(filters?: {
    txnType?: IntercompanyTxnType;
    status?: IntercompanyStatus;
    entityId?: string;
  }): Promise<LedgerIntercompany[]> {
    const where: Record<string, unknown> = {};
    if (filters?.txnType) where.txnType = filters.txnType;
    if (filters?.status) where.status = filters.status;
    if (filters?.entityId) {
      // Buscar en fromEntityId o toEntityId
      return this.icRepo
        .createQueryBuilder('ic')
        .where('ic.from_entity_id = :entityId OR ic.to_entity_id = :entityId', {
          entityId: filters.entityId,
        })
        .orderBy('ic.created_at', 'DESC')
        .getMany();
    }

    return this.icRepo.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * LEDGER-INT-001: Ejecutar eliminaciones de consolidación
   */
  async runEliminations(periodId: string): Promise<EliminationResult> {
    this.logger.log(`Iniciando eliminaciones intercompany para periodo: ${periodId}`);

    // Obtener transacciones posted pendientes de eliminación
    const postedTxns = await this.icRepo.find({
      where: { status: IntercompanyStatus.POSTED },
    });

    let totalEliminated = 0;
    let entriesCreated = 0;

    for (const txn of postedTxns) {
      // Generar asiento de eliminación (placeholder)
      txn.status = IntercompanyStatus.ELIMINATED;
      txn.eliminationEntryId = `elim-${txn.id}`; // Placeholder
      totalEliminated += txn.amountBaseCurrency;
      entriesCreated++;
    }

    await this.icRepo.save(postedTxns);

    this.logger.log(
      `Eliminaciones completadas: ${entriesCreated} entradas, ${totalEliminated} eliminado`,
    );

    return {
      eliminationEntriesCreated: entriesCreated,
      totalEliminated,
      consolidatedNet: 0, // Neto consolidado (placeholder)
    };
  }

  /**
   * LEDGER-INT-002: Asignación de costos de transferencia
   */
  async allocateCosts(data: {
    fromEntityId: string;
    toEntities: string[];
    totalAmount: number;
    allocationBasis: string;
    createdBy: string;
    txnDate: string;
  }): Promise<CostAllocationResult> {
    this.logger.log(
      `Iniciando asignación de costos: ${data.totalAmount} a ${data.toEntities.length} entidades`,
    );

    const txnDate = new Date(data.txnDate);
    const amountPerEntity = data.totalAmount / data.toEntities.length;
    let allocationsCreated = 0;

    for (const toEntityId of data.toEntities) {
      const txn = this.icRepo.create({
        txnCode: `ALLOC-${Date.now()}-${allocationsCreated + 1}`,
        txnType: IntercompanyTxnType.COST_ALLOCATION,
        description: `Asignación de costos basada en ${data.allocationBasis}`,
        fromEntityId: data.fromEntityId,
        toEntityId,
        amount: amountPerEntity,
        currency: 'USD',
        amountBaseCurrency: amountPerEntity,
        txnDate,
        allocationBasis: data.allocationBasis,
        status: IntercompanyStatus.PENDING,
        createdBy: data.createdBy,
      });

      await this.icRepo.save(txn);
      allocationsCreated++;
    }

    this.logger.log(
      `Asignación completada: ${allocationsCreated} entradas, ${data.totalAmount} total`,
    );

    return {
      allocationsCreated,
      totalAllocated: data.totalAmount,
      basis: data.allocationBasis,
    };
  }

  /**
   * LEDGER-INT-002: Marcar transacción como posted (JE generado)
   */
  async markPosted(txnId: string, journalEntryId: string): Promise<LedgerIntercompany> {
    const txn = await this.findById(txnId);

    txn.status = IntercompanyStatus.POSTED;
    txn.journalEntryId = journalEntryId;

    return this.icRepo.save(txn);
  }

  /**
   * LEDGER-INT-001: Liquidar transacción intercompany
   */
  async settleTxn(txnId: string): Promise<LedgerIntercompany> {
    const txn = await this.findById(txnId);

    if (txn.status !== IntercompanyStatus.ELIMINATED && txn.status !== IntercompanyStatus.POSTED) {
      throw new BadRequestException(
        `Transacción debe estar posted o eliminated para liquidar (actual: ${txn.status})`,
      );
    }

    txn.status = IntercompanyStatus.SETTLED;

    this.logger.log(`Intercompany liquidado: ${txn.txnCode}`);

    return this.icRepo.save(txn);
  }
}
