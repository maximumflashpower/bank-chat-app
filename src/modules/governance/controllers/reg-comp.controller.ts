import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../identity/guards/jwt-auth.guard';
import { RegCompService } from '../services/reg-comp.service';
import { CreateRegCompDto } from '../dto/create-reg-comp.dto';
import { RegCompType } from '../entities/reg-comp-type.enum';

@ApiTags('Governance — Regulatory Compliance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('governance/reg-comp')
export class RegCompController {
  constructor(private readonly regCompService: RegCompService) {}

  @Get()
  @ApiOperation({ summary: 'List all regulatory compliance records' })
  async findAll(
    @Query('type') type?: RegCompType,
    @Query('status') status?: string,
  ) {
    return this.regCompService.findAll(type, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get compliance record details' })
  async findOne(@Param('id') id: string) {
    return this.regCompService.findOne(id);
  }

  @Post('schedule')
  @ApiOperation({ summary: 'REG-COMP-006: Schedule audit' })
  async scheduleAudit(@Body() body: { frequency: string; scope: string }) {
    return this.regCompService.scheduleAudit(body);
  }

  @Post('training')
  @ApiOperation({ summary: 'REG-COMP-007: Create compliance training record' })
  async createTrainingRecord(@Body() body: { userId: string; trainingName: string; dueDate?: string }) {
    return this.regCompService.createTrainingRecord(body.userId, body.trainingName, body.dueDate);
  }

  @Post('dlp')
  @ApiOperation({ summary: 'REG-COMP-008: Create DLP policy' })
  async createDlpPolicy(@Body() body: { policyName: string; rules: any[]; severity: string }) {
    return this.regCompService.createDlpPolicy(body.policyName, body.rules, body.severity);
  }

  @Post('threat-detect')
  @ApiOperation({ summary: 'REG-COMP-009: Detect insider threat' })
  async detectInsiderThreat(@Body() body: { indicators: any[] }) {
    return this.regCompService.detectInsiderThreat(body.indicators);
  }

  @Post('third-party')
  @ApiOperation({ summary: 'REG-COMP-010: Assess third-party risk' })
  async assessThirdPartyRisk(@Body() body: { vendorId: string; assessmentType: string; evidence?: any }) {
    return this.regCompService.assessThirdPartyRisk(body.vendorId, body.assessmentType, body.evidence);
  }

  @Post('attestation')
  @ApiOperation({ summary: 'REG-COMP-011: Create continuous attestation' })
  async createAttestation(@Body() body: { attesterId: string; items: string[] }) {
    return this.regCompService.createAttestation(body.attesterId, body.items);
  }

  @Post('regulatory-monitor')
  @ApiOperation({ summary: 'REG-COMP-012: Monitor regulatory change' })
  async monitorRegulatoryChange(@Body() body: { jurisdictions: string[]; domains: string[] }) {
    return this.regCompService.monitorRegulatoryChange(body.jurisdictions, body.domains);
  }

  @Post('report')
  @ApiOperation({ summary: 'REG-COMP-013: Generate automated report' })
  async generateAutomatedReport(@Body() body: { reportType: string; parameters: any; recipients: string[] }) {
    return this.regCompService.generateAutomatedReport(body.reportType, body.parameters, body.recipients);
  }

  @Get('metrics')
  @ApiOperation({ summary: 'REG-COMP-014: Calculate compliance metrics' })
  async calculateComplianceMetrics(@Query('from') from: string, @Query('to') to: string) {
    return this.regCompService.calculateComplianceMetrics({ from, to });
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Mark compliance record as completed' })
  async complete(@Param('id') id: string) {
    return this.regCompService.complete(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update compliance record' })
  async update(@Param('id') id: string, @Body() updates: Partial<CreateRegCompDto>) {
    return this.regCompService.update(id, updates);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove compliance record' })
  async remove(@Param('id') id: string) {
    return this.regCompService.remove(id);
  }
}
