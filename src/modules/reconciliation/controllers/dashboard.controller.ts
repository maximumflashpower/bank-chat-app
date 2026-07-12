import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReconDashboardService } from '../services/recon-dashboard.service';

@ApiTags('Reconciliation - Dashboard')
@ApiBearerAuth()
@Controller('api/v1/recon/dashboard')
export class DashboardController {
  constructor(private readonly dashboard: ReconDashboardService) {}

  @Get('kpi')
  @ApiOperation({ summary: 'RECON-DASH-001: KPI dashboard match rate' })
  async getMatchRateKPIs(
    @Query('periodStart') periodStart?: string,
    @Query('periodEnd') periodEnd?: string,
  ) {
    return this.dashboard.getMatchRateKPIs(periodStart, periodEnd);
  }

  @Get('realtime')
  @ApiOperation({ summary: 'RECON-DASH-002: Estado en tiempo real' })
  async getRealtimeStatus() {
    return this.dashboard.getRealtimeStatus();
  }

  @Get('executive-summary')
  @ApiOperation({ summary: 'RECON-DASH-003: Resumen ejecutivo' })
  async getExecutiveSummary(@Query('periodMonth') periodMonth?: string) {
    return this.dashboard.getExecutiveSummary(periodMonth);
  }
}
