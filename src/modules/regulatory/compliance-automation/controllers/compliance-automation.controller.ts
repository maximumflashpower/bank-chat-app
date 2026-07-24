import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../identity/guards/jwt-auth.guard';
import { RolesGuard } from '../../../identity/guards/roles.guard';
import { Roles } from '../../../identity/decorators/roles.decorator';
import { RoleType } from '../../../identity/entities/role.enum';
import { FrameworkService } from '../services/framework.service';
import { ControlTestService } from '../services/control-test.service';
import { AuditPortalService } from '../services/audit-portal.service';

@ApiTags('Regulatory Compliance Automation')
@Controller('v1/regulatory/compliance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ComplianceAutomationController {
  constructor(
    private frameworkService: FrameworkService,
    private controlTestService: ControlTestService,
    private auditPortalService: AuditPortalService,
  ) {}

  // Frameworks endpoints
  @Get('frameworks')
  @ApiOperation({ summary: 'List all active regulatory frameworks' })
  @ApiResponse({ status: 200, description: 'List of regulatory frameworks' })
  async listFrameworks() {
    return this.frameworkService.findAll();
  }

  @Post('frameworks')
  @Roles(RoleType.COMPLIANCE_OFFICER, RoleType.ADMIN)
  @ApiOperation({ summary: 'Create a new regulatory framework' })
  @ApiResponse({ status: 201, description: 'Framework created successfully' })
  async createFramework(@Body() data: any) {
    return this.frameworkService.create(data);
  }

  @Put('frameworks/:id')
  @Roles(RoleType.COMPLIANCE_OFFICER, RoleType.ADMIN)
  @ApiOperation({ summary: 'Update a regulatory framework' })
  @ApiResponse({ status: 200, description: 'Framework updated successfully' })
  async updateFramework(@Param('id') id: string, @Body() data: any) {
    return this.frameworkService.update(id, data);
  }

  // Control Tests endpoints
  @Get('controls/tests')
  @ApiOperation({ summary: 'List all control tests with filters' })
  @ApiResponse({ status: 200, description: 'List of control tests' })
  async listControlTests(@Query('controlId') controlId?: string) {
    if (controlId) {
      return this.controlTestService.findByControl(controlId);
    }
    return [];
  }

  @Post('controls/tests')
  @Roles(RoleType.COMPLIANCE_OFFICER, RoleType.AUDITOR)
  @ApiOperation({ summary: 'Create a new control test' })
  @ApiResponse({ status: 201, description: 'Control test created successfully' })
  async createControlTest(@Body() data: any) {
    return this.controlTestService.create(data);
  }

  @Put('controls/tests/:id/evidence')
  @Roles(RoleType.COMPLIANCE_OFFICER, RoleType.AUDITOR)
  @ApiOperation({ summary: 'Add evidence to control test' })
  @ApiResponse({ status: 200, description: 'Evidence added successfully' })
  async addEvidence(@Param('id') id: string, @Body() data: any) {
    return this.controlTestService.addEvidence(id, data.evidencePath, data.findings, data.remediationPlan);
  }

  @Put('controls/tests/:id/status')
  @Roles(RoleType.COMPLIANCE_OFFICER)
  @ApiOperation({ summary: 'Update control test status' })
  @ApiResponse({ status: 200, description: 'Status updated successfully' })
  async updateTestStatus(@Param('id') id: string, @Body() data: any) {
    return this.controlTestService.updateStatus(id, data.status);
  }

  @Put('controls/tests/:id/mark-pass')
  @Roles(RoleType.COMPLIANCE_OFFICER, RoleType.AUDITOR)
  @ApiOperation({ summary: 'Mark control test as passed' })
  @ApiResponse({ status: 200, description: 'Test marked as passed' })
  async markTestPassed(@Param('id') id: string) {
    return this.controlTestService.markPassed(id);
  }

  // Audit Portal endpoints
  @Get('audit-portal/access-list')
  @Roles(RoleType.COMPLIANCE_OFFICER, RoleType.ADMIN)
  @ApiOperation({ summary: 'List all active auditor accesses' })
  @ApiResponse({ status: 200, description: 'List of active auditor accesses' })
  async listAuditAccesses() {
    return this.auditPortalService.findAllActive();
  }

  @Post('audit-portal/grant')
  @Roles(RoleType.COMPLIANCE_OFFICER, RoleType.ADMIN)
  @ApiOperation({ summary: 'Grant access to external auditor' })
  @ApiResponse({ status: 201, description: 'Access granted successfully' })
  async grantAuditAccess(@Body() data: any) {
    return this.auditPortalService.grantAccess(data);
  }

  @Put('audit-portal/:id/revoke')
  @Roles(RoleType.COMPLIANCE_OFFICER, RoleType.ADMIN)
  @ApiOperation({ summary: 'Revoke auditor access' })
  @ApiResponse({ status: 200, description: 'Access revoked successfully' })
  async revokeAuditAccess(@Param('id') id: string) {
    return this.auditPortalService.revokeAccess(id);
  }

  @Put('audit-portal/:id/extend')
  @Roles(RoleType.COMPLIANCE_OFFICER, RoleType.ADMIN)
  @ApiOperation({ summary: 'Extend auditor access expiration' })
  @ApiResponse({ status: 200, description: 'Access extended successfully' })
  async extendAuditAccess(@Param('id') id: string, @Body() data: any) {
    return this.auditPortalService.extendAccess(id, data.days);
  }

  @Get('dashboard/compliance-summary')
  @ApiOperation({ summary: 'Compliance dashboard summary metrics' })
  @ApiResponse({ status: 200, description: 'Compliance dashboard summary' })
  async complianceDashboard() {
    const frameworks = await this.frameworkService.findAll();
    const expiringAccess = await this.auditPortalService.checkExpiringSoon(7);
    
    return {
      totalFrameworks: frameworks.length,
      activeAuditorAccesses: expiringAccess.length + (await this.auditPortalService.findAllActive()).length - expiringAccess.length,
      expiringAccessCount: expiringAccess.length,
      frameworks: frameworks.map(f => ({ code: f.frameworkCode, name: f.frameworkName })),
    };
  }
}
