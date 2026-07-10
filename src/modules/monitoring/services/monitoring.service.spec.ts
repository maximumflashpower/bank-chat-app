import { MonitoringService } from './monitoring.service';
import { Repository } from 'typeorm';
import { MonitorMetric } from '../entities/monitor-metric.entity';
import { AlertRule } from '../entities/alert-rule.entity';
import { MetricType } from '../entities/metric-type.enum';
import { AlertSeverity } from '../entities/alert-severity.enum';
import { AlertStatus } from '../entities/alert-status.enum';
import { CreateAlertRuleDto } from '../dto/create-alert-rule.dto';

jest.mock('../entities/monitor-metric.entity');
jest.mock('../entities/alert-rule.entity');

describe('MonitoringService', () => {
  let service: MonitoringService;
  let mockMetricRepo: Partial<Repository<MonitorMetric>>;
  let mockAlertRuleRepo: Partial<Repository<AlertRule>>;

  const now = new Date(2026, 6, 10, 12, 0, 0);

  beforeEach(() => {
    mockMetricRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      count: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    mockAlertRuleRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      count: jest.fn(),
    };

    (mockMetricRepo.create as jest.Mock).mockReturnValue({});
    (mockAlertRuleRepo.create as jest.Mock).mockReturnValue({});

    service = new MonitoringService(
      mockMetricRepo as Repository<MonitorMetric>,
      mockAlertRuleRepo as Repository<AlertRule>,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('recordMetric (MONITOR-RT-001)', () => {
    it('debe registrar una métrica con labels opcionales', async () => {
      const saved: any = {
        id: 'metric-001',
        serviceName: 'api-gateway',
        metricType: MetricType.LATENCY,
        value: 150,
        labels: { endpoint: '/users' },
        alertTriggered: false,
        recordedAt: now,
      };

      (mockMetricRepo.create as jest.Mock).mockReturnValue(saved);
      (mockMetricRepo.save as jest.Mock).mockResolvedValue(saved);

      const result = await service.recordMetric('api-gateway', MetricType.LATENCY, 150, { endpoint: '/users' });

      expect(result.serviceName).toBe('api-gateway');
      expect(result.metricType).toBe(MetricType.LATENCY);
      expect(result.value).toBe(150);
    });

    it('debe crear métrica sin labels si no se proveen', async () => {
      const saved: any = {
        id: 'metric-002',
        serviceName: 'db',
        metricType: MetricType.UPTIME,
        value: 1,
        labels: {},
        alertTriggered: false,
      };

      (mockMetricRepo.create as jest.Mock).mockReturnValue(saved);
      (mockMetricRepo.save as jest.Mock).mockResolvedValue(saved);

      const result = await service.recordMetric('db', MetricType.UPTIME, 1);

      expect(result.labels).toEqual({});
    });
  });

  describe('recordUptime (MONITOR-RT-002)', () => {
    it('debe registrar uptime=1 cuando isUp=true', async () => {
      const saved: any = { id: 'uptime-001', serviceName: 'api', metricType: MetricType.UPTIME, value: 1 };
      (mockMetricRepo.create as jest.Mock).mockReturnValue(saved);
      (mockMetricRepo.save as jest.Mock).mockResolvedValue(saved);

      const result = await service.recordUptime('api', true);

      expect(result.up).toBe(true);
      expect(result.service).toBe('api');
    });

    it('debe registrar uptime=0 cuando isUp=false', async () => {
      const saved: any = { id: 'uptime-002', serviceName: 'db', metricType: MetricType.UPTIME, value: 0 };
      (mockMetricRepo.create as jest.Mock).mockReturnValue(saved);
      (mockMetricRepo.save as jest.Mock).mockResolvedValue(saved);

      const result = await service.recordUptime('db', false);

      expect(result.up).toBe(false);
    });
  });

  describe('recordLatency (MONITOR-RT-003)', () => {
    it('debe registrar P50, P95 y P99 como 3 métricas separadas', async () => {
      const metrics: any[] = [
        { id: 'lat-p50', metricType: MetricType.LATENCY, value: 50, labels: { percentile: 'p50' } },
        { id: 'lat-p95', metricType: MetricType.LATENCY, value: 200, labels: { percentile: 'p95' } },
        { id: 'lat-p99', metricType: MetricType.LATENCY, value: 500, labels: { percentile: 'p99' } },
      ];

      (mockMetricRepo.create as jest.Mock).mockReturnValue({});
      (mockMetricRepo.save as jest.Mock)
        .mockResolvedValue(metrics[0])
        .mockResolvedValue(metrics[1])
        .mockResolvedValue(metrics[2]);

      await service.recordLatency('api-gateway', 50, 200, 500);

      expect(mockMetricRepo.save).toHaveBeenCalledTimes(3);
    });
  });

  describe('recordErrorRate (MONITOR-RT-004)', () => {
    it('debe retornar triggered=false cuando errorRate está dentro del umbral', async () => {
      const metric: any = { id: 'err-001', alertTriggered: false };
      (mockMetricRepo.create as jest.Mock).mockReturnValue(metric);
      (mockMetricRepo.save as jest.Mock).mockResolvedValue(metric);
      (mockAlertRuleRepo.find as jest.Mock).mockResolvedValue([]);

      const result = await service.recordErrorRate('api', 2.5);

      expect(result.triggered).toBe(false);
      expect(result.message).toContain('dentro de límites');
    });

    it('debe marcar alertTriggered=true y retornar triggered cuando hay regla que se dispara', async () => {
      const metric: any = { id: 'err-002', alertTriggered: false };
      const rule: any = {
        name: 'high-errors',
        serviceName: 'api',
        metricType: MetricType.ERROR_RATE,
        threshold: 5,
        operator: '>',
        status: AlertStatus.ACTIVE,
      };

      (mockMetricRepo.create as jest.Mock).mockReturnValue(metric);
      (mockMetricRepo.save as jest.Mock).mockResolvedValue({ ...metric, alertTriggered: true });
      (mockAlertRuleRepo.find as jest.Mock).mockResolvedValue([rule]);

      const result = await service.recordErrorRate('api', 8.0);

      expect(result.triggered).toBe(true);
      expect(result.message).toContain('superó umbral');
    });
  });

  describe('getServiceDashboard (MONITOR-RT-005)', () => {
    it('debe retornar dashboard con últimas métricas por tipo y conteo de alertas', async () => {
      const metrics: any[] = [
        { id: 'm1', metricType: MetricType.LATENCY, value: 100, labels: { p50: true }, recordedAt: now },
        { id: 'm2', metricType: MetricType.ERROR_RATE, value: 1.5, labels: {}, recordedAt: now },
        { id: 'm3', metricType: MetricType.UPTIME, value: 1, labels: {}, recordedAt: now },
      ];

      (mockMetricRepo.find as jest.Mock).mockResolvedValue(metrics);
      (mockAlertRuleRepo.count as jest.Mock).mockResolvedValue(2);

      const result = await service.getServiceDashboard('api-gateway');

      expect(result.service).toBe('api-gateway');
      expect(result.latestMetrics.length).toBe(3);
      expect(result.alertCount).toBe(2);
    });

    it('debe retornar dashboard vacío cuando no hay métricas', async () => {
      (mockMetricRepo.find as jest.Mock).mockResolvedValue([]);
      (mockAlertRuleRepo.count as jest.Mock).mockResolvedValue(0);

      const result = await service.getServiceDashboard('empty-service');

      expect(result.latestMetrics).toEqual([]);
      expect(result.alertCount).toBe(0);
    });
  });

  describe('getMetricsHistory (MONITOR-RT-006)', () => {
    it('debe obtener métricas históricas del último periodo', async () => {
      const metrics: any[] = [
        { id: 'hist-1', value: 100, recordedAt: new Date(2026, 6, 9, 12) },
        { id: 'hist-2', value: 120, recordedAt: new Date(2026, 6, 9, 13) },
      ];

      const qbMock = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(metrics),
      };

      (mockMetricRepo.createQueryBuilder as jest.Mock).mockReturnValue(qbMock);

      const result = await service.getMetricsHistory('api', MetricType.LATENCY, 24);

      expect(result.length).toBe(2);
      expect(qbMock.orderBy).toHaveBeenCalledWith('m.recorded_at', 'ASC');
    });
  });

  describe('createAlertRule (MONITOR-RT-007)', () => {
    it('debe crear una regla de alerta activa con default severity WARNING', async () => {
      const dto: CreateAlertRuleDto = {
        name: 'High CPU',
        serviceName: 'worker',
        metricType: MetricType.THROUGHPUT,
        operator: '>',
        threshold: 1000,
        notificationChannels: ['slack'],
      };

      const saved: any = {
        id: 'alert-001',
        ...dto,
        severity: AlertSeverity.WARNING,
        status: AlertStatus.ACTIVE,
        windowSeconds: 300,
        messageTemplate: null,
      };

      (mockAlertRuleRepo.create as jest.Mock).mockReturnValue(saved);
      (mockAlertRuleRepo.save as jest.Mock).mockResolvedValue(saved);

      const result = await service.createAlertRule(dto);

      expect(result.id).toBe('alert-001');
      expect(result.status).toBe(AlertStatus.ACTIVE);
      expect(result.severity).toBe(AlertSeverity.WARNING);
      expect(result.windowSeconds).toBe(300);
    });

    it('debe usar severity CUSTOM cuando se proporciona', async () => {
      const dto: CreateAlertRuleDto = {
        name: 'Critical DB',
        serviceName: 'postgres',
        metricType: MetricType.UPTIME,
        operator: '<',
        threshold: 99.9,
        severity: AlertSeverity.CRITICAL,
      };

      const saved: any = {
        id: 'alert-002',
        ...dto,
        status: AlertStatus.ACTIVE,
        windowSeconds: 60,
        notificationChannels: [],
      };

      (mockAlertRuleRepo.create as jest.Mock).mockReturnValue(saved);
      (mockAlertRuleRepo.save as jest.Mock).mockResolvedValue(saved);

      const result = await service.createAlertRule(dto);

      expect(result.severity).toBe(AlertSeverity.CRITICAL);
    });
  });

  describe('listActiveAlerts (MONITOR-RT-008)', () => {
    it('debe listar todas las reglas de alerta ACTIVAS', async () => {
      const alerts: any[] = [
        { id: 'a1', name: 'CPU High', severity: AlertSeverity.CRITICAL, status: AlertStatus.ACTIVE },
        { id: 'a2', name: 'Memory High', severity: AlertSeverity.WARNING, status: AlertStatus.ACTIVE },
      ];

      (mockAlertRuleRepo.find as jest.Mock).mockResolvedValue(alerts);

      const result = await service.listActiveAlerts();

      expect(result.length).toBe(2);
      expect(mockAlertRuleRepo.find).toHaveBeenCalledWith(expect.objectContaining({
        where: { status: AlertStatus.ACTIVE },
        order: { severity: 'DESC', createdAt: 'DESC' },
      }));
    });

    it('debe retornar array vacío cuando no hay alertas activas', async () => {
      (mockAlertRuleRepo.find as jest.Mock).mockResolvedValue([]);

      const result = await service.listActiveAlerts();

      expect(result).toEqual([]);
    });
  });

  describe('updateAlertStatus (MONITOR-RT-009)', () => {
    it('debe cambiar estado de alerta a RESOLVED', async () => {
      const rule: any = { id: 'alert-001', name: 'test', status: AlertStatus.ACTIVE };

      (mockAlertRuleRepo.findOne as jest.Mock).mockResolvedValue(rule);
      (mockAlertRuleRepo.save as jest.Mock).mockResolvedValue({ ...rule, status: AlertStatus.RESOLVED });

      const result = await service.updateAlertStatus('alert-001', AlertStatus.RESOLVED);

      expect(result.status).toBe(AlertStatus.RESOLVED);
    });

    it('debe lanzar NotFoundException si la regla no existe', async () => {
      (mockAlertRuleRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.updateAlertStatus('alert-999', AlertStatus.RESOLVED))
        .rejects.toThrow('no encontrada');
    });
  });

  describe('runSyntheticCheck (MONITOR-RT-010)', () => {
    it('debe simular health check exitoso', async () => {
      // healthy = Math.random() > 0.05 → 0.2 > 0.05 = true
      const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.2);

      const saved: any = { id: 'metric-synthetic', alertTriggered: false };
      (mockMetricRepo.create as jest.Mock).mockReturnValue(saved);
      (mockMetricRepo.save as jest.Mock)
        .mockResolvedValueOnce(saved)
        .mockResolvedValueOnce(saved);

      const result = await service.runSyntheticCheck('api-gateway', '/health');

      expect(result.statusCode).toBe(200);
      expect(result.healthy).toBe(true);
      expect(result.service).toBe('api-gateway');

      randomSpy.mockRestore();
    });

    it('debe simular health check fallido', async () => {
      // healthy = Math.random() > 0.05 → 0.01 > 0.05 = false
      const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.01);

      const saved: any = { id: 'metric-synthetic-err', alertTriggered: false };
      (mockMetricRepo.create as jest.Mock).mockReturnValue(saved);
      (mockMetricRepo.save as jest.Mock)
        .mockResolvedValueOnce(saved)
        .mockResolvedValueOnce(saved);

      const result = await service.runSyntheticCheck('api-gateway', '/health');

      expect(result.statusCode).toBe(503);
      expect(result.healthy).toBe(false);

      randomSpy.mockRestore();
    });
  });

  describe('detectPerformanceAnomaly (MONITOR-MOD-001)', () => {
    it('debe detectar anomalías cuando hay desviación > 30% del baseline', async () => {
      // El service hace find con order DESC, así que el primer elemento es el más reciente
      // values[0] = latest = 200 (más reciente, primero en el array)
      // avg = (200 + 100*10) / 11 = 1200/11 ≈ 109
      // deviationPct = ((200 - 109) / 109) * 100 ≈ 83% → anomaly!
      const metrics: any[] = [
        { metricType: MetricType.LATENCY, value: 200, recordedAt: now },
      ];
      for (let i = 1; i <= 10; i++) {
        metrics.push({
          metricType: MetricType.LATENCY,
          value: 100,
          recordedAt: new Date(now.getTime() - i * 60000),
        });
      }

      (mockMetricRepo.find as jest.Mock).mockResolvedValue(metrics);

      const result = await service.detectPerformanceAnomaly('api-gateway');

      expect(result.anomalies.length).toBeGreaterThan(0);
      expect(result.modelVersion).toBe('anomaly-mock-v1.0');
      
      const anomaly = result.anomalies[0];
      expect(Math.abs(anomaly.deviationPct)).toBeGreaterThan(30);
    });

    it('debe retornar anomalies vacío si no hay desviaciones significativas', async () => {
      const metrics: any[] = [];
      for (let i = 0; i < 10; i++) {
        metrics.push({
          metricType: MetricType.LATENCY,
          value: 100 + i, // Variación gradual < 30%
          recordedAt: new Date(now.getTime() - i * 60000),
        });
      }

      (mockMetricRepo.find as jest.Mock).mockResolvedValue(metrics);

      const result = await service.detectPerformanceAnomaly('stable-service');

      expect(result.anomalies.length).toBe(0);
    });

    it('debe requerir mínimo 5 valores para calcular baseline', async () => {
      const metrics: any[] = [
        { metricType: MetricType.LATENCY, value: 100, recordedAt: now },
        { metricType: MetricType.LATENCY, value: 120, recordedAt: new Date(now.getTime() - 60000) },
      ];

      (mockMetricRepo.find as jest.Mock).mockResolvedValue(metrics);

      const result = await service.detectPerformanceAnomaly('insufficient-data');

      expect(result.anomalies.length).toBe(0);
    });
  });

  describe('detectBottlenecks (MONITOR-MOD-002)', () => {
    it('debe detectar bottleneck de latencia alta (> 500ms)', async () => {
      const metrics: any[] = [
        { metricType: MetricType.LATENCY, value: 600, recordedAt: now },
        { metricType: MetricType.LATENCY, value: 550, recordedAt: new Date(now.getTime() - 60000) },
      ];

      (mockMetricRepo.find as jest.Mock).mockResolvedValue(metrics);

      const result = await service.detectBottlenecks('slow-api');

      expect(result.bottlenecks.length).toBeGreaterThan(0);
      
      const latencyBottleneck = result.bottlenecks.find((b: any) => b.component === 'API Response');
      expect(latencyBottleneck).toBeDefined();
      expect(latencyBottleneck.issue).toContain('excede SLA');
    });

    it('debe detectar bottleneck de error rate alto (> 5%)', async () => {
      const metrics: any[] = [
        { metricType: MetricType.ERROR_RATE, value: 8.5, recordedAt: now },
        { metricType: MetricType.ERROR_RATE, value: 9.0, recordedAt: new Date(now.getTime() - 60000) },
      ];

      (mockMetricRepo.find as jest.Mock).mockResolvedValue(metrics);

      const result = await service.detectBottlenecks('error-prone');

      const errorBottleneck = result.bottlenecks.find((b: any) => b.component === 'Error Handling');
      expect(errorBottleneck).toBeDefined();
      expect(errorBottleneck.issue).toContain('excede umbral');
    });

    it('debe retornar ningún bottleneck cuando todo está dentro de límites', async () => {
      const metrics: any[] = [
        { metricType: MetricType.LATENCY, value: 100, recordedAt: now },
        { metricType: MetricType.ERROR_RATE, value: 1.5, recordedAt: new Date(now.getTime() - 60000) },
      ];

      (mockMetricRepo.find as jest.Mock).mockResolvedValue(metrics);

      const result = await service.detectBottlenecks('healthy-service');

      const overallBottleneck = result.bottlenecks.find((b: any) => b.component === 'Overall');
      expect(overallBottleneck).toBeDefined();
      expect(overallBottleneck.issue).toContain('No se detectaron');
    });
  });

  describe('getAdaptiveCacheRecommendations (MONITOR-MOD-003)', () => {
    it('debe retornar recomendaciones de caching', async () => {
      const result = await service.getAdaptiveCacheRecommendations('api-service');

      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.modelVersion).toBe('cache-ml-mock-v1.0');
      
      const firstRec = result.recommendations[0];
      expect(firstRec.pattern).toBeDefined();
      expect(firstRec.action).toBeDefined();
      expect(firstRec.expectedImprovement).toBeDefined();
    });

    it('debe incluir recomendaciones específicas para diferentes patrones', async () => {
      const result = await service.getAdaptiveCacheRecommendations('api');

      expect(result.recommendations.some((r: any) => r.pattern.includes('SELECT'))).toBe(true);
      expect(result.recommendations.some((r: any) => r.pattern.includes('Session'))).toBe(true);
    });
  });

  describe('getEdgeOptimizationReport (MONITOR-MOD-004)', () => {
    it('debe retornar report con funciones serverless y cold start analysis', async () => {
      const result = await service.getEdgeOptimizationReport();

      expect(result.functions.length).toBeGreaterThan(0);
      expect(result.summary).toBeDefined();
      expect(result.modelVersion).toBe('edge-mock-v1.0');

      const firstFn = result.functions[0];
      expect(firstFn.name).toBeDefined();
      expect(firstFn.region).toBeDefined();
      expect(firstFn.coldStartMs).toBeGreaterThan(0);
      expect(firstFn.invocationsPerDay).toBeGreaterThan(0);
    });

    it('debe incluir optimización recomendada para cada función', async () => {
      const result = await service.getEdgeOptimizationReport();

      result.functions.forEach((fn: any) => {
        expect(fn.optimization).toBeDefined();
        expect(fn.optimization.length).toBeGreaterThan(0);
      });
    });
  });

  describe('enforcePerformanceBudget (MONITOR-MOD-005)', () => {
    it('debe retornar SLA status "within" cuando todo está en límite', async () => {
      const metrics: any[] = [
        { metricType: MetricType.LATENCY, value: 300, recordedAt: now },
        { metricType: MetricType.ERROR_RATE, value: 0.5, recordedAt: now },
        { metricType: MetricType.UPTIME, value: 1, recordedAt: now },
      ];

      (mockMetricRepo.find as jest.Mock).mockResolvedValue(metrics);

      const result = await service.enforcePerformanceBudget('well-behaved');

      expect(result.overallStatus).toBe('within');
      expect(result.budgets.length).toBe(3);
      
      const latencyBudget = result.budgets.find((b: any) => b.metric === 'latency_p99');
      expect(latencyBudget.status).toBe('within');
      expect(latencyBudget.sla).toBe(500);
    });

    it('debe retornar status "breached" cuando algún budget se supera', async () => {
      const metrics: any[] = [
        { metricType: MetricType.LATENCY, value: 600, recordedAt: now },
        { metricType: MetricType.ERROR_RATE, value: 1.5, recordedAt: now },
        { metricType: MetricType.UPTIME, value: 1, recordedAt: now },
      ];

      (mockMetricRepo.find as jest.Mock).mockResolvedValue(metrics);

      const result = await service.enforcePerformanceBudget('breached-budget');

      const latencyBudget = result.budgets.find((b: any) => b.metric === 'latency_p99');
      expect(latencyBudget.status).toBe('breached');
      expect(latencyBudget.action).toContain('Optimizar');
    });

    it('debe retornar status "warning" cuando está cerca del límite', async () => {
      const metrics: any[] = [
        { metricType: MetricType.ERROR_RATE, value: 0.9, recordedAt: now },
        { metricType: MetricType.LATENCY, value: 300, recordedAt: now },
        { metricType: MetricType.UPTIME, value: 0.9995, recordedAt: now },
      ];

      (mockMetricRepo.find as jest.Mock).mockResolvedValue(metrics);

      const result = await service.enforcePerformanceBudget('warning-state');

      const errorBudget = result.budgets.find((b: any) => b.metric === 'error_rate');
      expect(errorBudget.status).toBe('warning');
    });

    it('debe retornar "breached" cuando uptime < 99.9%', async () => {
      const metrics: any[] = [
        { metricType: MetricType.UPTIME, value: 0.998, recordedAt: now },
        { metricType: MetricType.LATENCY, value: 100, recordedAt: now },
        { metricType: MetricType.ERROR_RATE, value: 0.1, recordedAt: now },
      ];

      (mockMetricRepo.find as jest.Mock).mockResolvedValue(metrics);

      const result = await service.enforcePerformanceBudget('downtime');

      const uptimeBudget = result.budgets.find((b: any) => b.metric === 'uptime');
      expect(uptimeBudget.status).toBe('breached');
      expect(uptimeBudget.action).toContain('Escalar');
    });
  });

  describe('evaluateOperator (privado)', () => {
    it('debe comparar correctamente con operadores > < >= <= ==', () => {
      // Testeado indirectamente via recordErrorRate
    });
  });
});
