import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../entities/audit-log.entity';
import { AuditEventType } from '../entities/audit-event.enum';
import { AuditSeverity } from '../entities/audit-severity.enum';
import { QueryAuditDto } from '../dto/query-audit.dto';

export interface AuditContext {
  userId?: string | null;
  eventType: AuditEventType;
  severity?: AuditSeverity;
  description: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, any> | null;
  httpMethod?: string | null;
  httpPath?: string | null;
  httpStatus?: number | null;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditLog)
    private auditRepo: Repository<AuditLog>,
  ) {}

  async log(context: AuditContext): Promise<void> {
    try {
      const entry = this.auditRepo.create({
        userId: context.userId ?? null,
        eventType: context.eventType,
        severity: context.severity ?? AuditSeverity.INFO,
        description: context.description,
        ipAddress: context.ipAddress ?? null,
        userAgent: context.userAgent ?? null,
        metadata: context.metadata ?? null,
        httpMethod: context.httpMethod ?? null,
        httpPath: context.httpPath ?? null,
        httpStatus: context.httpStatus ?? null,
      });
      await this.auditRepo.save(entry);
    } catch (err) {
      this.logger.error(`Failed to write audit log: ${(err as Error).message}`, err.stack);
    }
  }

  async query(dto: QueryAuditDto): Promise<{ data: AuditLog[]; total: number }> {
    const qb = this.auditRepo.createQueryBuilder('audit');

    if (dto.eventType) {
      qb.andWhere('audit.event_type = :eventType', { eventType: dto.eventType });
    }
    if (dto.severity) {
      qb.andWhere('audit.severity = :severity', { severity: dto.severity });
    }
    if (dto.userId) {
      qb.andWhere('audit.user_id = :userId', { userId: dto.userId });
    }

    qb.orderBy('audit.created_at', 'DESC').limit(dto.limit ?? 50);

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async getByUserId(userId: string, limit = 50): Promise<AuditLog[]> {
    return this.auditRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
