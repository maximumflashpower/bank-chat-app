import {
  Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PasskeySyncService } from '../services/passkey-sync.service';
import { MfaPolicyService } from '../services/mfa-policy.service';
import { DelegationService } from '../services/delegation.service';
import { RecoveryService } from '../services/recovery.service';
import { AccessReviewService } from '../services/access-review.service';
import { SessionGovernanceService } from '../services/session-governance.service';
import { DeviceTrustService } from '../services/device-trust.service';
import { GovAuditService } from '../services/gov-audit.service';
import { PasskeySyncDto } from '../dto/passkey-sync.dto';
import { MfaEnrollDto } from '../dto/mfa-enroll.dto';
import { MfaPolicyUpdateDto } from '../dto/mfa-policy-update.dto';
import { DelegationRequestDto } from '../dto/delegation-request.dto';
import { DelegationApproveDto } from '../dto/delegation-approve.dto';
import { RecoveryInitiateDto } from '../dto/recovery-initiate.dto';
import { RecoveryConfirmDto } from '../dto/recovery-confirm.dto';
import { AccessReviewDto } from '../dto/access-review.dto';
import { AccessReviewSubmitDto } from '../dto/access-review-submit.dto';
import { DeviceTrustLabelDto } from '../dto/device-trust-label.dto';
import { GovAuditFilterDto } from '../dto/gov-audit-filter.dto';
import { SessionKickDto } from '../dto/session-kick.dto';

@ApiTags('Governance')
@ApiBearerAuth()
@Controller('api/v1/gov')
export class GovernanceController {
  constructor(
    private readonly passkeySync: PasskeySyncService,
    private readonly mfaPolicy: MfaPolicyService,
    private readonly delegation: DelegationService,
    private readonly recovery: RecoveryService,
    private readonly accessReview: AccessReviewService,
    private readonly sessionGov: SessionGovernanceService,
    private readonly deviceTrust: DeviceTrustService,
    private readonly govAudit: GovAuditService,
  ) {}

  // ── Passkey Sync ──
  @Post('passkey/sync')
  @ApiOperation({ summary: 'Sync passkey to a new device' })
  async syncPasskey(@Req() req: any, @Body() dto: PasskeySyncDto) {
    return this.passkeySync.syncPasskey(req.user.id, dto.passkeyId, dto.deviceId, dto.isPrimary);
  }

  @Get('passkey/list')
  @ApiOperation({ summary: 'List synced passkeys' })
  async listPasskeys(@Req() req: any) {
    return this.passkeySync.listUserPasskeys(req.user.id);
  }

  @Delete('passkey/:id')
  @ApiOperation({ summary: 'Remove passkey from device' })
  async revokePasskey(@Req() req: any, @Param('id') passkeyId: string, @Query('deviceId') deviceId: string) {
    await this.passkeySync.revokePasskeyOnDevice(req.user.id, passkeyId, deviceId);
    return { success: true };
  }

  // ── MFA ──
  @Post('mfa/enroll')
  @ApiOperation({ summary: 'Enroll MFA method' })
  async enrollMfa(@Req() req: any, @Body() dto: MfaEnrollDto) {
    return { userId: req.user.id, type: dto.type, enrolled: true };
  }

  @Get('mfa/methods')
  @ApiOperation({ summary: 'List active MFA methods' })
  async listMfaMethods(@Req() req: any) {
    return { userId: req.user.id, methods: [] };
  }

  @Put('mfa/policy')
  @ApiOperation({ summary: 'Configure MFA policy' })
  async updateMfaPolicy(@Body() dto: MfaPolicyUpdateDto) {
    return this.mfaPolicy.updatePolicy('active', dto);
  }

  // ── Delegation ──
  @Post('delegation/request')
  @ApiOperation({ summary: 'Request delegated authority' })
  async requestDelegation(@Req() req: any, @Body() dto: DelegationRequestDto) {
    return this.delegation.createDelegation(req.user.id, dto);
  }

  @Post('delegation/approve')
  @ApiOperation({ summary: 'Approve or reject delegation' })
  async approveDelegation(@Body() dto: DelegationApproveDto) {
    return this.delegation.approveDelegation(dto);
  }

  @Get('delegation/history')
  @ApiOperation({ summary: 'List delegation history' })
  async delegationHistory(@Query('approverId') approverId: string) {
    return this.delegation.getPendingForApprovers(approverId);
  }

  // ── Recovery ──
  @Post('recovery/initiate')
  @ApiOperation({ summary: 'Start account recovery flow' })
  async initiateRecovery(@Body() dto: RecoveryInitiateDto) {
    return this.recovery.initiateRecovery('anonymous', dto);
  }

  @Get('recovery/status')
  @ApiOperation({ summary: 'Check recovery ticket status' })
  async recoveryStatus(@Query('ticketId') ticketId: string) {
    return this.recovery.getTicketStatus(ticketId);
  }

  @Post('recovery/confirm')
  @ApiOperation({ summary: 'Confirm identity via trusted contacts' })
  async confirmRecovery(@Body() dto: RecoveryConfirmDto) {
    return { confirmed: await this.recovery.confirmVerification(dto.ticketId, dto.confirmationCode) };
  }

  // ── Access Review ──
  @Get('access-review/pending')
  @ApiOperation({ summary: 'List pending access reviews' })
  async pendingReviews() {
    return this.accessReview.getPendingReviews();
  }

  @Post('access-review/submit')
  @ApiOperation({ summary: 'Complete access review' })
  async submitReview(@Body() dto: AccessReviewSubmitDto) {
    return this.accessReview.submitReview(dto);
  }

  @Post('access-review/create')
  @ApiOperation({ summary: 'Create access review campaign' })
  async createReview(@Body() dto: AccessReviewDto) {
    return this.accessReview.createReview(dto);
  }

  // ── Session ──
  @Get('session/inventory')
  @ApiOperation({ summary: 'Global session inventory' })
  async sessionInventory() {
    return this.sessionGov.getGlobalSessionInventory();
  }

  @Post('session/kickall')
  @ApiOperation({ summary: 'Revoke all sessions except current' })
  async kickAllSessions(@Req() req: any, @Body() dto: SessionKickDto) {
    const affected = await this.sessionGov.kickSessions(dto, req.user.id);
    return { affected };
  }

  // ── Device Trust ──
  @Get('trusted-devices')
  @ApiOperation({ summary: 'List trusted devices' })
  async listDevices(@Req() req: any) {
    return this.deviceTrust.getUserDevices(req.user.id);
  }

  @Put('trusted-devices/:id')
  @ApiOperation({ summary: 'Update device trust label' })
  async updateDeviceTrust(@Req() req: any, @Param('id') deviceId: string, @Body() dto: DeviceTrustLabelDto) {
    return this.deviceTrust.updateTrustLabel(req.user.id, deviceId, dto);
  }

  // ── Audit ──
  @Get('audit/search')
  @ApiOperation({ summary: 'Search governance audit logs' })
  async searchAudit(@Query() filter: GovAuditFilterDto) {
    return this.govAudit.searchAudits(filter);
  }

  @Get('audit/compliance-report')
  @ApiOperation({ summary: 'Generate compliance report' })
  async complianceReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('regulations') regulations: string,
  ) {
    const regs = regulations ? regulations.split(',') : ['SOX'];
    return this.govAudit.generateComplianceReport(new Date(startDate), new Date(endDate), regs);
  }
}
