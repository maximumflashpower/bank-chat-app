import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SocDashboardService } from '../services/soc-dashboard.service';
import { AlertSeverity, AlertStatus } from '../entities/soc-alert.entity';
import { ClassifyAlertDto } from '../dto/classify-alert.dto';
import { InvestigateAlertDto } from '../dto/investigate-alert.dto';
import { CreateIncidentDto } from '../dto/create-incident.dto';

@ApiTags('SOC')
@Controller('api/v1/soc')
export class SocDashboardController {
  constructor(private readonly dashboardService: SocDashboardService) {}

  @Get('dashboard')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'SIEM Dashboard consolidated alerts multi-source' })
  @ApiResponse({ status: 200, description: 'Dashboard summary with alert counts' })
  async getDashboard() {
    return this.dashboardService.getDashboard();
  }

  @Get('alerts')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List alerts with optional filters' })
  @ApiResponse({ status: 200, description: 'Filtered alert list' })
  async getAlerts(
    @Query('severity') severity?: AlertSeverity,
    @Query('status') status?: AlertStatus,
    @Query('eventSource') eventSource?: string,
    @Query('limit') limit?: number,
  ) {
    return this.dashboardService.getAlerts({
      severity,
      status,
      eventSource,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Post('alerts/:id/investigate')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Open investigation on alert' })
  @ApiResponse({ status: 200, description: 'Alert marked as investigating' })
  async investigateAlert(
    @Param('id') alertId: string,
    @Request() req: any,
    @Body() dto: InvestigateAlertDto,
  ) {
    return this.dashboardService.investigateAlert(alertId, req.user.id, dto.notes);
  }

  @Post('alerts/:id/classify')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Classify alert as true/false positive' })
  @ApiResponse({ status: 200, description: 'Alert classified' })
  async classifyAlert(
    @Param('id') alertId: string,
    @Body() dto: ClassifyAlertDto,
  ) {
    return this.dashboardService.classifyAlert(
      alertId,
      dto.classification,
      dto.falsePositiveReason,
    );
  }

  @Get('incidents')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List active incidents' })
  @ApiResponse({ status: 200, description: 'Active incident list' })
  async getIncidents() {
    return this.dashboardService.getIncidents();
  }

  @Post('incidents/create')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create incident manually' })
  @ApiResponse({ status: 201, description: 'Incident created' })
  async createIncident(@Body() dto: CreateIncidentDto) {
    return this.dashboardService.createIncident(dto);
  }
}
