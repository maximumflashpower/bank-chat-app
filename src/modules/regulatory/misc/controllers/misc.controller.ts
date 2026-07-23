import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { RegulatoryChangeService } from '../services/regulatory-change.service';
import { ComplianceTrainingService } from '../services/compliance-training.service';
import { VendorRiskService } from '../services/vendor-risk.service';
import { InsiderThreatService } from '../services/insider-threat.service';
import { DlPService } from '../services/dlp.service';
import { ComplianceKpiService } from '../services/compliance-kpi.service';
import { JwtAuthGuard } from '../../../identity/guards/jwt-auth.guard';
import { RolesGuard } from '../../../identity/guards/roles.guard';
import { Roles } from '../../../identity/decorators/roles.decorator';
import { RoleType } from '../../../identity/entities/role.enum';

@ApiTags('Regulatory Misc')
@Controller('regulatory')
export class MiscController {
  constructor(
    private readonly changeService: RegulatoryChangeService,
    private readonly trainingService: ComplianceTrainingService,
    private readonly vendorService: VendorRiskService,
    private readonly insiderService: InsiderThreatService,
    private readonly dlpService: DlPService,
    private readonly kpiService: ComplianceKpiService,
  ) {}

  // ── REGULATORY CHANGE ──

  /**
   * REG-CHANGE-001: Monitor regulatory updates
   */
  @Post('changes/monitor')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Monitorear actualizaciones regulatorias' })
  async monitorChanges(@Body() body: { jurisdictions: string[] }): Promise<any> {
    return this.changeService.monitorRegulatoryUpdates(body.jurisdictions);
  }

  /**
   * REG-CHANGE-002: Assess impact
   */
  @Put('changes/:id/assess')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Evaluación de impacto regulatorio' })
  async assessImpact(
    @Param('id') id: string,
    @Body() body: { assessment: string; actionPlan: string },
  ): Promise<any> {
    return this.changeService.assessImpact(id, body.assessment, body.actionPlan);
  }

  @Get('changes')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar cambios regulatorios' })
  async listChanges(): Promise<any> {
    return this.changeService.findAll();
  }

  // ── COMPLIANCE TRAINING ──

  /**
   * REG-TRAINING-001: Assign training
   */
  @Post('training/assign')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Asignar training anual de compliance' })
  async assignTraining(@Body() body: { employeeId: string; courseName: string; category: string; dueDate: string }): Promise<any> {
    return this.trainingService.assignTraining(body.employeeId, body.courseName, body.category, new Date(body.dueDate));
  }

  @Post('training/:id/complete')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Completar training con score' })
  async completeTraining(@Param('id') id: string, @Body('score') score: number): Promise<any> {
    return this.trainingService.completeTraining(id, score);
  }

  @Get('training')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar trainings' })
  @ApiQuery({ name: 'employeeId', required: false })
  async listTrainings(@Query('employeeId') employeeId?: string): Promise<any> {
    if (employeeId) {
      return this.trainingService.findByEmployee(employeeId);
    }
    return this.trainingService.findAll();
  }

  @Get('training/certification-report')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reporte anual de certificación' })
  async certReport(@Query('year') year: string): Promise<any> {
    return this.trainingService.getAnnualCertificationReport(parseInt(year, 10));
  }

  // ── VENDOR RISK ──

  /**
   * REG-VENDOR-001: Assess vendor risk
   */
  @Get('vendor/:vendorId/assess')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Assess third-party vendor security scorecard' })
  async assessVendor(@Param('vendorId') vendorId: string): Promise<any> {
    return this.vendorService.assessVendorRisk(vendorId);
  }

  // ── INSIDER THREAT ──

  /**
   * REG-INSIDER-001: Detect insider threat
   */
  @Post('insider/detect')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Insider threat detection behavioral monitoring' })
  async detectInsider(@Body() body: { userId: string; behaviors: any }): Promise<any> {
    return this.insiderService.detectInsiderThreat(body.userId, body.behaviors);
  }

  // ── DLP ──

  /**
   * REG-DLP-001: Scan content for DLP violations
   */
  @Post('dlp/scan')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'DLP policy enforcement - scan content' })
  async scanContent(@Body() body: { content: string; policyName: string }): Promise<any> {
    return this.dlpService.scanContent(body.content, body.policyName);
  }

  @Post('dlp/enforce')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'DLP enforcement on outbound transmission' })
  async enforceDlp(@Body() body: { payload: string; destination: string; policyName: string }): Promise<any> {
    return this.dlpService.enforceOnTransmission(body.payload, body.destination, body.policyName);
  }

  // ── KPIs ──

  /**
   * REG-KPI-001: Compliance KPI dashboard
   */
  @Get('kpi/dashboard')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Compliance KPI dashboard executive reporting' })
  async kpiDashboard(@Query('year') year: string, @Query('quarter') quarter: string): Promise<any> {
    return this.kpiService.getComplianceKPISummary(parseInt(year, 10), parseInt(quarter, 10));
  }
}
