import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MonitorMetric } from '../entities/monitor-metric.entity';
import { AlertRule } from '../entities/alert-rule.entity';
import { MetricType } from '../entities/metric-type.enum';
import { AlertSeverity } from '../entities/alert-severity.enum';
import { AlertStatus } from '../entities/alert-status.enum';
import { CreateAlertRuleDto } from '../dto/create-alert-rule.dto';

/**
 * Servicio de Monitoreo en Tiempo Real + Modern AI stubs
 * Cubre funciones: MONITOR-RT-001 a 010, MONITOR-MOD-001 a 005
 */
@Injectable()
export class MonitoringService {
  private readonly logger = new Logger(MonitoringService.name);

  constructor(
    @InjectRepository(MonitorMetric)
    private metricRepo: Repository<MonitorMetric>,
    @InjectRepository(AlertRule)
    private alertRuleRepo: Repository<AlertRule>,
  ) {}

  // ── Real-Time Monitoring (MONITOR-RT-001 a 006) ──

  /**
   * MONITOR-RT-001: Record Metric (uptime, latency, error rate, throughput)
   */
  async recordMetric(
    serviceName: string,
    metricType: MetricType,
    value: number,
    labels?: Record<string, unknown>,
  ): Promise<MonitorMetric> {
    const metric = this.metricRepo.create({
      serviceName,
      metricType,
      value,
      labels: labels || {},
      alertTriggered: false,
      recordedAt: new Date(),
    });

    const saved = await this.metricRepo.save(metric);
    this.logger.log(`Metric recorded: service=${serviceName}, type=${metricType}, value=${value}`);
    return saved;
  }

  /**
   * MONITOR-RT-002: Uptime Ping (health check cada 30s)
   */
  async recordUptime(serviceName: string, isUp: boolean): Promise<{ service: string; up: boolean; timestamp: string }> {
    await this.recordMetric(serviceName, MetricType.UPTIME, isUp ? 1 : 0, { check: 'ping' });
    this.logger.log(`Uptime ping: service=${serviceName}, up=${isUp}`);
    return { service: serviceName, up: isUp, timestamp: new Date().toISOString() };
  }

  /**
   * MONITOR-RT-003: Latency Percentiles (P50/P95/P99)
   */
  async recordLatency(
    serviceName: string,
    p50: number,
    p95: number,
    p99: number,
  ): Promise<void> {
    await this.recordMetric(serviceName, MetricType.LATENCY, p50, { percentile: 'p50' });
    await this.recordMetric(serviceName, MetricType.LATENCY, p95, { percentile: 'p95' });
    await this.recordMetric(serviceName, MetricType.LATENCY, p99, { percentile: 'p99' });
    this.logger.log(`Latency recorded: service=${serviceName}, p50=${p50}ms, p95=${p95}ms, p99=${p99}ms`);
  }

  /**
   * MONITOR-RT-004: Error Rate Tracking
   */
  async recordErrorRate(serviceName: string, errorRatePct: number): Promise<{ triggered: boolean; message: string }> {
    const metric = await this.recordMetric(serviceName, MetricType.ERROR_RATE, errorRatePct);

    // Verificar si dispara alerta
    const rules = await this.alertRuleRepo.find({
      where: { serviceName, metricType: MetricType.ERROR_RATE, status: AlertStatus.ACTIVE },
    });

    let triggered = false;
    for (const rule of rules) {
      if (this.evaluateOperator(rule.operator, errorRatePct, rule.threshold)) {
        metric.alertTriggered = true;
        triggered = true;
        this.logger.warn(`Alert triggered: rule=${rule.name}, service=${serviceName}, errorRate=${errorRatePct}% > threshold=${rule.threshold}%`);
      }
    }

    if (triggered) {
      await this.metricRepo.save(metric);
    }

    return {
      triggered,
      message: triggered
        ? `Error rate ${errorRatePct}% superó umbral en ${serviceName}`
        : `Error rate ${errorRatePct}% dentro de límites`,
    };
  }

  /**
   * MONITOR-RT-005: Get Service Dashboard (aggregated metrics)
   */
  async getServiceDashboard(serviceName: string): Promise<{
    service: string;
    latestMetrics: { type: MetricType; value: number; labels: Record<string, unknown>; recordedAt: Date }[];
    alertCount: number;
  }> {
    const metrics = await this.metricRepo.find({
      where: { serviceName },
      order: { recordedAt: 'DESC' },
      take: 50,
    });

    const alerts = await this.alertRuleRepo.count({
      where: { serviceName, status: AlertStatus.ACTIVE },
    });

    const latestByType = new Map<MetricType, MonitorMetric>();
    for (const m of metrics) {
      if (!latestByType.has(m.metricType)) {
        latestByType.set(m.metricType, m);
      }
    }

    return {
      service: serviceName,
      latestMetrics: Array.from(latestByType.values()).map((m) => ({
        type: m.metricType,
        value: Number(m.value),
        labels: m.labels,
        recordedAt: m.recordedAt,
      })),
      alertCount: alerts,
    };
  }

  /**
   * MONITOR-RT-006: Get Metrics History (time range query)
   */
  async getMetricsHistory(
    serviceName: string,
    metricType: MetricType,
    hoursBack: number = 24,
  ): Promise<MonitorMetric[]> {
    const since = new Date();
    since.setHours(since.getHours() - hoursBack);

    return this.metricRepo
      .createQueryBuilder('m')
      .where('m.service_name = :serviceName', { serviceName })
      .andWhere('m.metric_type = :metricType', { metricType })
      .andWhere('m.recorded_at >= :since', { since })
      .orderBy('m.recorded_at', 'ASC')
      .getMany();
  }

  // ── Alert Management (MONITOR-RT-007 a 010) ──

  /**
   * MONITOR-RT-007: Create Alert Rule
   */
  async createAlertRule(dto: CreateAlertRuleDto): Promise<AlertRule> {
    const rule = this.alertRuleRepo.create({
      name: dto.name,
      serviceName: dto.serviceName,
      metricType: dto.metricType,
      operator: dto.operator,
      threshold: dto.threshold,
      severity: dto.severity || AlertSeverity.WARNING,
      status: AlertStatus.ACTIVE,
      notificationChannels: dto.notificationChannels || [],
      messageTemplate: dto.messageTemplate || null,
      windowSeconds: dto.windowSeconds || 300,
    });

    const saved = await this.alertRuleRepo.save(rule);
    this.logger.log(`Alert rule creada: id=${saved.id}, name=${dto.name}, service=${dto.serviceName}`);
    return saved;
  }

  /**
   * MONITOR-RT-008: List Active Alerts
   */
  async listActiveAlerts(): Promise<AlertRule[]> {
    return this.alertRuleRepo.find({
      where: { status: AlertStatus.ACTIVE },
      order: { severity: 'DESC', createdAt: 'DESC' },
    });
  }

  /**
   * MONITOR-RT-009: Acknowledge/Resolve Alert
   */
  async updateAlertStatus(ruleId: string, status: AlertStatus): Promise<AlertRule> {
    const rule = await this.alertRuleRepo.findOne({ where: { id: ruleId } });
    if (!rule) {
      throw new NotFoundException(`Alert rule ${ruleId} no encontrada`);
    }

    rule.status = status;
    const saved = await this.alertRuleRepo.save(rule);
    this.logger.log(`Alert ${ruleId} estado cambiado a ${status}`);
    return saved;
  }

  /**
   * MONITOR-RT-010: Synthetic Health Check (probe simulation)
   */
  async runSyntheticCheck(
    serviceName: string,
    endpoint: string,
  ): Promise<{
    service: string;
    endpoint: string;
    statusCode: number;
    responseTimeMs: number;
    healthy: boolean;
    timestamp: string;
  }> {
    // Simulación de synthetic probe
    const healthy = Math.random() > 0.05;
    const statusCode = healthy ? 200 : 503;
    const responseTimeMs = Math.floor(Math.random() * 200 + 20);

    await this.recordMetric(serviceName, MetricType.UPTIME, healthy ? 1 : 0, {
      check: 'synthetic',
      endpoint,
    });

    if (!healthy) {
      await this.recordMetric(serviceName, MetricType.ERROR_RATE, 100, { check: 'synthetic', endpoint });
    }

    this.logger.log(`Synthetic check: service=${serviceName}, endpoint=${endpoint}, status=${statusCode}, time=${responseTimeMs}ms`);
    return {
      service: serviceName,
      endpoint,
      statusCode,
      responseTimeMs,
      healthy,
      timestamp: new Date().toISOString(),
    };
  }

  // ── Modern AI Stubs (MONITOR-MOD-001 a 005) ──

  /**
   * MONITOR-MOD-001: AI-Powered Performance Anomaly Detection (stub)
   */
  async detectPerformanceAnomaly(serviceName: string): Promise<{
    anomalies: { metric: string; currentValue: number; baseline: number; deviationPct: number; severity: string }[];
    modelVersion: string;
    disclaimer: string;
  }> {
    const recentMetrics = await this.metricRepo.find({
      where: { serviceName },
      order: { recordedAt: 'DESC' },
      take: 100,
    });

    const anomalies: { metric: string; currentValue: number; baseline: number; deviationPct: number; severity: string }[] = [];

    const byType = new Map<MetricType, number[]>();
    for (const m of recentMetrics) {
      if (!byType.has(m.metricType)) byType.set(m.metricType, []);
      byType.get(m.metricType)!.push(Number(m.value));
    }

    for (const [type, values] of byType) {
      if (values.length < 5) continue;
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const latest = values[0];
      const deviationPct = avg > 0 ? Math.round(((latest - avg) / avg) * 100) : 0;

      if (Math.abs(deviationPct) > 30) {
        anomalies.push({
          metric: type,
          currentValue: latest,
          baseline: Math.round(avg * 100) / 100,
          deviationPct,
          severity: Math.abs(deviationPct) > 60 ? 'critical' : 'warning',
        });
      }
    }

    this.logger.log(`Anomaly detection: service=${serviceName}, anomalies=${anomalies.length}`);
    return {
      anomalies,
      modelVersion: 'anomaly-mock-v1.0',
      disclaimer: 'Detección basada en desviación estadística simple. Integración con modelo ML real pendiente.',
    };
  }

  /**
   * MONITOR-MOD-002: Real-Time Performance Bottleneck Detection (stub)
   */
  async detectBottlenecks(serviceName: string): Promise<{
    bottlenecks: { component: string; issue: string; impact: string; recommendation: string }[];
    modelVersion: string;
    disclaimer: string;
  }> {
    const metrics = await this.metricRepo.find({
      where: { serviceName },
      order: { recordedAt: 'DESC' },
      take: 20,
    });

    const bottlenecks: { component: string; issue: string; impact: string; recommendation: string }[] = [];

    const latencyMetrics = metrics.filter((m) => m.metricType === MetricType.LATENCY);
    if (latencyMetrics.length > 0) {
      const maxLatency = Math.max(...latencyMetrics.map((m) => Number(m.value)));
      if (maxLatency > 500) {
        bottlenecks.push({
          component: 'API Response',
          issue: `Latencia p99 = ${maxLatency}ms excede SLA de 500ms`,
          impact: 'Degradación de experiencia de usuario',
          recommendation: 'Investigar queries N+1, agregar índices, o implementar cache Redis',
        });
      }
    }

    const errorMetrics = metrics.filter((m) => m.metricType === MetricType.ERROR_RATE);
    if (errorMetrics.length > 0) {
      const maxError = Math.max(...errorMetrics.map((m) => Number(m.value)));
      if (maxError > 5) {
        bottlenecks.push({
          component: 'Error Handling',
          issue: `Error rate = ${maxError}% excede umbral del 5%`,
          impact: 'Posible pérdida de transacciones',
          recommendation: 'Revisar logs de error, verificar conectividad DB y Redis',
        });
      }
    }

    if (bottlenecks.length === 0) {
      bottlenecks.push({
        component: 'Overall',
        issue: 'No se detectaron bottlenecks significativos',
        impact: 'Ninguno',
        recommendation: 'Mantener monitoreo continuo',
      });
    }

    this.logger.log(`Bottleneck detection: service=${serviceName}, found=${bottlenecks.length}`);
    return {
      bottlenecks,
      modelVersion: 'bottleneck-mock-v1.0',
      disclaimer: 'Detección basada en umbrales estáticos. Integración con APM real pendiente.',
    };
  }

  /**
   * MONITOR-MOD-003: Adaptive Caching with ML (stub)
   */
  async getAdaptiveCacheRecommendations(serviceName: string): Promise<{
    recommendations: { pattern: string; action: string; expectedImprovement: string }[];
    modelVersion: string;
    disclaimer: string;
  }> {
    const recommendations = [
      {
        pattern: 'Repeated SELECT queries on user_profiles',
        action: 'Cache con TTL=300s en Redis para queries de perfil de usuario',
        expectedImprovement: '~40% reducción en latencia p99',
      },
      {
        pattern: 'Frequent aggregation queries on audit_logs',
        action: 'Materialized view + cache preemptivo cada 5 min',
        expectedImprovement: '~60% reducción en load de DB',
      },
      {
        pattern: 'Session lookups on every authenticated request',
        action: 'JWT stateless + Redis cache con TTL=session_duration',
        expectedImprovement: '~25% reducción en requests a DB',
      },
    ];

    this.logger.log(`Cache recommendations: service=${serviceName}`);
    return {
      recommendations,
      modelVersion: 'cache-ml-mock-v1.0',
      disclaimer: 'Recomendaciones basadas en patrones comunes. Análisis ML con query log real pendiente.',
    };
  }

  /**
   * MONITOR-MOD-004: Edge Computing Serverless Optimization (stub)
   */
  async getEdgeOptimizationReport(): Promise<{
    functions: { name: string; region: string; coldStartMs: number; invocationsPerDay: number; optimization: string }[];
    summary: string;
    modelVersion: string;
    disclaimer: string;
  }> {
    const functions = [
      { name: 'auth-verify-token', region: 'us-east-1', coldStartMs: 340, invocationsPerDay: 50000, optimization: 'Reducir bundle size, usar provisioned concurrency para peak hours' },
      { name: 'ledger-transfer-handler', region: 'us-east-1', coldStartMs: 520, invocationsPerDay: 12000, optimization: 'Migrar a contenedor warm pool, reducir dependencies' },
      { name: 'privacy-dsar-compile', region: 'eu-west-1', coldStartMs: 890, invocationsPerDay: 500, optimization: 'Aceptable para volumen bajo. Mantener async trigger.' },
      { name: 'storage-thumbnail-gen', region: 'us-east-1', coldStartMs: 210, invocationsPerDay: 8000, optimization: 'Ya optimizado. Considerar edge cache para thumbnails frecuentes.' },
    ];

    const avgColdStart = Math.round(functions.reduce((sum, f) => sum + f.coldStartMs, 0) / functions.length);
    this.logger.log(`Edge optimization report: ${functions.length} functions, avg cold start=${avgColdStart}ms`);

    return {
      functions,
      summary: `${functions.length} funciones serverless analizadas. Cold start promedio: ${avgColdStart}ms. 1 función requiere optimización crítica.`,
      modelVersion: 'edge-mock-v1.0',
      disclaimer: 'Datos simulados. Integración con AWS Lambda/Cloud Functions real pendiente.',
    };
  }

  /**
   * MONITOR-MOD-005: Performance Budget SLA Enforcement (stub)
   */
  async enforcePerformanceBudget(serviceName: string): Promise<{
    budgets: { metric: string; sla: number; current: number; status: 'within' | 'breached' | 'warning'; action: string }[];
    overallStatus: string;
    modelVersion: string;
    disclaimer: string;
  }> {
    const metrics = await this.metricRepo.find({
      where: { serviceName },
      order: { recordedAt: 'DESC' },
      take: 10,
    });

    const latestByType = new Map<MetricType, number>();
    for (const m of metrics) {
      if (!latestByType.has(m.metricType)) latestByType.set(m.metricType, Number(m.value));
    }

    const budgets = [
      {
        metric: 'latency_p99',
        sla: 500,
        current: latestByType.get(MetricType.LATENCY) || Math.floor(Math.random() * 600 + 100),
        status: '' as '' | 'within' | 'breached' | 'warning',
        action: '',
      },
      {
        metric: 'error_rate',
        sla: 1,
        current: latestByType.get(MetricType.ERROR_RATE) || Math.random() * 2,
        status: '' as '' | 'within' | 'breached' | 'warning',
        action: '',
      },
      {
        metric: 'uptime',
        sla: 99.9,
        current: (latestByType.get(MetricType.UPTIME) ?? 1) * 100,
        status: '' as '' | 'within' | 'breached' | 'warning',
        action: '',
      },
    ];

    for (const b of budgets) {
      if (b.metric === 'uptime') {
        if (b.current < 99.9) { b.status = 'breached'; b.action = 'Escalar a on-call inmediatamente'; }
        else if (b.current < 99.95) { b.status = 'warning'; b.action = 'Investigar degradación'; }
        else { b.status = 'within'; b.action = 'OK'; }
      } else if (b.metric === 'error_rate') {
        if (b.current > b.sla) { b.status = 'breached'; b.action = 'Investigar y remediar'; }
        else if (b.current > b.sla * 0.8) { b.status = 'warning'; b.action = 'Monitorear de cerca'; }
        else { b.status = 'within'; b.action = 'OK'; }
      } else {
        if (b.current > b.sla) { b.status = 'breached'; b.action = 'Optimizar queries/caches'; }
        else if (b.current > b.sla * 0.8) { b.status = 'warning'; b.action = 'Pre-optimizar'; }
        else { b.status = 'within'; b.action = 'OK'; }
      }
    }

    const breached = budgets.filter((b) => b.status === 'breached').length;
    const warning = budgets.filter((b) => b.status === 'warning').length;
    const overallStatus = breached > 0 ? 'breached' : warning > 0 ? 'warning' : 'within';

    this.logger.log(`SLA enforcement: service=${serviceName}, overall=${overallStatus}, breached=${breached}`);

    return {
      budgets: budgets.map((b) => ({ ...b, status: b.status as 'within' | 'breached' | 'warning' })),
      overallStatus,
      modelVersion: 'sla-mock-v1.0',
      disclaimer: 'SLA enforcement basado en métricas recientes. Policy engine real pendiente.',
    };
  }

  // ── Helper ──

  private evaluateOperator(operator: string, value: number, threshold: number): boolean {
    switch (operator) {
      case '>': return value > threshold;
      case '<': return value < threshold;
      case '>=': return value >= threshold;
      case '<=': return value <= threshold;
      case '==': return value === threshold;
      default: return false;
    }
  }
}
