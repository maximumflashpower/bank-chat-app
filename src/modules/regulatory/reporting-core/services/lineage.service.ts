import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RegulatoryLineage } from '../entities/regulatory-lineage.entity';

@Injectable()
export class LineageService {
  private readonly logger = new Logger(LineageService.name);

  constructor(
    @InjectRepository(RegulatoryLineage)
    private lineageRepo: Repository<RegulatoryLineage>,
  ) {}

  async createLineage(
    reportName: string,
    reportPath: string,
    reportDate: Date,
    dataSources: Record<string, unknown>,
    transformations: Record<string, unknown>,
    sourceFields: Array<{ table: string; column: string; entityType: string }>,
    targetFields: Array<{ reportSection: string; fieldName: string; filingFormat: string }>,
    userId: string,
    options?: {
      aggregations?: Record<string, unknown>;
      calculations?: Record<string, unknown>;
      transformationRules?: Record<string, unknown>;
      lineageType?: 'automatic' | 'manual' | 'hybrid';
      notes?: string;
    },
  ): Promise<RegulatoryLineage> {
    const lineage = this.lineageRepo.create({
      reportName,
      reportPath,
      reportDate,
      dataSources,
      transformations,
      sourceFields,
      targetFields,
      createdBy: userId,
      aggregations: options?.aggregations,
      calculations: options?.calculations,
      transformationRules: options?.transformationRules,
      lineageType: options?.lineageType || 'manual',
      notes: options?.notes,
      status: 'draft',
      auditTrail: [{
        timestamp: new Date().toISOString(),
        user: userId,
        action: 'lineage_created',
        details: { reportName, reportPath },
      }],
    });

    const saved = await this.lineageRepo.save(lineage);
    this.logger.log(`Lineage created: ${saved.id} for report ${reportName}`);
    return saved;
  }

  async findById(id: string): Promise<RegulatoryLineage> {
    const lineage = await this.lineageRepo.findOne({ where: { id } });
    if (!lineage) throw new NotFoundException(`Lineage ${id} not found`);
    return lineage;
  }

  async findByReportName(reportName: string): Promise<RegulatoryLineage[]> {
    return this.lineageRepo.find({
      where: { reportName },
      order: { reportDate: 'DESC' },
    });
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<RegulatoryLineage[]> {
    return this.lineageRepo
      .createQueryBuilder('lineage')
      .where('lineage.reportDate BETWEEN :start AND :end', { start: startDate, end: endDate })
      .orderBy('lineage.reportDate', 'DESC')
      .getMany();
  }

  async reviewLineage(id: string, reviewerId: string): Promise<RegulatoryLineage> {
    const lineage = await this.findById(id);
    lineage.status = 'review';
    lineage.reviewedBy = reviewerId;
    lineage.reviewedAt = new Date();
    lineage.auditTrail = [...(lineage.auditTrail || []), {
      timestamp: new Date().toISOString(),
      user: reviewerId,
      action: 'lineage_reviewed',
      details: {},
    }];
    return this.lineageRepo.save(lineage);
  }

  async certifyLineage(id: string, reviewerId: string): Promise<RegulatoryLineage> {
    const lineage = await this.findById(id);
    if (lineage.status !== 'review') {
      throw new Error('Lineage must be in review status before certification');
    }
    lineage.status = 'certified';
    lineage.auditTrail = [...(lineage.auditTrail || []), {
      timestamp: new Date().toISOString(),
      user: reviewerId,
      action: 'lineage_certified',
      details: {},
    }];
    return this.lineageRepo.save(lineage);
  }

  async fileLineage(id: string, filerId: string): Promise<RegulatoryLineage> {
    const lineage = await this.findById(id);
    if (lineage.status !== 'certified') {
      throw new Error('Lineage must be certified before filing');
    }
    lineage.status = 'filed';
    lineage.filedBy = filerId;
    lineage.filedAt = new Date();
    lineage.auditTrail = [...(lineage.auditTrail || []), {
      timestamp: new Date().toISOString(),
      user: filerId,
      action: 'lineage_filed',
      details: {},
    }];
    return this.lineageRepo.save(lineage);
  }

  async getTraceabilityReport(id: string): Promise<{
    lineageId: string;
    reportName: string;
    sourceCount: number;
    targetCount: number;
    transformationSteps: number;
    hasAggregations: boolean;
    hasCalculations: boolean;
    status: string;
  }> {
    const lineage = await this.findById(id);
    return {
      lineageId: lineage.id,
      reportName: lineage.reportName,
      sourceCount: lineage.sourceFields?.length || 0,
      targetCount: lineage.targetFields?.length || 0,
      transformationSteps: lineage.transformations ? Object.keys(lineage.transformations).length : 0,
      hasAggregations: !!lineage.aggregations,
      hasCalculations: !!lineage.calculations,
      status: lineage.status,
    };
  }
}
