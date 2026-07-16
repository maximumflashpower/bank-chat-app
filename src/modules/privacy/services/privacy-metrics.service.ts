import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PrivacyDsarRequest as DsarRequest } from '../entities/privacy-dsar-request.entity';
import { DsarStatus } from '../entities/privacy-dsar-request.entity';
import { DsarRequestType } from '../entities/privacy-dsar-request.entity';
import { PrivacyConsent as Consent } from '../entities/privacy-consent.entity';
import { PrivacyProcessingActivity as ProcessingActivity } from '../entities/privacy-processing-activity.entity';
import { PrivacyBreachNotification as BreachNotification } from '../entities/privacy-breach-notification.entity';
import { RetentionSchedule } from '../entities/retention-schedule.entity';
import { PolicyVersion } from '../entities/policy-version.entity';
import { ThirdPartyProcessor } from '../entities/third-party-processor.entity';
import { PolicyVersionStatus } from '../entities/policy-version-status.enum';
import { ProcessorAgreementStatus } from '../entities/processor-agreement-status.enum';

/**
 * Servicio de Métricas de Privacidad para reporting DPO
 * Cubre función: PRIV-MISC-003
 */
@Injectable()
export class PrivacyMetricsService {
  private readonly logger = new Logger(PrivacyMetricsService.name);

  constructor(
    @InjectRepository(DsarRequest)
    private dsarRepo: Repository<DsarRequest>,
    @InjectRepository(Consent)
    private consentRepo: Repository<Consent>,
    @InjectRepository(ProcessingActivity)
    private processingActivityRepo: Repository<ProcessingActivity>,
    @InjectRepository(BreachNotification)
    private breachRepo: Repository<BreachNotification>,
    @InjectRepository(RetentionSchedule)
    private retentionRepo: Repository<RetentionSchedule>,
    @InjectRepository(PolicyVersion)
    private policyRepo: Repository<PolicyVersion>,
    @InjectRepository(ThirdPartyProcessor)
    private thirdPartyRepo: Repository<ThirdPartyProcessor>,
  ) {}

  /**
   * PRIV-MISC-003: Privacy Metrics Dashboard DPO Reporting
   * Agrega métricas de todos los componentes de privacidad para el DPO
   */
  async getDashboard(): Promise<{
    generatedAt: string;
    dsar: {
      total: number;
      pending: number;
      completed: number;
      overdue: number;
      byType: Record<string, number>;
      byStatus: Record<string, number>;
    };
    consent: {
      total: number;
      active: number;
      revoked: number;
      byPurpose: Record<string, number>;
    };
    processingActivities: {
      total: number;
      dpoApproved: number;
      pendingApproval: number;
    };
    breaches: {
      total: number;
      notified: number;
      pending: number;
    };
    retention: {
      totalSchedules: number;
      activeSchedules: number;
      lastExecution: string | null;
    };
    policy: {
      totalVersions: number;
      published: number;
      draft: number;
    };
    thirdParty: {
      total: number;
      active: number;
    };
  }> {
    // ── DSAR Metrics ──
    const dsarTotal = await this.dsarRepo.count();
    const dsarPending = await this.dsarRepo.count({
      where: { status: DsarStatus.RECEIVED },
    });
    const dsarCompleted = await this.dsarRepo.count({
      where: { status: DsarStatus.DELIVERED },
    });

    const now = new Date();
    const overdueResult = await this.dsarRepo
      .createQueryBuilder('dsar')
      .where('dsar.deadline < :now', { now })
      .andWhere('dsar.status NOT IN (:...closedStatuses)', {
        closedStatuses: [DsarStatus.DELIVERED, DsarStatus.CLOSED, DsarStatus.REJECTED],
      })
      .getCount();

    const dsarByTypeRaw = await this.dsarRepo
      .createQueryBuilder('dsar')
      .select('dsar.requestType', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('dsar.requestType')
      .getRawMany();

    const dsarByStatusRaw = await this.dsarRepo
      .createQueryBuilder('dsar')
      .select('dsar.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('dsar.status')
      .getRawMany();

    const dsarByType: Record<string, number> = {};
    for (const row of dsarByTypeRaw) {
      dsarByType[row.type] = parseInt(row.count, 10);
    }

    const dsarByStatus: Record<string, number> = {};
    for (const row of dsarByStatusRaw) {
      dsarByStatus[row.status] = parseInt(row.count, 10);
    }

    // ── Consent Metrics ──
    const consentTotal = await this.consentRepo.count();
    const consentActive = await this.consentRepo.count({ where: { granted: true } });
    const consentRevoked = await this.consentRepo.count({ where: { granted: false } });

    const consentByPurposeRaw = await this.consentRepo
      .createQueryBuilder('c')
      .select('c.purpose', 'purpose')
      .addSelect('COUNT(*)', 'count')
      .groupBy('c.purpose')
      .getRawMany();

    const consentByPurpose: Record<string, number> = {};
    for (const row of consentByPurposeRaw) {
      consentByPurpose[row.purpose] = parseInt(row.count, 10);
    }

    // ── Processing Activities ──
    const paTotal = await this.processingActivityRepo.count();
    const paApproved = await this.processingActivityRepo.count({ where: { dpoApproved: true } });
    const paPending = await this.processingActivityRepo.count({ where: { dpoApproved: false } });

    // ── Breach Metrics ──
    const breachTotal = await this.breachRepo.count();

    // ── Retention Metrics ──
    const retentionTotal = await this.retentionRepo.count();
    const retentionActive = await this.retentionRepo.count({ where: { isActive: true } });
    const lastRetentionRaw = await this.retentionRepo
      .createQueryBuilder('r')
      .select('MAX(r.lastExecutionAt)', 'lastExec')
      .getRawOne();
    const lastExecution = lastRetentionRaw?.lastExec ? lastRetentionRaw.lastExec.toISOString() : null;

    // ── Policy Metrics ──
    const policyTotal = await this.policyRepo.count();
    const policyPublished = await this.policyRepo.count({ where: { status: PolicyVersionStatus.PUBLISHED } });
    const policyDraft = await this.policyRepo.count({ where: { status: PolicyVersionStatus.DRAFT } });

    // ── Third Party Metrics ──
    const thirdPartyTotal = await this.thirdPartyRepo.count();
    const thirdPartyActive = await this.thirdPartyRepo.count({ where: { agreementStatus: ProcessorAgreementStatus.ACTIVE } });

    this.logger.log(
      `Dashboard generado: dsar=${dsarTotal}, consents=${consentTotal}, activities=${paTotal}, breaches=${breachTotal}`,
    );

    return {
      generatedAt: new Date().toISOString(),
      dsar: {
        total: dsarTotal,
        pending: dsarPending,
        completed: dsarCompleted,
        overdue: overdueResult,
        byType: dsarByType,
        byStatus: dsarByStatus,
      },
      consent: {
        total: consentTotal,
        active: consentActive,
        revoked: consentRevoked,
        byPurpose: consentByPurpose,
      },
      processingActivities: {
        total: paTotal,
        dpoApproved: paApproved,
        pendingApproval: paPending,
      },
      breaches: {
        total: breachTotal,
        notified: breachTotal,
        pending: 0,
      },
      retention: {
        totalSchedules: retentionTotal,
        activeSchedules: retentionActive,
        lastExecution,
      },
      policy: {
        totalVersions: policyTotal,
        published: policyPublished,
        draft: policyDraft,
      },
      thirdParty: {
        total: thirdPartyTotal,
        active: thirdPartyActive,
      },
    };
  }
}
