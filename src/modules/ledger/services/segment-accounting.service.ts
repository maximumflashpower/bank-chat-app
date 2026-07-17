import {
  Injectable, NotFoundException, BadRequestException, Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, FindOptionsRelations } from 'typeorm';
import { LedgerSegment, SegmentType, SegmentStatus } from '../entities/ledger-segment.entity';

export interface SegmentBalance {
  segmentId: string;
  segmentCode: string;
  segmentName: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface SegmentTree extends SegmentBalance {
  children?: SegmentTree[];
}

@Injectable()
export class SegmentAccountingService {
  private readonly logger = new Logger(SegmentAccountingService.name);

  constructor(
    @InjectRepository(LedgerSegment)
    private readonly segmentRepo: Repository<LedgerSegment>,
  ) {}

  /**
   * LEDGER-SEG-001: Crear nuevo segmento contable
   */
  async createSegment(data: {
    segmentCode: string;
    segmentName: string;
    segmentType: SegmentType;
    parentSegmentId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<LedgerSegment> {
    // Validar que el código sea único
    const exists = await this.segmentRepo.findOne({
      where: { segmentCode: data.segmentCode },
    });
    if (exists) {
      throw new BadRequestException(`Código de segmento ya existe: ${data.segmentCode}`);
    }

    // Calcular nivel si tiene padre
    let level = 1;
    if (data.parentSegmentId) {
      const parent = await this.segmentRepo.findOne({
        where: { id: data.parentSegmentId },
      });
      if (!parent) {
        throw new BadRequestException('Padre no encontrado');
      }
      level = parent.level + 1;
    }

    const segment = this.segmentRepo.create({
      ...data,
      level,
    });

    const saved = await this.segmentRepo.save(segment);

    this.logger.log(
      `Segmento creado: id=${saved.id}, code=${saved.segmentCode}, type=${saved.segmentType}`,
    );

    return saved;
  }

  /**
   * LEDGER-SEG-001: Listar todos los segmentos
   */
  async findAll(): Promise<LedgerSegment[]> {
    return this.segmentRepo.find({
      order: { segmentCode: 'ASC' },
    });
  }

  /**
   * LEDGER-SEG-001: Listar segmentos por tipo
   */
  async findByType(type: SegmentType): Promise<LedgerSegment[]> {
    return this.segmentRepo.find({
      where: { segmentType: type },
      order: { segmentCode: 'ASC' },
    });
  }

  /**
   * LEDGER-SEG-001: Obtener segmento por ID
   */
  async findById(id: string): Promise<LedgerSegment> {
    const segment = await this.segmentRepo.findOne({
      where: { id },
      select: { id: true, segmentCode: true, segmentName: true, parentSegmentId: true },
    });

    if (!segment) {
      throw new NotFoundException(`Segmento no encontrado: ${id}`);
    }

    return segment;
  }

  /**
   * LEDGER-SEG-001: Obtener árbol jerárquico completo
   * LEDGER-SEG-002: Multi-dimensional hierarchy rollup
   */
  async getHierarchy(): Promise<SegmentTree[]> {
    const segments = await this.segmentRepo.find({
      select: { id: true, segmentCode: true, segmentName: true, parentSegmentId: true },
      order: { segmentCode: 'ASC' },
    });

    // Construir árbol
    const map = new Map<string, SegmentTree>();
    const roots: SegmentTree[] = [];

    // Primero crear nodos sin balances
    segments.forEach((seg) => {
      map.set(seg.id, {
        segmentId: seg.id,
        segmentCode: seg.segmentCode,
        segmentName: seg.segmentName,
        debit: 0,
        credit: 0,
        balance: 0,
        children: [],
      });
    });

    // Asignar hijos a padres
    segments.forEach((seg) => {
      const node = map.get(seg.id)!;
      if (seg.parentSegmentId) {
        const parent = map.get(seg.parentSegmentId);
        if (parent) {
          parent.children!.push(node);
        } else {
          roots.push(node);
        }
      } else {
        roots.push(node);
      }
    });

    return roots;
  }

  /**
   * LEDGER-SEG-002: Balance real-time para segmento específico
   * LEDGER-SEG-004: Segment balance query real-time filtered
   */
  async getBalance(segmentId: string): Promise<SegmentBalance> {
    const segment = await this.findById(segmentId);

    // Placeholder - en implementación real, esto consultaría ledger_journal_line
    // Por ahora retornamos ceros hasta integrar con journal lines
    const balance: SegmentBalance = {
      segmentId,
      segmentCode: segment.segmentCode,
      segmentName: segment.segmentName,
      debit: 0,
      credit: 0,
      balance: 0,
    };

    return balance;
  }

  /**
   * LEDGER-SEG-002: Balance agregado para toda la jerarquía (rollup)
   */
  async getRollupBalance(segmentId: string): Promise<SegmentBalance> {
    const segment = await this.findById(segmentId);

    // Obtener este segmento + todos sus hijos
    const descendants = await this.getDescendants(segmentId);
    const allIds = [segmentId, ...descendants];

    // Placeholder - consultar balances reales
    const totalBalance: SegmentBalance = {
      segmentId,
      segmentCode: segment.segmentCode,
      segmentName: segment.segmentName,
      debit: 0,
      credit: 0,
      balance: 0,
    };

    return totalBalance;
  }

  /**
   * Helper: Obtener todos los descendientes de un segmento
   */
  private async getDescendants(segmentId: string): Promise<string[]> {
    const children = await this.segmentRepo.find({
      where: { parentSegmentId: segmentId },
    });

    const ids: string[] = [];
    for (const child of children) {
      ids.push(child.id);
      ids.push(...(await this.getDescendants(child.id)));
    }

    return ids;
  }

  /**
   * LEDGER-SEG-003: Validar combinación de dimensiones
   */
  async validateDimensionCombination(dimensionValues: {
    branchId?: string;
    deptId?: string;
    projectId?: string;
  }): Promise<void> {
    // Validaciones de negocio para combinaciones permitidas
    // Ejemplo: ciertos proyectos solo pueden tener ciertos departamentos

    const combinations: Record<string, string[]> = {
      // 'project_X': ['dept_A', 'dept_B'],
      // 'branch_Y': ['project_Z'],
    };

    // Placeholder para reglas de negocio
    this.logger.debug(
      `Validación de combinación: ${JSON.stringify(dimensionValues)}`,
    );
  }

  /**
   * Actualizar estado de segmento (active/inactive)
   */
  async updateStatus(segmentId: string, status: SegmentStatus): Promise<LedgerSegment> {
    const segment = await this.findById(segmentId);

    segment.status = status;

    const saved = await this.segmentRepo.save(segment);

    this.logger.log(
      `Estado actualizado: id=${segmentId}, status=${status}`,
    );

    return saved;
  }

  /**
   * Deactivate segmento (soft delete)
   */
  async deactivate(segmentId: string): Promise<LedgerSegment> {
    return this.updateStatus(segmentId, SegmentStatus.INACTIVE);
  }

  /**
   * Activate segmento
   */
  async activate(segmentId: string): Promise<LedgerSegment> {
    return this.updateStatus(segmentId, SegmentStatus.ACTIVE);
  }

  /**
   * Búsqueda avanzada con filtros
   */
  async search(filters: {
    segmentType?: SegmentType;
    status?: SegmentStatus;
    searchTerm?: string;
  }): Promise<LedgerSegment[]> {
    const where: FindOptionsWhere<LedgerSegment>[] = [];

    if (filters.segmentType) {
      where.push({ segmentType: filters.segmentType });
    }

    if (filters.status) {
      where.push({ status: filters.status });
    }

    if (filters.searchTerm) {
      where.push({
        segmentCode: filters.searchTerm,
      });
    }

    return this.segmentRepo.find({
      where: where.length > 0 ? where : undefined,
      order: { segmentCode: 'ASC' },
    });
  }
}
