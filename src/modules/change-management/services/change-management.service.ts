import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChangeRequest } from '../entities/change-request.entity';
import { FeatureFlag } from '../entities/feature-flag.entity';
import { ChangeImpact } from '../entities/change-impact.enum';
import { ChangeStatus } from '../entities/change-status.enum';
import { CreateChangeRequestDto } from '../dto/create-change-request.dto';
import { ReviewChangeDto } from '../dto/review-change.dto';
import { CreateFeatureFlagDto } from '../dto/create-feature-flag.dto';

/**
 * Servicio de Change Management — CAB, rollback, feature flags, dark launch
 * Cubre funciones: CHG-MGMT-001 a 010, CHG-MOD-001 a 005
 */
@Injectable()
export class ChangeManagementService {
  private readonly logger = new Logger(ChangeManagementService.name);

  constructor(
    @InjectRepository(ChangeRequest)
    private changeRepo: Repository<ChangeRequest>,
    @InjectRepository(FeatureFlag)
    private flagRepo: Repository<FeatureFlag>,
  ) {}

  // ── Change Request Management (CHG-MGMT-001 a 006) ──

  /**
   * CHG-MGMT-001: Create Change Request
   */
  async createChangeRequest(dto: CreateChangeRequestDto, createdBy: string): Promise<ChangeRequest> {
    const change = this.changeRepo.create({
      title: dto.title,
      description: dto.description,
      impactLevel: dto.impactLevel || ChangeImpact.MEDIUM,
      riskScore: dto.riskScore || 0,
      status: ChangeStatus.SUBMITTED,
      rollbackPlan: dto.rollbackPlan,
      featureFlag: dto.featureFlag || null,
      rolloutPct: 0,
      cabApprovedBy: null,
      createdBy,
      implementedAt: null,
    });

    const saved = await this.changeRepo.save(change);
    this.logger.log(`Change request creado: id=${saved.id}, title=${dto.title}, impact=${dto.impactLevel}`);
    return saved;
  }

  /**
   * CHG-MGMT-002: CAB Review (approve/reject change)
   */
  async reviewChange(id: string, dto: ReviewChangeDto, reviewerId: string): Promise<ChangeRequest> {
    const change = await this.changeRepo.findOne({ where: { id } });
    if (!change) {
      throw new NotFoundException(`Change request ${id} no encontrado`);
    }

    if (change.status !== ChangeStatus.SUBMITTED) {
      throw new BadRequestException(`Change request ${id} ya fue revisado (status=${change.status})`);
    }

    if (dto.status === ChangeStatus.APPROVED) {
      change.status = ChangeStatus.APPROVED;
      change.cabApprovedBy = reviewerId;
    } else if (dto.status === ChangeStatus.REJECTED) {
      change.status = ChangeStatus.REJECTED;
      change.cabApprovedBy = reviewerId;
    } else {
      throw new BadRequestException(`Estado ${dto.status} no válido para review. Usar approved o rejected.`);
    }

    if (dto.reviewComment) {
      change.description += `\n\n[CAB Review]: ${dto.reviewComment}`;
    }

    const saved = await this.changeRepo.save(change);
    this.logger.log(`CAB review: id=${id}, decision=${dto.status}, reviewer=${reviewerId}`);
    return saved;
  }

  /**
   * CHG-MGMT-003: Assess Change Impact (auto risk scoring)
   */
  async assessImpact(id: string): Promise<{
    impactLevel: ChangeImpact;
    riskScore: number;
    factors: string[];
    recommendation: string;
  }> {
    const change = await this.changeRepo.findOne({ where: { id } });
    if (!change) {
      throw new NotFoundException(`Change request ${id} no encontrado`);
    }

    let riskScore = 0;
    const factors: string[] = [];

    // Heurística de scoring
    if (change.impactLevel === ChangeImpact.HIGH) {
      riskScore += 5;
      factors.push('Impacto HIGH declarado (+5)');
    } else if (change.impactLevel === ChangeImpact.MEDIUM) {
      riskScore += 3;
      factors.push('Impacto MEDIUM declarado (+3)');
    }

    if (!change.rollbackPlan || change.rollbackPlan.trim().length < 20) {
      riskScore += 3;
      factors.push('Plan de rollback insuficiente (+3)');
    }

    if (!change.featureFlag) {
      riskScore += 2;
      factors.push('Sin feature flag — no hay kill switch rápido (+2)');
    }

    if (change.riskScore > 5) {
      riskScore += 2;
      factors.push(`Risk score previo alto (${change.riskScore}) (+2)`);
    }

    riskScore = Math.min(riskScore, 10);

    let recommendation: string;
    if (riskScore >= 8) {
      recommendation = 'NO aprobar sin mitigación. Requerir plan de rollback detallado y feature flag.';
    } else if (riskScore >= 5) {
      recommendation = 'Aprobar con condiciones: rollback plan verificado, ventana de mantenimiento.';
    } else {
      recommendation = 'Aprobar. Riesgo bajo.';
    }

    // Actualizar el change request
    change.riskScore = riskScore;
    await this.changeRepo.save(change);

    this.logger.log(`Impact assessment: id=${id}, risk=${riskScore}/10, factors=${factors.length}`);
    return { impactLevel: change.impactLevel, riskScore, factors, recommendation };
  }

  /**
   * CHG-MGMT-004: List Change Requests (with filters)
   */
  async listChanges(filters?: {
    status?: ChangeStatus;
    impactLevel?: ChangeImpact;
  }): Promise<ChangeRequest[]> {
    const where: Record<string, unknown> = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.impactLevel) where.impactLevel = filters.impactLevel;

    return this.changeRepo.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * CHG-MGMT-005: Implement Change (mark as deployed)
   */
  async implementChange(id: string): Promise<ChangeRequest> {
    const change = await this.changeRepo.findOne({ where: { id } });
    if (!change) {
      throw new NotFoundException(`Change request ${id} no encontrado`);
    }

    if (change.status !== ChangeStatus.APPROVED) {
      throw new BadRequestException(`Change request ${id} no está aprobado (status=${change.status})`);
    }

    change.status = ChangeStatus.IMPLEMENTED;
    change.implementedAt = new Date();

    if (change.featureFlag) {
      const flag = await this.flagRepo.findOne({ where: { flagKey: change.featureFlag } });
      if (flag) {
        flag.isEnabled = true;
        flag.rolloutPercentage = 100;
        await this.flagRepo.save(flag);
      }
    }

    const saved = await this.changeRepo.save(change);
    this.logger.log(`Change implementado: id=${id}, flag=${change.featureFlag || 'N/A'}`);
    return saved;
  }

  /**
   * CHG-MGMT-006: Rollback Change (revert deployment)
   */
  async rollbackChange(id: string): Promise<ChangeRequest> {
    const change = await this.changeRepo.findOne({ where: { id } });
    if (!change) {
      throw new NotFoundException(`Change request ${id} no encontrado`);
    }

    if (change.status !== ChangeStatus.IMPLEMENTED) {
      throw new BadRequestException(`Change request ${id} no está implementado (status=${change.status})`);
    }

    change.status = ChangeStatus.ROLLED_BACK;

    if (change.featureFlag) {
      const flag = await this.flagRepo.findOne({ where: { flagKey: change.featureFlag } });
      if (flag) {
        flag.isEnabled = false;
        flag.rolloutPercentage = 0;
        await this.flagRepo.save(flag);
      }
    }

    const saved = await this.changeRepo.save(change);
    this.logger.warn(`Rollback ejecutado: id=${id}, flag=${change.featureFlag || 'N/A'}`);
    return saved;
  }

  // ── Feature Flag Management (CHG-MGMT-007 a 010) ──

  /**
   * CHG-MGMT-007: Create Feature Flag
   */
  async createFeatureFlag(dto: CreateFeatureFlagDto): Promise<FeatureFlag> {
    const existing = await this.flagRepo.findOne({ where: { flagKey: dto.flagKey } });
    if (existing) {
      throw new BadRequestException(`Feature flag '${dto.flagKey}' ya existe`);
    }

    const flag = this.flagRepo.create({
      flagKey: dto.flagKey,
      description: dto.description || null,
      isEnabled: dto.isEnabled,
      rolloutPercentage: dto.rolloutPercentage || 0,
      targetedUsers: dto.targetedUsers || [],
      config: dto.config || {},
      environment: dto.environment || 'prod',
      isDarkLaunch: dto.isDarkLaunch || false,
    });

    const saved = await this.flagRepo.save(flag);
    this.logger.log(`Feature flag creada: key=${dto.flagKey}, enabled=${dto.isEnabled}, rollout=${dto.rolloutPercentage || 0}%`);
    return saved;
  }

  /**
   * CHG-MGMT-008: Update Rollout Percentage (gradual rollout)
   */
  async updateRollout(flagKey: string, percentage: number): Promise<FeatureFlag> {
    if (percentage < 0 || percentage > 100) {
      throw new BadRequestException('Percentage debe estar entre 0 y 100');
    }

    const flag = await this.flagRepo.findOne({ where: { flagKey } });
    if (!flag) {
      throw new NotFoundException(`Feature flag '${flagKey}' no encontrada`);
    }

    if (percentage > 0 && !flag.isEnabled) {
      flag.isEnabled = true;
    }

    flag.rolloutPercentage = percentage;
    const saved = await this.flagRepo.save(flag);
    this.logger.log(`Rollout actualizado: flag=${flagKey}, pct=${percentage}%`);
    return saved;
  }

  /**
   * CHG-MGMT-009: Evaluate Feature Flag (check if user has access)
   */
  async evaluateFlag(flagKey: string, userId: string): Promise<{
    enabled: boolean;
    reason: string;
  }> {
    const flag = await this.flagRepo.findOne({ where: { flagKey } });
    if (!flag) {
      return { enabled: false, reason: 'Flag no existe' };
    }

    if (!flag.isEnabled) {
      return { enabled: false, reason: 'Flag deshabilitado globalmente' };
    }

    // Whitelist siempre tiene acceso
    if (flag.targetedUsers.includes(userId)) {
      return { enabled: true, reason: 'Usuario en whitelist' };
    }

    // Dark launch: solo whitelist
    if (flag.isDarkLaunch) {
      return { enabled: false, reason: 'Dark launch — solo whitelist' };
    }

    // Rollout percentage: hash determinista del userId
    if (flag.rolloutPercentage >= 100) {
      return { enabled: true, reason: 'Rollout 100%' };
    }

    const hash = this.simpleHash(userId + flag.flagKey);
    const bucket = hash % 100;
    const enabled = bucket < flag.rolloutPercentage;

    return {
      enabled,
      reason: enabled
        ? `Usuario en bucket ${bucket} < ${flag.rolloutPercentage}%`
        : `Usuario en bucket ${bucket} >= ${flag.rolloutPercentage}%`,
    };
  }

  /**
   * CHG-MGMT-010: Kill Switch (instant disable)
   */
  async killSwitch(flagKey: string): Promise<FeatureFlag> {
    const flag = await this.flagRepo.findOne({ where: { flagKey } });
    if (!flag) {
      throw new NotFoundException(`Feature flag '${flagKey}' no encontrada`);
    }

    flag.isEnabled = false;
    flag.rolloutPercentage = 0;
    const saved = await this.flagRepo.save(flag);
    this.logger.warn(`KILL SWITCH activado: flag=${flagKey}`);
    return saved;
  }

  // ── Modern/AI Stubs (CHG-MOD-001 a 005) ──

  /**
   * CHG-MOD-001: Predictive Change Failure Risk (AI stub)
   */
  async predictChangeFailure(id: string): Promise<{
    failureProbability: number;
    riskFactors: string[];
    similarPastChanges: { title: string; outcome: string }[];
    recommendation: string;
    modelVersion: string;
    disclaimer: string;
  }> {
    const change = await this.changeRepo.findOne({ where: { id } });
    if (!change) {
      throw new NotFoundException(`Change request ${id} no encontrado`);
    }

    let failureProbability = 0;
    const riskFactors: string[] = [];
    const similarPastChanges: { title: string; outcome: string }[] = [];

    if (change.impactLevel === ChangeImpact.HIGH) {
      failureProbability += 25;
      riskFactors.push('Impacto HIGH (+25%)');
    }

    if (!change.rollbackPlan || change.rollbackPlan.length < 50) {
      failureProbability += 30;
      riskFactors.push('Rollback plan débil (+30%)');
    }

    if (!change.featureFlag) {
      failureProbability += 20;
      riskFactors.push('Sin feature flag (+20%)');
    }

    if (change.riskScore >= 7) {
      failureProbability += 15;
      riskFactors.push(`Risk score alto (${change.riskScore}/10) (+15%)`);
    }

    // Simular cambios históricos similares
    if (change.impactLevel === ChangeImpact.HIGH) {
      similarPastChanges.push({ title: 'DB migration Q3 2025', outcome: 'failed' });
      similarPastChanges.push({ title: 'API gateway upgrade Q1 2026', outcome: 'rolled_back' });
    } else {
      similarPastChanges.push({ title: 'Minor config update', outcome: 'success' });
    }

    failureProbability = Math.min(failureProbability, 95);

    let recommendation: string;
    if (failureProbability >= 70) {
      recommendation = 'ALTO RIESGO. Postergar hasta mitigar factores. Requerir dry-run en staging.';
    } else if (failureProbability >= 40) {
      recommendation = 'RIESGO MEDIO. Aprobar con conditions: staging OK + rollback plan verificado + feature flag.';
    } else {
      recommendation = 'BAJO RIESGO. Proceder con monitoreo estándar.';
    }

    this.logger.log(`Failure prediction: id=${id}, probability=${failureProbability}%, factors=${riskFactors.length}`);

    return {
      failureProbability,
      riskFactors,
      similarPastChanges,
      recommendation,
      modelVersion: 'risk-mock-v1.0',
      disclaimer: 'Predicción basada en heurísticas. Modelo ML con datos históricos reales pendiente.',
    };
  }

  /**
   * CHG-MOD-002: Automated Rollback Trigger (stub)
   */
  async checkAutoRollback(id: string): Promise<{
    shouldRollback: boolean;
    triggers: string[];
    autoRolledBack: boolean;
    modelVersion: string;
    disclaimer: string;
  }> {
    const change = await this.changeRepo.findOne({ where: { id } });
    if (!change) {
      throw new NotFoundException(`Change request ${id} no encontrado`);
    }

    if (change.status !== ChangeStatus.IMPLEMENTED) {
      return {
        shouldRollback: false,
        triggers: [],
        autoRolledBack: false,
        modelVersion: 'auto-rollback-mock-v1.0',
        disclaimer: 'Change no está implementado — no hay métricas post-deploy.',
      };
    }

    const triggers: string[] = [];
    const shouldRollback = Math.random() > 0.85;

    if (shouldRollback) {
      triggers.push('Error rate > 10% sostenido por 2 minutos');
      triggers.push('Latencia p99 > 1000ms');
      triggers.push('Health check fallando en 3 replicas consecutivas');

      // Auto-rollback
      await this.rollbackChange(id);
    }

    this.logger.log(`Auto-rollback check: id=${id}, shouldRollback=${shouldRollback}, triggers=${triggers.length}`);

    return {
      shouldRollback,
      triggers,
      autoRolledBack: shouldRollback,
      modelVersion: 'auto-rollback-mock-v1.0',
      disclaimer: 'Monitoreo simulado. Integración con APM/metrics pipeline real pendiente.',
    };
  }

  /**
   * CHG-MOD-003: Change Velocity Analytics (stub)
   */
  async getChangeVelocity(): Promise<{
    totalChanges: number;
    successRate: number;
    rollbackRate: number;
    avgTimeToApprove: string;
    avgTimeToImplement: string;
    trend: string;
    modelVersion: string;
    disclaimer: string;
  }> {
    const total = await this.changeRepo.count();
    const implemented = await this.changeRepo.count({ where: { status: ChangeStatus.IMPLEMENTED } });
    const rolledBack = await this.changeRepo.count({ where: { status: ChangeStatus.ROLLED_BACK } });
    const rejected = await this.changeRepo.count({ where: { status: ChangeStatus.REJECTED } });

    const successRate = total > 0 ? Math.round((implemented / total) * 100) : 0;
    const rollbackRate = total > 0 ? Math.round((rolledBack / total) * 100) : 0;

    this.logger.log(`Change velocity: total=${total}, success=${successRate}%, rollback=${rollbackRate}%`);

    return {
      totalChanges: total,
      successRate,
      rollbackRate,
      avgTimeToApprove: '2.5 días',
      avgTimeToImplement: '1.2 días',
      trend: successRate >= 80 ? 'healthy' : 'needs_attention',
      modelVersion: 'velocity-mock-v1.0',
      disclaimer: 'Métricas basadas en datos locales. DORA metrics integration pendiente.',
    };
  }

  /**
   * CHG-MOD-004: Deployment Frequency Benchmarking (stub)
   */
  async getDeploymentBenchmark(): Promise<{
    deploymentsPerWeek: number;
    industryBenchmark: string;
    eliteTier: string;
    recommendation: string;
    modelVersion: string;
    disclaimer: string;
  }> {
    const recentChanges = await this.changeRepo
      .createQueryBuilder('c')
      .where('c.created_at >= :since', { since: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) })
      .getCount();

    const benchmark = recentChanges >= 7 ? 'elite' : recentChanges >= 1 ? 'high' : 'low';

    this.logger.log(`Deployment benchmark: ${recentChanges} deployments/week, tier=${benchmark}`);

    return {
      deploymentsPerWeek: recentChanges,
      industryBenchmark: 'Elite: 7+ deploys/week, High: 1-6, Medium: 1/month, Low: <1/month',
      eliteTier: benchmark,
      recommendation: recentChanges < 1
        ? 'Incrementar frecuencia con smaller, safer changes. Implementar CI/CD automation.'
        : 'Mantener cadencia. Considerar progressive delivery para reducir risk.',
      modelVersion: 'dora-mock-v1.0',
      disclaimer: 'Benchmark basado en DORA metrics. Datos simulados.',
    };
  }

  /**
   * CHG-MOD-005: Intelligent Release Orchestration (stub)
   */
  async getReleaseOrchestration(id: string): Promise<{
    stages: { name: string; status: string; automated: boolean; duration: string }[];
    gates: { name: string; passed: boolean; reason: string }[];
    recommendation: string;
    modelVersion: string;
    disclaimer: string;
  }> {
    const change = await this.changeRepo.findOne({ where: { id } });
    if (!change) {
      throw new NotFoundException(`Change request ${id} no encontrado`);
    }

    const stages = [
      { name: 'Build', status: 'passed', automated: true, duration: '2m 15s' },
      { name: 'Unit Tests', status: 'passed', automated: true, duration: '45s' },
      { name: 'Security Scan', status: 'passed', automated: true, duration: '1m 30s' },
      { name: 'Staging Deploy', status: 'passed', automated: true, duration: '3m 10s' },
      { name: 'Integration Tests', status: 'passed', automated: true, duration: '5m 20s' },
      { name: 'CAB Approval', status: change.status === ChangeStatus.APPROVED ? 'passed' : 'pending', automated: false, duration: '2d 4h' },
      { name: 'Production Deploy', status: change.status === ChangeStatus.IMPLEMENTED ? 'passed' : 'pending', automated: true, duration: '4m 50s' },
      { name: 'Smoke Tests', status: change.status === ChangeStatus.IMPLEMENTED ? 'passed' : 'pending', automated: true, duration: '1m 00s' },
    ];

    const gates = [
      { name: 'Code Coverage >= 80%', passed: true, reason: 'Coverage: 84%' },
      { name: 'No Critical Vulnerabilities', passed: true, reason: '0 critical CVEs' },
      { name: 'CAB Approved', passed: change.status === ChangeStatus.APPROVED || change.status === ChangeStatus.IMPLEMENTED, reason: change.status === ChangeStatus.SUBMITTED ? 'Pendiente CAB' : 'Aprobado' },
      { name: 'Feature Flag Configured', passed: !!change.featureFlag, reason: change.featureFlag ? `Flag: ${change.featureFlag}` : 'Sin flag' },
      { name: 'Rollback Plan Verified', passed: !!(change.rollbackPlan && change.rollbackPlan.length >= 50), reason: change.rollbackPlan && change.rollbackPlan.length >= 50 ? 'Plan detallado' : 'Plan insuficiente' },
    ];

    const allGatesPassed = gates.every((g) => g.passed);

    this.logger.log(`Release orchestration: id=${id}, gatesPassed=${gates.filter(g => g.passed).length}/${gates.length}`);

    return {
      stages,
      gates,
      recommendation: allGatesPassed
        ? 'Todos los gates pasaron. Listo para deploy automatizado.'
        : 'Bloqueado: gates pendientes. Resolver antes de proceder.',
      modelVersion: 'orchestration-mock-v1.0',
      disclaimer: 'Pipeline simulado. Integración con CI/CD real (Jenkins/GitHub Actions) pendiente.',
    };
  }

  // ── Helpers ──

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
}
