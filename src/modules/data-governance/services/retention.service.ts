import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  DatagovRetentionPolicy,
  DispositionAction,
} from '../entities/datagov-retention-policy.entity';

/**
 * Servicio de políticas de retención y eliminación segura
 * Cubre funciones: DATAGOV-RET-001 a 006
 */
@Injectable()
export class RetentionService {
  private readonly logger = new Logger(RetentionService.name);

  constructor(
    @InjectRepository(DatagovRetentionPolicy)
    private readonly policyRepo: Repository<DatagovRetentionPolicy>,
  ) {}

  /**
   * DATAGOV-RET-001: Retention Policy Engine
   */
  async createPolicy(dto: {
    name: string;
    dataCategory: string;
    retentionDays: number;
    legalBasis?: string;
    dispositionAction?: DispositionAction;
    notificationDaysBefore?: number;
    softDeletePeriodDays?: number;
    autoExecute?: boolean;
    createdBy: string;
  }): Promise<DatagovRetentionPolicy> {
    const policy = new DatagovRetentionPolicy();
    policy.name = dto.name;
    policy.dataCategory = dto.dataCategory;
    policy.retentionDays = dto.retentionDays;
    policy.legalBasis = dto.legalBasis || null;
    policy.dispositionAction = dto.dispositionAction || DispositionAction.DELETE;
    policy.notificationDaysBefore = dto.notificationDaysBefore ?? 7;
    policy.softDeletePeriodDays = dto.softDeletePeriodDays ?? 30;
    policy.autoExecute = dto.autoExecute ?? true;
    policy.createdBy = dto.createdBy;
    policy.legalHoldOverride = false;

    const saved = await this.policyRepo.save(policy);
    this.logger.log(`Política creada: ${saved.name}, categoría=${dto.dataCategory}, días=${dto.retentionDays}`);

    return saved;
  }

  async findAllPolicies(): Promise<DatagovRetentionPolicy[]> {
    return this.policyRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findByName(name: string): Promise<DatagovRetentionPolicy | null> {
    return this.policyRepo.findOne({ where: { name } });
  }

  async findByCategory(dataCategory: string): Promise<DatagovRetentionPolicy | null> {
    return this.policyRepo.findOne({ where: { dataCategory } });
  }

  /**
   * DATAGOV-RET-004: Legal Hold Override
   */
  async setLegalHold(policyId: string, hold: boolean): Promise<DatagovRetentionPolicy> {
    const policy = await this.findById(policyId);
    policy.legalHoldOverride = hold;
    return this.policyRepo.save(policy);
  }

  /**
   * DATAGOV-RET-005: Disposition Action
   */
  async updateDisposition(policyId: string, action: DispositionAction): Promise<DatagovRetentionPolicy> {
    const policy = await this.findById(policyId);
    policy.dispositionAction = action;
    return this.policyRepo.save(policy);
  }

  /**
   * DATAGOV-RET-002 & 006: Automated Deletion Schedule + Pre-Deletion Notification
   */
  async getUpcomingDeletions(daysAhead: number = 30): Promise<Array<{ policy: DatagovRetentionPolicy; estimatedDate: Date; notificationDate: Date }>> {
    const policies = await this.policyRepo.find({
      where: { autoExecute: true, legalHoldOverride: false },
    });

    const upcoming: Array<{ policy: DatagovRetentionPolicy; estimatedDate: Date; notificationDate: Date }> = [];
    const now = new Date();

    for (const policy of policies) {
      // En producción, buscaría registros reales que cumplen su retención
      const estimatedDate = new Date(now);
      estimatedDate.setDate(estimatedDate.getDate() + daysAhead);

      const notificationDate = new Date(estimatedDate);
      notificationDate.setDate(notificationDate.getDate() - policy.notificationDaysBefore);

      if (notificationDate <= now) {
        upcoming.push({ policy, estimatedDate, notificationDate });
      }
    }

    return upcoming;
  }

  /**
   * DATAGOV-RET-003: Soft-Delete Period
   */
  async executeSoftDelete(policyId: string): Promise<{ deleted: boolean; softDeleteUntil: Date }> {
    const policy = await this.findById(policyId);

    if (policy.legalHoldOverride) {
      this.logger.warn(`Eliminación bloqueada por legal hold: ${policy.name}`);
      return { deleted: false, softDeleteUntil: new Date() };
    }

    const softDeleteUntil = new Date();
    softDeleteUntil.setDate(softDeleteUntil.getDate() + policy.softDeletePeriodDays);

    this.logger.log(`Soft-delete ejecutado: política=${policy.name}, reversible hasta=${softDeleteUntil.toISOString()}`);

    // En producción: marcar registros como soft-deleted, programar hard-delete
    return { deleted: true, softDeleteUntil };
  }

  async findById(id: string): Promise<DatagovRetentionPolicy> {
    const policy = await this.policyRepo.findOne({ where: { id } });
    if (!policy) throw new NotFoundException(`Política de retención ${id} no encontrada`);
    return policy;
  }
}
