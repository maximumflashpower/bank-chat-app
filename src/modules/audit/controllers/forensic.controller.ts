import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ForensicService } from '../services/forensic.service';
import { CreateForensicCaseDto } from '../dto/create-forensic-case.dto';
import { UploadEvidenceDto } from '../dto/upload-evidence.dto';
import { GenerateReportDto } from '../dto/generate-report.dto';
import { JwtAuthGuard } from '../../identity/guards/jwt-auth.guard';
import { ForensicCaseStatus } from '../entities/forensic-case-status.enum';

@ApiTags('Forensics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('v1/forensic')
export class ForensicController {
  constructor(private readonly forensicService: ForensicService) {}

  @Post('investigate/start')
  @ApiOperation({ summary: 'FORENSIC-001: Start forensic investigation case' })
  async startCase(@Body() dto: CreateForensicCaseDto, @Req() req: any) {
    return this.forensicService.createCase(dto, req.user.id);
  }

  @Get('case/:caseId')
  @ApiOperation({ summary: 'FORENSIC-001: Get case status' })
  async getCase(@Param('caseId') caseId: string) {
    return this.forensicService.getCase(caseId);
  }

  @Get('cases')
  @ApiOperation({ summary: 'List all forensic cases' })
  async listCases(@Body('status') status?: ForensicCaseStatus) {
    return this.forensicService.listCases(status);
  }

  @Post('evidence/upload')
  @ApiOperation({ summary: 'FORENSIC-003: Upload evidence to case' })
  async uploadEvidence(@Body() dto: UploadEvidenceDto, @Req() req: any) {
    return this.forensicService.uploadEvidence(dto.caseId ?? req.body.caseId, dto, req.user.id);
  }

  @Get('evidence/:id/verify')
  @ApiOperation({ summary: 'FORENSIC-004: Verify evidence hash integrity' })
  async verifyEvidence(@Param('id') evidenceId: string) {
    return this.forensicService.verifyEvidence(evidenceId);
  }

  @Get('timeline/:caseId')
  @ApiOperation({ summary: 'FORENSIC-002: Reconstruct timeline' })
  async buildTimeline(@Param('caseId') caseId: string) {
    return this.forensicService.buildTimeline(caseId);
  }

  @Post('report/generate')
  @ApiOperation({ summary: 'FORENSIC-005: Generate forensic report' })
  async generateReport(@Body() dto: GenerateReportDto) {
    return this.forensicService.generateReport(dto);
  }

  @Get('analysis/:caseId/initial-access')
  @ApiOperation({ summary: 'FORENSIC-006: Identify initial access point' })
  async identifyInitialAccess(@Param('caseId') caseId: string) {
    return this.forensicService.identifyInitialAccess(caseId);
  }

  @Get('analysis/:caseId/lateral-movement')
  @ApiOperation({ summary: 'FORENSIC-007: Detect lateral movement' })
  async detectLateralMovement(@Param('caseId') caseId: string) {
    return this.forensicService.detectLateralMovement(caseId);
  }

  @Get('analysis/:caseId/session')
  @ApiOperation({ summary: 'FORENSIC-008: Reconstruct attacker session' })
  async reconstructSession(@Param('caseId') caseId: string) {
    return this.forensicService.reconstructSession(caseId);
  }

  @Get('analysis/:caseId/privilege-escalation')
  @ApiOperation({ summary: 'FORENSIC-009: Detect privilege escalation' })
  async detectPrivilegeEscalation(@Param('caseId') caseId: string) {
    return this.forensicService.detectPrivilegeEscalation(caseId);
  }

  @Get('analysis/:caseId/data-exfiltration')
  @ApiOperation({ summary: 'FORENSIC-010: Detect data exfiltration' })
  async detectDataExfiltration(@Param('caseId') caseId: string) {
    return this.forensicService.detectDataExfiltration(caseId);
  }
}
