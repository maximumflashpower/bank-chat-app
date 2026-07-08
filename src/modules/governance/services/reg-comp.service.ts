import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GovRegComp } from '../entities/gov-reg-comp.entity';
import { RegCompType } from '../entities/reg-comp-type.enum';
import { CreateRegCompDto } from '../dto/create-reg-comp.dto';

@Injectable()
export class RegCompService {
  constructor(
    @InjectRepository(GovRegComp)
    private regCompRepo: Repository<GovRegComp>,
  ) {}

  // REG-COMP-006: Audit Scheduler
  async scheduleAudit(auditConfig: { frequency: string; scope: string }): Promise<GovRegComp> {
    const record = this.regCompRepo.create({
      type: RegCompType.AUDIT_SCHEDULER,
      name: `Audit Schedule - ${auditConfig.frequency}`,
      config: auditConfig,
      status: 'scheduled',
    });
    return this.regCompRepo.save(record);
  }

  // REG-COMP-007: Compliance Training
  async createTrainingRecord(userId: string, trainingName: string, dueDate?: string): Promise<GovRegComp> {
    const record = this.regCompRepo.create({
      type: RegCompType.COMPLIANCE_TRAINING,
      name: `Training: ${trainingName}`,
      assignedToUserId: userId,
      config: { userName: `${trainingName}-user`, required: true },
      scheduledFor: dueDate,
      status: 'pending',
    });
    return this.regCompRepo.save(record);
  }

  // REG-COMP-008: DLP Policy Engine
  async createDlpPolicy(policyName: string, rules: any[], severity: string): Promise<GovRegComp> {
    const record = this.regCompRepo.create({
      type: RegCompType.DLP_POLICY_ENGINE,
      name: `DLP Policy: ${policyName}`,
      config: { rules, severity },
      status: 'active',
    });
    return this.regCompRepo.save(record);
  }

  // REG-COMP-009: Insider Threat Detection
  async detectInsiderThreat(threatIndicators: any[]): Promise<{ threats: any[]; riskScore: number }> {
    const riskFactors = threatIndicators.map((i) => (i.severity ?? 1));
    const avgRisk = riskFactors.length > 0 ? riskFactors.reduce((a, b) => a + b, 0) / riskFactors.length : 0;
    const record = this.regCompRepo.create({
      type: RegCompType.INSIDER_THREAT_DETECTION,
      name: `Threat Scan ${new Date().toISOString().split('T')[0]}`,
      config: { indicators: threatIndicators, detected: avgRisk > 3 },
      score: avgRisk,
      status: avgRisk > 5 ? 'critical' : avgRisk > 3 ? 'warning' : 'normal',
    });
    await this.regCompRepo.save(record);
    return { threats: threatIndicators.filter((i) => i.severity >= 3), riskScore: avgRisk };
  }

  // REG-COMP-010: Third-Party Risk Assessment
  async assessThirdPartyRisk(vendorId: string, assessmentType: string, evidence?: any): Promise<GovRegComp> {
    const record = this.regCompRepo.create({
      type: RegCompType.THIRD_PARTY_RISK,
      name: `Vendor Risk: ${vendorId}`,
      metadata: { vendorId, assessmentType, evidence },
      status: 'pending',
    });
    return this.regCompRepo.save(record);
  }

  // REG-COMP-011: Continuous Attestation
  async createAttestation(attesterId: string, attestations: string[]): Promise<GovRegComp> {
    const record = this.regCompRepo.create({
      type: RegCompType.CONTINUOUS_ATTESTATION,
      name: `Attestation Batch - ${attesterId}`,
      assignedToUserId: attesterId,
      config: { items: attestations },
      isAttested: false,
      status: 'pending',
    });
    return this.regCompRepo.save(record);
  }

  // REG-COMP-012: Regulatory Change Monitor
  async monitorRegulatoryChange(jurisdictions: string[], regulatoryDomains: string[]): Promise<{ changes: any[]; impact: string }> {
    const simulatedChanges = jurisdictions.flatMap((jur) =>
      regulatoryDomains.map((dom) => ({ jurisdiction: jur, domain: dom, updateType: 'amendment', date: new Date().toISOString() }))
    );
    const record = this.regCompRepo.create({
      type: RegCompType.REGULATORY_CHANGE_MONITOR,
      name: `Regulatory Watch - ${jurisdictions.join(', ')}`,
      config: { jurisdictions, domains: regulatoryDomains },
      findings: JSON.stringify(simulatedChanges),
      status: 'monitored',
    });
    await this.regCompRepo.save(record);
    return { changes: simulatedChanges, impact: simulatedChanges.length > 5 ? 'high' : 'medium' };
  }

  // REG-COMP-013: Automated Reporting
  async generateAutomatedReport(reportType: string, parameters: any, recipients: string[]): Promise<GovRegComp> {
    const record = this.regCompRepo.create({
      type: RegCompType.AUTOMATED_REPORTING,
      name: `Auto Report: ${reportType}`,
      config: { type: reportType, parameters, recipients },
      status: 'generated',
      completedAt: new Date().toISOString().split('T')[0],
    });
    return this.regCompRepo.save(record);
  }

  // REG-COMP-014: Compliance Metrics
  async calculateComplianceMetrics(timeRange: { from: string; to: string }): Promise<{ metrics: Record<string, number>; overallScore: number }> {
    const records = await this.regCompRepo.find({ where: {} });
    const completionRate = records.length > 0 ? records.filter((r) => r.isAttested).length / records.length : 0;
    const avgScore = records.length > 0 ? records.reduce((a, r) => a + (r.score ?? 0), 0) / records.length : 0;
    const overallScore = completionRate * 50 + (avgScore / 10) * 50;
    return {
      metrics: { totalRecords: records.length, completed: records.filter((r) => r.completedAt).length, pending: records.filter((r) => !r.completedAt).length },
      overallScore: Math.min(100, Math.round(overallScore)),
    };
  }

  // Generic CRUD
  async findAll(type?: RegCompType, status?: string): Promise<GovRegComp[]> {
    const where: any = {};
    if (type) where.type = type;
    if (status) where.status = status;
    return this.regCompRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<GovRegComp> {
    const record = await this.regCompRepo.findOne({ where: { id } });
    if (!record) throw new NotFoundException(`RegComp record ${id} not found`);
    return record;
  }

  async update(id: string, updates: Partial<GovRegComp>): Promise<GovRegComp> {
    const record = await this.findOne(id);
    Object.assign(record, updates);
    return this.regCompRepo.save(record);
  }

  async remove(id: string): Promise<void> {
    const record = await this.findOne(id);
    await this.regCompRepo.remove(record);
  }

  async complete(id: string): Promise<GovRegComp> {
    const record = await this.findOne(id);
    record.completedAt = new Date().toISOString().split('T')[0];
    record.isAttested = true;
    record.status = 'completed';
    return this.regCompRepo.save(record);
  }
}
