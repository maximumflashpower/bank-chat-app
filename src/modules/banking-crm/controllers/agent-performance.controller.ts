import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../identity/guards/jwt-auth.guard';
import { AgentPerformanceService } from '../services/agent-performance.service';
import { AgentPerformanceQueryDto, UpdateAgentMetricsDto } from '../dto/agent-performance.dto';

@ApiTags('CRM — Agent Performance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('v1/crm/agent')
export class AgentPerformanceController {
  constructor(private readonly agentPerformanceService: AgentPerformanceService) {}

  @Get('performance')
  @ApiOperation({ summary: 'Obtener métricas de rendimiento de agentes (WO-031-F047)' })
  @ApiQuery({ name: 'agentId', required: false, description: 'ID específico del agente' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Fecha inicio (ISO)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Fecha fin (ISO)' })
  async getPerformanceMetrics(@Query() query: AgentPerformanceQueryDto) {
    return this.agentPerformanceService.getPerformanceMetrics(query);
  }

  @Get(':agentId/performance')
  @ApiOperation({ summary: 'Obtener métricas de agente específico' })
  async getAgentPerformance(@Param('agentId') agentId: string, @Query() query: any) {
    return this.agentPerformanceService.getAgentPerformanceById(agentId, query);
  }

  @Put(':agentId/metrics')
  @ApiOperation({ summary: 'Actualizar métricas manuales del agente' })
  async updateAgentMetrics(
    @Param('agentId') agentId: string,
    @Body() dto: UpdateAgentMetricsDto,
  ) {
    return this.agentPerformanceService.updateAgentMetrics(agentId, dto);
  }

  @Get(':agentId/kpi-summary')
  @ApiOperation({ summary: 'Resumen KPI del agente' })
  async getAgentKpiSummary(@Param('agentId') agentId: string) {
    return this.agentPerformanceService.getAgentKpiSummary(agentId);
  }

  @Get('team/:teamId/leaderboard')
  @ApiOperation({ summary: 'Ranking de equipo (Leaderboard)' })
  async getTeamLeaderboard(
    @Param('teamId') teamId: string,
    @Query('period') period: string = 'month',
  ) {
    return this.agentPerformanceService.getTeamLeaderboard(teamId, period);
  }

  @Get('sla-compliance')
  @ApiOperation({ summary: 'Cumplimiento SLA por agente' })
  async getSlaCompliance(@Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    return this.agentPerformanceService.getSlaCompliance(startDate, endDate);
  }

  @Get('workload-distribution')
  @ApiOperation({ summary: 'Distribución de carga de trabajo' })
  async getWorkloadDistribution() {
    return this.agentPerformanceService.getWorkloadDistribution();
  }

  @Post(':agentId/coaching-plan')
  @ApiOperation({ summary: 'Crear plan de coaching para agente' })
  async createCoachingPlan(
    @Param('agentId') agentId: string,
    @Body() body: { focusArea: string; goals: string[]; targetDate: string },
  ) {
    return this.agentPerformanceService.createCoachingPlan(agentId, body);
  }
}
