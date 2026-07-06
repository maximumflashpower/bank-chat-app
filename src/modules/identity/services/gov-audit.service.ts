import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GovAuditLog } from '../entities/gov-audit-log.entity';
import { GovAuditFilterDto } from '../dto/gov-audit-filter.dto';

@Injectable()
export class GovAuditService {
  constructor(
    @InjectRepository(GovAuditLog)
    private readonly repo: Repository<GovAuditLog>,
  ) {}

  async logEvent(actorId: string, actionType: string, targetEntityId: string | null, details?: Record<string, unknown>): Promise<GovAuditLog> {
    const audit = this.repo.create({
      actorId,
      actionType,
      targetEntityId,
      targetEntityType: this.extractEntityType(targetEntityId),
      details: details ?? null,
      ipAddress: null,
      userAgent: null,
      actedAt: new Date(),
      complianceTags: ['SOX'],
    });
    return this.repo.save(audit);
  }

  async searchAudits(filter: GovAuditFilterDto): Promise<GovAuditLog[]> {
    const queryBuilder = this.repo.createQueryBuilder('ga');

    if (filter.actionType) {
      queryBuilder.andWhere('ga.actionType LIKE :actionType', { actionType: `%${filter.actionType}%` });
    }
    
    if (filter.userId) {
      queryBuilder.andWhere('ga.actorId = :userId OR ga.targetEntityId = :userId', { userId: filter.userId });
    }

    if (filter.startDate) {
      queryBuilder.andWhere('ga.actedAt >= :startDate', { startDate: new Date(filter.startDate) });
    }

    if (filter.endDate) {
      queryBuilder.andWhere('ga.actedAt <= :endDate', { endDate: new Date(filter.endDate) });
    }

    if (filter.complianceTags?.length) {
      queryBuilder.andWhere(':tag = ANY(ga.complianceTags)', { tag: filter.complianceTags[0] });
    }

    return queryBuilder.orderBy('ga.actedAt', 'DESC').getMany();
  }

  private extractEntityType(entityId: string | null): string | null {
    if (!entityId) return null;
    // Placeholder: infer entity type from prefix or lookup
    return null;
  }

  async generateComplianceReport(startDate: Date, endDate: Date, regulations: string[]): Promise<any> {
    // Placeholder: generates JSON report for SOX/GDPR/PCI
    return {
      period: { start: startDate.toISOString(), end: endDate.toISOString() },
      totalEvents: 0,
      violations: [],
      remediations: [],
    };
  }
}
