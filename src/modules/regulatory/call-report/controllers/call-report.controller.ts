import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../../identity/guards/jwt-auth.guard';
import { RolesGuard } from '../../../identity/guards/roles.guard';
import { Roles } from '../../../identity/decorators/roles.decorator';
import { RoleType } from '../../../identity/entities/role.enum';
import { CallReportService } from '../services/call-report.service';
import { IntlReportingService } from '../services/intl-reporting.service';
import { GenerateReportDto } from '../dto/generate-report.dto';
import { ReportType, SubmissionMethod, RegulatoryAuthority } from '../entities/call-report-status.enum';

@ApiTags('Regulatory — Call Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/regulatory/call-report')
export class CallReportController {
  constructor(
    private readonly callReportService: CallReportService,
    private readonly intlReportingService: IntlReportingService,
  ) {}

  @Post('generate')
  @Roles(RoleType.COMPLIANCE_OFFICER, RoleType.REGULATORY_ANALYST)
  @ApiOperation({ summary: 'REG-CALLRPT-001: Generate Call Report FFIEC 031/041' })
  @ApiResponse({ status: 201, description: 'Report generated successfully' })
  async generateReport(@Req() req: Request, @Body() dto: GenerateReportDto) {
    const userId = (req.user as any)?.id;
    return this.callReportService.generateCallReport(dto, userId);
  }

  @Post(':id/validate')
  @Roles(RoleType.COMPLIANCE_OFFICER, RoleType.REGULATORY_ANALYST)
  @ApiOperation({ summary: 'Validate report data consistency' })
  async validateReport(@Param('id') id: string) {
    return this.callReportService.validateReport(id);
  }

  @Post(':id/submit')
  @Roles(RoleType.COMPLIANCE_MANAGER, RoleType.COMPLIANCE_DIRECTOR)
  @ApiOperation({ summary: 'Submit report to regulatory authority' })
  async submitReport(
    @Param('id') id: string,
    @Body() body: { submissionMethod: SubmissionMethod },
  ) {
    return this.callReportService.submitReport(id, body.submissionMethod);
  }

  @Post(':id/amend')
  @Roles(RoleType.COMPLIANCE_OFFICER, RoleType.REGULATORY_ANALYST)
  @ApiOperation({ summary: 'Amend previously filed report' })
  async amendReport(@Req() req: Request, @Param('id') id: string) {
    const userId = (req.user as any)?.id;
    return this.callReportService.amendReport(id, userId);
  }

  @Post('fbar/prepare')
  @Roles(RoleType.COMPLIANCE_OFFICER, RoleType.REGULATORY_ANALYST)
  @ApiOperation({ summary: 'REG-FBAR-001: Prepare FBAR Foreign Bank Account Report' })
  async prepareFbar(
    @Req() req: Request,
    @Body() body: {
      accounts: Array<{ accountNumber: string; bankName: string; maxBalance: number; country: string }>;
      reportingYear: number;
    },
  ) {
    const userId = (req.user as any)?.id;
    return this.intlReportingService.prepareFbar(userId, body.accounts, body.reportingYear);
  }

  @Post('fatca/prepare')
  @Roles(RoleType.COMPLIANCE_OFFICER, RoleType.REGULATORY_ANALYST)
  @ApiOperation({ summary: 'REG-FATCA-001: Prepare FATCA annual reporting to IRS' })
  async prepareFatca(
    @Req() req: Request,
    @Body() body: {
      reportableAccounts: Array<{ tin: string; accountBalance: number; income: number; country: string }>;
      reportingYear: number;
    },
  ) {
    const userId = (req.user as any)?.id;
    return this.intlReportingService.prepareFatca(userId, body.reportableAccounts, body.reportingYear);
  }

  @Post('crs/prepare')
  @Roles(RoleType.COMPLIANCE_OFFICER, RoleType.REGULATORY_ANALYST)
  @ApiOperation({ summary: 'REG-CRS-001: Prepare CRS Common Reporting Standard OECD' })
  async prepareCrs(
    @Req() req: Request,
    @Body() body: {
      reportableAccounts: Array<{ tin: string; accountBalance: number; jurisdiction: string }>;
      reportingYear: number;
    },
  ) {
    const userId = (req.user as any)?.id;
    return this.intlReportingService.prepareCrs(userId, body.reportableAccounts, body.reportingYear);
  }

  @Post(':id/file-intl')
  @Roles(RoleType.COMPLIANCE_DIRECTOR)
  @ApiOperation({ summary: 'File international report with authority' })
  async fileIntl(
    @Param('id') id: string,
    @Body() body: { authority: RegulatoryAuthority; submissionMethod: SubmissionMethod },
  ) {
    await this.intlReportingService.fileWithAuthority(id, body.authority, body.submissionMethod);
    return { success: true, message: 'International report filed' };
  }

  @Get(':id')
  @Roles(RoleType.COMPLIANCE_OFFICER, RoleType.REGULATORY_ANALYST, RoleType.AUDITOR)
  @ApiOperation({ summary: 'Get report details by ID' })
  async findById(@Param('id') id: string) {
    return this.callReportService.findById(id);
  }

  @Get()
  @Roles(RoleType.COMPLIANCE_MANAGER, RoleType.COMPLIANCE_DIRECTOR)
  @ApiOperation({ summary: 'List all regulatory reports' })
  async findAll() {
    return this.callReportService.findAll();
  }

  @Get('type/:reportType')
  @Roles(RoleType.COMPLIANCE_OFFICER, RoleType.REGULATORY_ANALYST)
  @ApiOperation({ summary: 'Filter reports by type' })
  async findByType(@Param('reportType') reportType: ReportType) {
    return this.callReportService.findByType(reportType);
  }

  @Get(':id/receipt')
  @Roles(RoleType.COMPLIANCE_OFFICER, RoleType.AUDITOR)
  @ApiOperation({ summary: 'Get filing receipt' })
  async getFilingReceipt(@Param('id') id: string) {
    return this.callReportService.getFilingReceipt(id);
  }

  @Get('statistics/:year')
  @Roles(RoleType.COMPLIANCE_MANAGER, RoleType.COMPLIANCE_DIRECTOR)
  @ApiOperation({ summary: 'Get filing statistics by year' })
  async getFilingStatistics(
    @Param('year') year: number,
    @Query('types') types?: string,
  ) {
    const reportTypes = types ? types.split(',').map(t => t as ReportType) : undefined;
    return this.intlReportingService.getFilingStatistics(year, reportTypes);
  }
}
