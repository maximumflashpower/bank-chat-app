import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ConsumerProtectionService } from '../services/consumer-protection.service';
import { ConsumerProtectionMonitor } from '../entities/consumer-protection-monitor.entity';
import { ConsumerProtectionCase } from '../entities/consumer-protection-case.entity';
import { RegulationType, CaseStatus } from '../entities/consumer-protection-enum';

@ApiTags('regulatory-consumer-protection')
@Controller('v1/regulatory/consumer-protection')
export class ConsumerProtectionController {
  constructor(private readonly service: ConsumerProtectionService) {}

  // REG-CP-001: Monitor Reg E
  @Post('monitor/reg-e/run')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ejecutar monitoreo Regulation E (Electronic Fund Transfers)' })
  async runRegEMonitor(): Promise<ConsumerProtectionMonitor[]> {
    return this.service.monitorRegE();
  }

  // REG-CP-002: Monitor Reg Z
  @Post('monitor/reg-z/run')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ejecutar monitoreo Regulation Z (Truth in Lending)' })
  async runRegZMonitor(): Promise<ConsumerProtectionMonitor[]> {
    return this.service.monitorRegZ();
  }

  // REG-CP-003: Monitor Reg CC
  @Post('monitor/reg-cc/run')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ejecutar monitoreo Regulation CC (Funds Availability)' })
  async runRegCCMonitor(): Promise<ConsumerProtectionMonitor[]> {
    return this.service.monitorRegCC();
  }

  // REG-CP-004: Monitor Reg DD
  @Post('monitor/reg-dd/run')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ejecutar monitoreo Regulation DD (Deposit Disclosures)' })
  async runRegDDMonitor(): Promise<ConsumerProtectionMonitor[]> {
    return this.service.monitorRegDD();
  }

  // REG-CP-005: Generate violation alerts
  @Post('alerts/generate/:monitorId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generar alerta de violación para monitor específico' })
  async generateAlert(@Param('monitorId') monitorId: string): Promise<ConsumerProtectionCase[]> {
    return this.service.generateViolationAlerts(monitorId);
  }

  // REG-CP-006: Regulatory reports
  @Get('reports/regulatory')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generar reporte regulatorio por tipo y período' })
  async generateReport(
    @Query('regulationType') regulationType: RegulationType,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.service.generateRegulatoryReport(
      regulationType,
      new Date(startDate),
      new Date(endDate),
    );
  }

  // REG-CP-007: Case management
  @Put('cases/:caseId/assign')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Asignar caso a investigador' })
  async assignCase(
    @Param('caseId') caseId: string,
    @Body('assignedTo') assignedTo: string,
  ): Promise<ConsumerProtectionCase> {
    return this.service.assignCase(caseId, assignedTo);
  }

  @Put('cases/:caseId/escalate')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Escalar caso para revisión' })
  async escalateCase(@Param('caseId') caseId: string): Promise<ConsumerProtectionCase> {
    return this.service.escalateCase(caseId);
  }

  @Put('cases/:caseId/resolve')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Resolver caso con notas y acción remediativa' })
  async resolveCase(
    @Param('caseId') caseId: string,
    @Body() body: { resolutionNotes: string; remediationAction: string; isFalsePositive: boolean },
  ): Promise<ConsumerProtectionCase> {
    return this.service.resolveCase(
      caseId,
      body.resolutionNotes,
      body.remediationAction,
      body.isFalsePositive,
    );
  }

  // Helpers: CRUD monitors
  @Get('monitors')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar todos los monitores activos' })
  async getMonitors(
    @Query('regulationType') regulationType?: RegulationType,
  ): Promise<ConsumerProtectionMonitor[]> {
    return this.service.getMonitors(regulationType);
  }

  @Post('monitors')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear nuevo monitor de cumplimiento' })
  async createMonitor(@Body() body: {
    regulationType: RegulationType;
    monitoringRuleName: string;
    ruleDescription?: string;
    checkFrequencyHours?: number;
    severityThreshold?: string;
    autoEscalate?: boolean;
    createdBy: string;
  }): Promise<ConsumerProtectionMonitor> {
    return this.service.createMonitor(body);
  }

  // Helpers: Query cases
  @Get('cases')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar casos con filtros opcionales' })
  async getCases(
    @Query('monitorId') monitorId?: string,
    @Query('caseStatus') caseStatus?: CaseStatus,
    @Query('regulationType') regulationType?: RegulationType,
  ): Promise<ConsumerProtectionCase[]> {
    return this.service.getCases({
      monitorId: monitorId || undefined,
      caseStatus: caseStatus || undefined,
      regulationType: regulationType || undefined,
    });
  }
}
