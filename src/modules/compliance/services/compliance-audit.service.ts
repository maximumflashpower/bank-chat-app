import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ComplianceAuditLog } from '../entities/compliance-audit-log.entity';

@Injectable()
export class ComplianceAuditService {
  private readonly logger = new Logger(ComplianceAuditService.name);

  constructor(
    @InjectRepository(ComplianceAuditLog)
    private readonly repo: Repository<ComplianceAuditLog>,
  ) {}

  /** BBC-AUDIT-001: Immutable Audit Trail Every Action Logged */
  async logAction(input: {
    actorId: string;
    action: string;
    entityType: string;
    entityId: string;
    metadata?: Record<string, any>;
    ipAddress?: string;
  }): Promise<ComplianceAuditLog> {
    const log = Object.assign(new ComplianceAuditLog(), {
      actorId: input.actorId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      metadata: input.metadata || null,
      ipAddress: input.ipAddress || null,
      isSealed: false,
      sealedHash: null,
    });
    const saved = await this.repo.save(log) as unknown as ComplianceAuditLog;
    this.logger.debug(`Audit trail logged: actor=${input.actorId}, action=${input.action}, entity=${input.entityType}/${input.entityId}`);
    return saved;
  }

  /** BBC-AUDIT-002: Evidence Preservation Chain-of-Custody Digital Sealing */
  async sealEvidence(evidenceId: string): Promise<{ sealed: boolean; hash: string; sealedAt: Date }> {
    const log = await this.repo.findOne({ where: { id: evidenceId } });
    if (!log) {
      throw new NotFoundException(`Audit log ${evidenceId} not found`);
    }
    // Stub: simulated hash generation
    const hash = `SHA256:${Buffer.from(`${evidenceId}:${Date.now()}`).toString('hex')}`;
    log.isSealed = true;
    log.sealedHash = hash;
    await this.repo.save(log);
    this.logger.warn(`Evidence sealed: ${evidenceId}, hash=${hash.substring(0, 16)}...`);
    return { sealed: true, hash, sealedAt: new Date() };
  }

  /** BBC-AUDIT-003: Regulator Access Portal Read-Only Audit Mode */
  async exportAuditTrail(params: {
    entityType?: string;
    startDate?: Date;
    endDate?: Date;
    actorId?: string;
  }): Promise<{ logs: ComplianceAuditLog[]; exportedAt: Date; totalCount: number }> {
    const query = this.repo.createQueryBuilder('audit');
    if (params.entityType) {
      query.andWhere('audit.entity_type = :entityType', { entityType: params.entityType });
    }
    if (params.startDate) {
      query.andWhere('audit.created_at >= :startDate', { startDate: params.startDate });
    }
    if (params.endDate) {
      query.andWhere('audit.created_at <= :endDate', { endDate: params.endDate });
    }
    if (params.actorId) {
      query.andWhere('audit.actor_id = :actorId', { actorId: params.actorId });
    }
    const logs = await query.orderBy('audit.created_at', 'DESC').getMany();
    const exportedAt = new Date();
    this.logger.log(`Audit trail exported: ${logs.length} entries, timeframe ${params.startDate || 'all'} to ${params.endDate || 'now'}`);
    return { logs, exportedAt, totalCount: logs.length };
  }

  /** Get audit logs for an entity */
  async getLogsForEntity(entityType: string, entityId: string): Promise<ComplianceAuditLog[]> {
    return this.repo.find({ where: { entityType, entityId }, order: { createdAt: 'DESC' } });
  }
}
