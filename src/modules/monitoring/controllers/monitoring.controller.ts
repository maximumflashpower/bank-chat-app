import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../identity/guards/jwt-auth.guard';
import { MonitoringService } from '../services/monitoring.service';
import { CreateAlertRuleDto } from '../dto/create-alert-rule.dto';

@ApiTags('Monitoring')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/monitoring')
export class MonitoringController {
  constructor(private readonly monitoringService: MonitoringService) {}

  /** MONITOR-RT-001 */
  @Post('metrics')
  @ApiOperation({ summary: 'Registrar métrica personalizada' })
  async recordMetric(@Body() body: any) {
    return this.monitoringService.recordMetric(
      body.serviceName,
      body.metricType,
      body.value,
      body.labels,
    );
  }

  /** MONITOR-RT-002 */
  @Post('uptime/:service')
  @ApiOperation({ summary: 'Registrar uptime de servicio' })
  async recordUptime(@Param('service') service: string, @Body() body: any) {
    return this.monitoringService.recordUptime(service, body.isUp);
  }

  /** MONITOR-RT-003 */
  @Post('latency/:service')
  @ApiOperation({ summary: 'Registrar latencia de servicio' })
  async recordLatency(@Param('service') service: string, @Body() body: any) {
    return this.monitoringService.recordLatency(service, body.p50, body.p95, body.p99);
  }

  /** MONITOR-RT-004 */
  @Post('error-rate/:service')
  @ApiOperation({ summary: 'Registrar tasa de errores de servicio' })
  async recordErrorRate(@Param('service') service: string, @Body() body: any) {
    return this.monitoringService.recordErrorRate(service, body.errorRatePct);
  }

  /** MONITOR-RT-005 */
  @Get('dashboard/:service')
  @ApiOperation({ summary: 'Obtener dashboard de servicio' })
  async getServiceDashboard(@Param('service') service: string) {
    return this.monitoringService.getServiceDashboard(service);
  }

  /** MONITOR-RT-006 */
  @Get('metrics/:service/history')
  @ApiOperation({ summary: 'Obtener historial de métricas' })
  async getMetricsHistory(@Param('service') service: string, @Query() query: any) {
    return this.monitoringService.getMetricsHistory(
      service,
      query.metricType,
      parseInt(query.hoursBack) || 24,
    );
  }

  /** MONITOR-RT-007 */
  @Post('alerts/rules')
  @ApiOperation({ summary: 'Crear regla de alerta' })
  async createAlertRule(@Body() dto: CreateAlertRuleDto) {
    return this.monitoringService.createAlertRule(dto);
  }

  /** MONITOR-RT-008 */
  @Get('alerts')
  @ApiOperation({ summary: 'Listar alertas activas' })
  async listActiveAlerts() {
    return this.monitoringService.listActiveAlerts();
  }

  /** MONITOR-RT-009 */
  @Patch('alerts/:id')
  @ApiOperation({ summary: 'Actualizar estado de alerta' })
  async updateAlertStatus(@Param('id') id: string, @Body() body: any) {
    return this.monitoringService.updateAlertStatus(id, body.status);
  }

  /** MONITOR-RT-010 */
  @Post('synthetic/:service')
  @ApiOperation({ summary: 'Ejecutar chequeo sintético' })
  async runSyntheticCheck(@Param('service') service: string, @Body() body: any) {
    return this.monitoringService.runSyntheticCheck(service, body.endpoint);
  }

  /** MONITOR-MOD-001 */
  @Get('anomaly/:service')
  @ApiOperation({ summary: 'Detectar anomalías de rendimiento' })
  async detectPerformanceAnomaly(@Param('service') service: string) {
    return this.monitoringService.detectPerformanceAnomaly(service);
  }

  /** MONITOR-MOD-002 */
  @Get('bottlenecks/:service')
  @ApiOperation({ summary: 'Detectar cuellos de botella' })
  async detectBottlenecks(@Param('service') service: string) {
    return this.monitoringService.detectBottlenecks(service);
  }

  /** MONITOR-MOD-003 */
  @Get('cache/:service')
  @ApiOperation({ summary: 'Recomendaciones de caché adaptativa' })
  async getAdaptiveCacheRecommendations(@Param('service') service: string) {
    return this.monitoringService.getAdaptiveCacheRecommendations(service);
  }

  /** MONITOR-MOD-004 */
  @Get('edge')
  @ApiOperation({ summary: 'Reporte de optimización edge' })
  async getEdgeOptimizationReport() {
    return this.monitoringService.getEdgeOptimizationReport();
  }

  /** MONITOR-MOD-005 */
  @Get('sla/:service')
  @ApiOperation({ summary: 'Forzar budget de rendimiento SLA' })
  async enforcePerformanceBudget(@Param('service') service: string) {
    return this.monitoringService.enforcePerformanceBudget(service);
  }
}
