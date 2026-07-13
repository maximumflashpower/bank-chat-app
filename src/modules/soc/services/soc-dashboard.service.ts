import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SocAlert, AlertSeverity, AlertStatus } from '../entities/soc-alert.entity';
import { SocIncident, IncidentStatus, IncidentPriority } from '../entities/soc-incident.entity';

export interface DashboardSummary {
  totalAlerts: number;
  alertsBySeverity: Record<string, number>;
  alertsByStatus: Record<string, number>;
  activeIncidents: number;
  unassignedAlerts: number;
  recentCritical: SocAlert[];
}

export interface AlertCorrelationGroup {
  correlationGroup: string;
  alertCount: number;
  severity: AlertSeverity;
  eventSources: string[];
  firstSeen: Date;
  lastSeen: Date;
}

@Injectable()
export class SocDashboardService {
  constructor(
    @InjectRepository(SocAlert)
    private alertRepo: Repository<SocAlert>,
    @InjectRepository(SocIncident)
    private incidentRepo: Repository<SocIncident>,
  ) {}

  async getDashboard(): Promise<DashboardSummary> {
    const totalAlerts = await this.alertRepo.count();

    const severityCounts = await this.alertRepo
      .createQueryBuilder('alert')
      .select('alert.severity', 'severity')
      .addSelect('COUNT(*)', 'count')
      .groupBy('alert.severity')
      .getRawMany();

    const statusCounts = await this.alertRepo
      .createQueryBuilder('alert')
      .select('alert.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('alert.status')
      .getRawMany();

    const activeIncidents = await this.incidentRepo.count({
      where: { status: IncidentStatus.OPEN },
    });

    const unassignedAlerts = await this.alertRepo.count({
      where: { analystAssigned: undefined as any },
    });

    const recentCritical = await this.alertRepo.find({
      where: { severity: AlertSeverity.CRITICAL, status: AlertStatus.NEW },
      order: { createdAt: 'DESC' },
      take: 10,
    });

    const alertsBySeverity: Record<string, number> = {};
    for (const row of severityCounts) {
      alertsBySeverity[row.severity] = parseInt(row.count, 10);
    }

    const alertsByStatus: Record<string, number> = {};
    for (const row of statusCounts) {
      alertsByStatus[row.status] = parseInt(row.count, 10);
    }

    return {
      totalAlerts,
      alertsBySeverity,
      alertsByStatus,
      activeIncidents,
      unassignedAlerts,
      recentCritical,
    };
  }

  async getAlerts(filters?: {
    severity?: AlertSeverity;
    status?: AlertStatus;
    eventSource?: string;
    limit?: number;
  }): Promise<SocAlert[]> {
    const qb = this.alertRepo.createQueryBuilder('alert');

    if (filters?.severity) {
      qb.andWhere('alert.severity = :severity', { severity: filters.severity });
    }
    if (filters?.status) {
      qb.andWhere('alert.status = :status', { status: filters.status });
    }
    if (filters?.eventSource) {
      qb.andWhere('alert.eventSource = :source', { source: filters.eventSource });
    }

    qb.orderBy('alert.createdAt', 'DESC').limit(filters?.limit ?? 50);

    return qb.getMany();
  }

  async createIncident(data: {
    title: string;
    classification: string;
    severity: string;
    priority?: string;
    impactSummary?: string;
    assignedLead?: string;
  }): Promise<SocIncident> {
    const incident = new SocIncident();
    incident.title = data.title;
    incident.classification = data.classification as any;
    incident.severity = data.severity;
    incident.priority = data.priority ? data.priority as any : IncidentPriority.P2;
    incident.impactSummary = data.impactSummary || null;
    incident.assignedLead = data.assignedLead || null;
    incident.openedAt = new Date();
    return this.incidentRepo.save(incident);
  }

  async getIncidents(): Promise<SocIncident[]> {
    return this.incidentRepo.find({
      where: { status: IncidentStatus.OPEN },
      order: { openedAt: 'DESC' },
      take: 50,
    });
  }

  async correlateAlerts(): Promise<AlertCorrelationGroup[]> {
    const groups = await this.alertRepo
      .createQueryBuilder('alert')
      .select('alert.correlationGroup', 'correlationGroup')
      .addSelect('COUNT(*)', 'alertCount')
      .addSelect('MAX(alert.severity)', 'severity')
      .addSelect('array_agg(DISTINCT alert.eventSource)', 'eventSources')
      .addSelect('MIN(alert.firstSeenAt)', 'firstSeen')
      .addSelect('MAX(alert.lastSeenAt)', 'lastSeen')
      .where('alert.correlationGroup IS NOT NULL')
      .groupBy('alert.correlationGroup')
      .getRawMany();

    return groups.map((g) => ({
      correlationGroup: g.correlationgroup,
      alertCount: parseInt(g.alertcount, 10),
      severity: g.severity,
      eventSources: g.eventsources,
      firstSeen: g.firstseen,
      lastSeen: g.lastseen,
    }));
  }

  async investigateAlert(
    alertId: string,
    analystId: string,
    notes?: string,
  ): Promise<SocAlert> {
    const alert = await this.alertRepo.findOne({ where: { id: alertId } });
    if (!alert) {
      throw new Error(`Alert ${alertId} not found`);
    }
    alert.status = AlertStatus.INVESTIGATING;
    alert.analystAssigned = analystId;
    alert.triagedAt = new Date();
    return this.alertRepo.save(alert);
  }

  async classifyAlert(
    alertId: string,
    classification: AlertStatus,
    falsePositiveReason?: string,
  ): Promise<SocAlert> {
    const alert = await this.alertRepo.findOne({ where: { id: alertId } });
    if (!alert) {
      throw new Error(`Alert ${alertId} not found`);
    }
    alert.status = classification;
    if (classification === AlertStatus.FALSE_POSITIVE && falsePositiveReason) {
      alert.falsePositiveReason = falsePositiveReason;
    }
    if (classification === AlertStatus.CLOSED || classification === AlertStatus.FALSE_POSITIVE) {
      alert.closedAt = new Date();
    }
    return this.alertRepo.save(alert);
  }
}
