import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DashboardService } from '../services/dashboard.service';

@ApiTags('regulatory-dashboard')
@Controller('api/regulatory/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('/summary')
  @ApiOperation({ summary: 'Get executive dashboard summary' })
  async getExecutiveSummary() {
    return this.dashboardService.getExecutiveSummary();
  }

  @Get('/trends')
  @ApiOperation({ summary: 'Get report trends over time' })
  async getReportTrends(@Query('days') days: number = 30) {
    return this.dashboardService.getReportTrends(Number(days));
  }

  @Get('/validation-metrics')
  @ApiOperation({ summary: 'Get validation metrics and failures' })
  async getValidationMetrics() {
    return this.dashboardService.getValidationMetrics();
  }

  @Get('/calendar-overview')
  @ApiOperation({ summary: 'Get calendar overview of deadlines' })
  async getCalendarOverview(@Query('days') days: number = 30) {
    return this.dashboardService.getCalendarOverview(Number(days));
  }
}
