import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { KpiService } from '../services/kpi.service';
import { UpdateForecastDto } from '../dto/update-forecast.dto';

@ApiTags('SMB Budgeting - KPI')
@Controller('smb-budgeting/kpi')
export class KpiController {
  constructor(private readonly kpiService: KpiService) {}

  @Get('dashboard/current')
  @ApiOperation({ summary: 'Get KPI dashboard' })
  async getDashboard(@Query('companyId') companyId: string) {
    return this.kpiService.getDashboard(companyId);
  }

  @Get('budget/:id/utilization')
  @ApiOperation({ summary: 'Get budget utilization' })
  async getBudgetUtilization(@Param('id') id: string) {
    return this.kpiService.getBudgetUtilization(id);
  }

  @Post('forecast/update')
  @ApiOperation({ summary: 'Update forecast' })
  async updateForecast(
    @Query('companyId') companyId: string,
    @Body() dto: UpdateForecastDto
  ) {
    return this.kpiService.updateForecast(companyId, dto.periods);
  }

  @Get('projects/health-report')
  @ApiOperation({ summary: 'Get project health report' })
  async getProjectHealthReport(@Query('companyId') companyId: string) {
    return this.kpiService.getProjectHealthReport(companyId);
  }
}
