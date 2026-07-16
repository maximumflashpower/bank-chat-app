import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DatagovLineage } from '../entities/datagov-lineage.entity';

/**
 * Data Lineage Service - Trazabilidad end-to-end
 * Cubre funciones: DATAGOV-LIN-001 a 005
 */
@Injectable()
export class LineageService {
  private readonly logger = new Logger(LineageService.name);

  constructor(
    @InjectRepository(DatagovLineage)
    private readonly lineageRepo: Repository<DatagovLineage>,
  ) {}

  /**
   * DATAGOV-LIN-001: Data Lineage End-to-End
   */
  async traceLineage(entityIdentifier: string): Promise<DatagovLineage[]> {
    const entries = await this.lineageRepo.find({
      where: { entityIdentifier },
      order: { createdAt: 'ASC' },
    });

    this.logger.log(`Lineage tracing: entity=${entityIdentifier}, flows=${entries.length}`);
    return entries;
  }

  /**
   * DATAGOV-LIN-002: Lineage Visual Graph
   */
  async buildLineageGraph(entityIdentifier: string): Promise<{
    nodes: Array<{ id: string; label: string; system: string }>;
    edges: Array<{ source: string; target: string; label: string }>;
  }> {
    const entries = await this.traceLineage(entityIdentifier);

    const nodeMap = new Map<string, { id: string; label: string; system: string }>();
    const edges: Array<{ source: string; target: string; label: string }> = [];

    for (const entry of entries) {
      const sourceNode = `src:${entry.sourceSystem}`;
      const targetNode = `tgt:${entry.targetSystem}`;

      if (!nodeMap.has(sourceNode)) {
        nodeMap.set(sourceNode, { id: sourceNode, label: entry.sourceSystem, system: entry.sourceSystem });
      }
      if (!nodeMap.has(targetNode)) {
        nodeMap.set(targetNode, { id: targetNode, label: entry.targetSystem, system: entry.targetSystem });
      }

      edges.push({
        source: sourceNode,
        target: targetNode,
        label: entry.flowDescription || `${entry.entityIdentifier} → ${entry.targetSystem}`,
      });
    }

    return { nodes: Array.from(nodeMap.values()), edges };
  }

  /**
   * DATAGOV-LIN-003: PII Cross-Border Transfer Detection
   */
  async detectCrossBorderTransfers(): Promise<DatagovLineage[]> {
    return this.lineageRepo.find({
      where: { crossesBorder: true, containsPii: true },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * DATAGOV-LIN-004: Transformation History
   */
  async getTransformationHistory(entityIdentifier: string): Promise<Array<{ step: number; transformation: Record<string, unknown> | null }>> {
    const entries = await this.traceLineage(entityIdentifier);
    return entries.map((entry, idx) => ({
      step: idx + 1,
      transformation: entry.transformations?.[idx] || null,
    }));
  }

  /**
   * DATAGOV-LIN-005: Impact Analysis
   */
  async analyzeImpact(entityIdentifier: string): Promise<{
    affectedSystems: string[];
    downstreamFlows: number;
    piiRisk: boolean;
  }> {
    const entries = await this.traceLineage(entityIdentifier);
    const systems = new Set<string>();

    for (const entry of entries) {
      systems.add(entry.targetSystem);
    }

    const piiRisk = entries.some(e => e.containsPii);

    return {
      affectedSystems: Array.from(systems),
      downstreamFlows: entries.length,
      piiRisk,
    };
  }

  async registerLineage(dto: {
    entityIdentifier: string;
    sourceSystem: string;
    targetSystem: string;
    transformations?: Record<string, unknown>[];
    crossesBorder?: boolean;
    countriesInvolved?: string[];
    containsPii?: boolean;
    flowDescription?: string;
  }): Promise<DatagovLineage> {
    const lineage = new DatagovLineage();
    lineage.entityIdentifier = dto.entityIdentifier;
    lineage.sourceSystem = dto.sourceSystem;
    lineage.targetSystem = dto.targetSystem;
    lineage.transformations = dto.transformations || null;
    lineage.crossesBorder = dto.crossesBorder || false;
    lineage.countriesInvolved = dto.countriesInvolved || null;
    lineage.containsPii = dto.containsPii || false;
    lineage.flowDescription = dto.flowDescription || null;

    return this.lineageRepo.save(lineage);
  }

  async findById(id: string): Promise<DatagovLineage> {
    const entry = await this.lineageRepo.findOne({ where: { id } });
    if (!entry) throw new NotFoundException(`Lineage ${id} no encontrado`);
    return entry;
  }
}
