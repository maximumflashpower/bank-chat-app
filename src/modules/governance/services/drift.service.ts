import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GovDriftDetection } from '../entities/gov-drift-detection.entity';
import { DriftStatus } from '../entities/drift-status.enum';
import { Severity } from '../entities/severity.enum';

@Injectable()
export class DriftService {
  private readonly logger = new Logger(DriftService.name);

  constructor(
    @InjectRepository(GovDriftDetection)
    private readonly driftRepo: Repository<GovDriftDetection>,
  ) {}

  async detect(params: {
    resourceType: string;
    resourceId: string;
    expectedState: Record<string, any>;
    actualState: Record<string, any>;
  }): Promise<GovDriftDetection> {
    const diff = this.computeDiff(params.expectedState, params.actualState);
    const severity = this.classifySeverity(diff);
    const drift = this.driftRepo.create({
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      expectedState: params.expectedState,
      actualState: params.actualState,
      driftDiff: diff,
      severity,
      status: DriftStatus.OPEN,
    });
    const saved = await this.driftRepo.save(drift);
    this.logger.warn(`Drift detected: ${saved.id} — resource: ${params.resourceType}/${params.resourceId} — severity: ${severity}`);
    return saved;
  }

  async getReport(): Promise<{ total: number; open: number; remediating: number; resolved: number; bySeverity: Record<string, number> }> {
    const all = await this.driftRepo.find();
    const bySeverity: Record<string, number> = {};
    for (const d of all) {
      bySeverity[d.severity] = (bySeverity[d.severity] || 0) + 1;
    }
    return {
      total: all.length,
      open: all.filter(d => d.status === DriftStatus.OPEN).length,
      remediating: all.filter(d => d.status === DriftStatus.REMEDIATING).length,
      resolved: all.filter(d => d.status === DriftStatus.RESOLVED).length,
      bySeverity,
    };
  }

  async remediate(id: string, remediationAction: string): Promise<GovDriftDetection> {
    const drift = await this.driftRepo.findOne({ where: { id } });
    if (!drift) throw new NotFoundException(`Drift ${id} not found`);
    drift.remediationAction = remediationAction;
    drift.status = DriftStatus.REMEDIATING;
    const updated = await this.driftRepo.save(drift);
    this.logger.log(`Drift remediation started: ${id}`);
    return updated;
  }

  async markResolved(id: string): Promise<GovDriftDetection> {
    const drift = await this.driftRepo.findOne({ where: { id } });
    if (!drift) throw new NotFoundException(`Drift ${id} not found`);
    drift.status = DriftStatus.RESOLVED;
    drift.remediatedAt = new Date();
    const updated = await this.driftRepo.save(drift);
    this.logger.log(`Drift resolved: ${id}`);
    return updated;
  }

  private computeDiff(expected: Record<string, any>, actual: Record<string, any>): Record<string, any> {
    const diff: Record<string, any> = {};
    const allKeys = new Set([...Object.keys(expected), ...Object.keys(actual)]);
    for (const key of allKeys) {
      if (JSON.stringify(expected[key]) !== JSON.stringify(actual[key])) {
        diff[key] = { expected: expected[key], actual: actual[key] };
      }
    }
    return diff;
  }

  private classifySeverity(diff: Record<string, any>): Severity {
    const keys = Object.keys(diff);
    if (keys.length === 0) return Severity.LOW;
    const criticalKeys = ['password', 'secret', 'key', 'token', 'permission'];
    for (const k of keys) {
      if (criticalKeys.some(c => k.toLowerCase().includes(c))) {
        return Severity.CRITICAL;
      }
    }
    if (keys.length >= 5) return Severity.HIGH;
    if (keys.length >= 2) return Severity.MEDIUM;
    return Severity.LOW;
  }
}
