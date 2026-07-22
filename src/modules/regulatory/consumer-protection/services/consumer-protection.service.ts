import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan, Between } from 'typeorm';
import { ConsumerProtectionMonitor } from '../entities/consumer-protection-monitor.entity';
import { ConsumerProtectionCase } from '../entities/consumer-protection-case.entity';
import {
  RegulationType,
  MonitorStatus,
  ViolationSeverity,
  CaseStatus,
} from '../entities/consumer-protection-enum';

@Injectable()
export class ConsumerProtectionService {
  private readonly logger = new Logger(ConsumerProtectionService.name);

  constructor(
    @InjectRepository(ConsumerProtectionMonitor)
    private monitorRepo: Repository<ConsumerProtectionMonitor>,
    @InjectRepository(ConsumerProtectionCase)
    private caseRepo: Repository<ConsumerProtectionCase>,
  ) {}

  // REG-CP-001: Monitor Reg E — Electronic Fund Transfer Act
  async monitorRegE(): Promise<ConsumerProtectionMonitor[]> {
    const monitors = await this.monitorRepo.find({
      where: { regulationType: RegulationType.REG_E, isActive: true },
    });

    for (const monitor of monitors) {
      monitor.lastCheckRun = new Date();
      monitor.nextScheduledCheck = new Date(
        Date.now() + monitor.checkFrequencyHours * 60 * 60 * 1000,
      );
      await this.monitorRepo.save(monitor);
    }

    this.logger.log(`Reg E monitoring executed for ${monitors.length} monitors`);
    return monitors;
  }

  // REG-CP-002: Monitor Reg Z — Truth in Lending Act
  async monitorRegZ(): Promise<ConsumerProtectionMonitor[]> {
    const monitors = await this.monitorRepo.find({
      where: { regulationType: RegulationType.REG_Z, isActive: true },
    });

    for (const monitor of monitors) {
      monitor.lastCheckRun = new Date();
      monitor.nextScheduledCheck = new Date(
        Date.now() + monitor.checkFrequencyHours * 60 * 60 * 1000,
      );
      await this.monitorRepo.save(monitor);
    }

    this.logger.log(`Reg Z monitoring executed for ${monitors.length} monitors`);
    return monitors;
  }

  // REG-CP-003: Monitor Reg CC — Expedited Funds Availability
  async monitorRegCC(): Promise<ConsumerProtectionMonitor[]> {
    const monitors = await this.monitorRepo.find({
      where: { regulationType: RegulationType.REG_CC, isActive: true },
    });

    for (const monitor of monitors) {
      monitor.lastCheckRun = new Date();
      monitor.nextScheduledCheck = new Date(
        Date.now() + monitor.checkFrequencyHours * 60 * 60 * 1000,
      );
      await this.monitorRepo.save(monitor);
    }

    this.logger.log(`Reg CC monitoring executed for ${monitors.length} monitors`);
    return monitors;
  }

  // REG-CP-004: Monitor Reg DD — Deposit Account Disclosures
  async monitorRegDD(): Promise<ConsumerProtectionMonitor[]> {
    const monitors = await this.monitorRepo.find({
      where: { regulationType: RegulationType.REG_DD, isActive: true },
    });

    for (const monitor of monitors) {
      monitor.lastCheckRun = new Date();
      monitor.nextScheduledCheck = new Date(
        Date.now() + monitor.checkFrequencyHours * 60 * 60 * 1000,
      );
      await this.monitorRepo.save(monitor);
    }

    this.logger.log(`Reg DD monitoring executed for ${monitors.length} monitors`);
    return monitors;
  }

  // REG-CP-005: Generate violation alerts
  async generateViolationAlerts(monitorId: string): Promise<ConsumerProtectionCase[]> {
    const monitor = await this.monitorRepo.findOne({ where: { id: monitorId } });
    if (!monitor) throw new NotFoundException(`Monitor ${monitorId} not found`);

    monitor.monitorStatus = MonitorStatus.VIOLATION_DETECTED;
    monitor.violationsDetectedCount += 1;
    await this.monitorRepo.save(monitor);

    const newCase = this.caseRepo.create({
      caseNumber: `CP-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      monitorId: monitor.id,
      regulationType: monitor.regulationType,
      caseStatus: CaseStatus.OPEN,
      violationSeverity: ViolationSeverity.MEDIUM,
      violationTitle: `Potential ${monitor.regulationType.toUpperCase()} violation detected`,
      violationDescription: monitor.ruleDescription || 'Automated detection triggered',
      discoveredAt: new Date(),
      priorityScore: 50,
      isFalsePositive: false,
    });

    const saved = await this.caseRepo.save(newCase);
    this.logger.warn(`Violation alert created: ${saved.caseNumber} for monitor ${monitorId}`);
    return [saved];
  }

  // REG-CP-006: Automatic regulatory reports
  async generateRegulatoryReport(
    regulationType: RegulationType,
    startDate: Date,
    endDate: Date,
  ): Promise<{
    regulation: string;
    period: { start: string; end: string };
    totalMonitors: number;
    totalViolations: number;
    resolvedViolations: number;
    openCases: number;
    escalatedCases: number;
    cases: ConsumerProtectionCase[];
  }> {
    const monitors = await this.monitorRepo.find({
      where: { regulationType, isActive: true },
    });

    const monitorIds = monitors.map((m) => m.id);

    const cases = monitorIds.length > 0
      ? await this.caseRepo
          .createQueryBuilder('cpc')
          .where('cpc.monitor_id IN (:...monitorIds)', { monitorIds })
          .andWhere('cpc.discovered_at BETWEEN :start AND :end', { start: startDate, end: endDate })
          .orderBy('cpc.discovered_at', 'DESC')
          .getMany()
      : [];

    const resolvedViolations = cases.filter((c) =>
      [CaseStatus.CLOSED_RESOLVED, CaseStatus.CLOSED_NO_ACTION].includes(c.caseStatus),
    ).length;

    const openCases = cases.filter((c) => c.caseStatus === CaseStatus.OPEN).length;
    const escalatedCases = cases.filter((c) => c.caseStatus === CaseStatus.PENDING_REVIEW).length;

    this.logger.log(
      `Regulatory report generated for ${regulationType}: ${cases.length} cases, ${resolvedViolations} resolved`,
    );

    return {
      regulation: regulationType,
      period: { start: startDate.toISOString(), end: endDate.toISOString() },
      totalMonitors: monitors.length,
      totalViolations: cases.length,
      resolvedViolations,
      openCases,
      escalatedCases,
      cases,
    };
  }

  // REG-CP-007: Case management for investigations
  async assignCase(caseId: string, assignedTo: string): Promise<ConsumerProtectionCase> {
    const caseEntity = await this.caseRepo.findOne({ where: { id: caseId } });
    if (!caseEntity) throw new NotFoundException(`Case ${caseId} not found`);

    caseEntity.assignedTo = assignedTo;
    caseEntity.caseStatus = CaseStatus.INVESTIGATING;
    const saved = await this.caseRepo.save(caseEntity);

    this.logger.log(`Case ${caseEntity.caseNumber} assigned to ${assignedTo}`);
    return saved;
  }

  async escalateCase(caseId: string): Promise<ConsumerProtectionCase> {
    const caseEntity = await this.caseRepo.findOne({ where: { id: caseId } });
    if (!caseEntity) throw new NotFoundException(`Case ${caseId} not found`);

    caseEntity.caseStatus = CaseStatus.PENDING_REVIEW;
    caseEntity.escalatedAt = new Date();
    const saved = await this.caseRepo.save(caseEntity);

    this.logger.warn(`Case ${caseEntity.caseNumber} escalated`);
    return saved;
  }

  async resolveCase(
    caseId: string,
    resolutionNotes: string,
    remediationAction: string,
    isFalsePositive: boolean,
  ): Promise<ConsumerProtectionCase> {
    const caseEntity = await this.caseRepo.findOne({ where: { id: caseId } });
    if (!caseEntity) throw new NotFoundException(`Case ${caseId} not found`);

    caseEntity.caseStatus = isFalsePositive
      ? CaseStatus.CLOSED_NO_ACTION
      : CaseStatus.CLOSED_RESOLVED;
    caseEntity.resolutionNotes = resolutionNotes;
    caseEntity.remediationActionTaken = remediationAction;
    caseEntity.resolvedAt = new Date();
    caseEntity.isFalsePositive = isFalsePositive;

    const saved = await this.caseRepo.save(caseEntity);

    // Update monitor stats
    if (!isFalsePositive && caseEntity.monitorId) {
      const monitor = await this.monitorRepo.findOne({ where: { id: caseEntity.monitorId } });
      if (monitor) {
        monitor.violationsResolvedCount += 1;
        await this.monitorRepo.save(monitor);
      }
    }

    this.logger.log(`Case ${caseEntity.caseNumber} resolved (falsePositive=${isFalsePositive})`);
    return saved;
  }

  // Helper: Create monitor
  async createMonitor(data: {
    regulationType: RegulationType;
    monitoringRuleName: string;
    ruleDescription?: string;
    checkFrequencyHours?: number;
    severityThreshold?: string;
    autoEscalate?: boolean;
    createdBy: string;
  }): Promise<ConsumerProtectionMonitor> {
    const monitor = this.monitorRepo.create({
      regulationType: data.regulationType,
      monitoringRuleName: data.monitoringRuleName,
      ruleDescription: data.ruleDescription || undefined,
      checkFrequencyHours: data.checkFrequencyHours || 24,
      severityThreshold: data.severityThreshold || 'medium',
      autoEscalate: data.autoEscalate || false,
      createdBy: data.createdBy,
      nextScheduledCheck: new Date(Date.now() + (data.checkFrequencyHours || 24) * 60 * 60 * 1000),
    });
    return this.monitorRepo.save(monitor);
  }

  // Helper: Get all monitors with optional filter
  async getMonitors(regulationType?: RegulationType): Promise<ConsumerProtectionMonitor[]> {
    if (regulationType) {
      return this.monitorRepo.find({
        where: { regulationType },
        order: { createdAt: 'DESC' },
      });
    }
    return this.monitorRepo.find({ order: { createdAt: 'DESC' } });
  }

  // Helper: Get cases with optional filter
  async getCases(filters?: {
    monitorId?: string;
    caseStatus?: CaseStatus;
    regulationType?: RegulationType;
  }): Promise<ConsumerProtectionCase[]> {
    const qb = this.caseRepo.createQueryBuilder('cpc').orderBy('cpc.discovered_at', 'DESC');

    if (filters?.monitorId) {
      qb.andWhere('cpc.monitor_id = :monitorId', { monitorId: filters.monitorId });
    }
    if (filters?.caseStatus) {
      qb.andWhere('cpc.case_status = :status', { status: filters.caseStatus });
    }
    if (filters?.regulationType) {
      qb.andWhere('cpc.regulation_type = :regType', { regType: filters.regulationType });
    }

    return qb.limit(100).getMany();
  }
}
