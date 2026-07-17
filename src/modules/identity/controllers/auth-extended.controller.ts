import {
  Controller, Get, Post, Put, Body, Param, Query, Req, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SsoService } from '../services/sso.service';
import { PasswordlessService } from '../services/passwordless.service';
import { AuthSecurityService } from '../services/auth-security.service';
import { ComplianceService } from '../services/compliance.service';
import { SecurityAuditService } from '../services/security-audit.service';
import { SamlInitiateDto } from '../dto/saml-initiate.dto';
import { OidcInitiateDto } from '../dto/oidc-initiate.dto';
import { SsoCallbackDto } from '../dto/sso-callback.dto';
import { PasswordlessPushRegisterDto } from '../dto/passwordless-push.dto';
import { MagicLinkRequestDto, MagicLinkVerifyDto } from '../dto/magic-link.dto';
import { DidRegisterDto } from '../dto/did-register.dto';
import { BruteForceConfigDto, SessionLimitDto } from '../dto/security-hardening.dto';

@ApiTags('Auth Extended')
@ApiBearerAuth()
@Controller('v1/auth')
export class AuthExtendedController {
  constructor(
    private readonly ssoService: SsoService,
    private readonly passwordlessService: PasswordlessService,
    private readonly securityService: AuthSecurityService,
    private readonly complianceService: ComplianceService,
    private readonly securityAuditService: SecurityAuditService,
  ) {}

  // ── SSO SAML ──
  @Post('sso/saml/initiate')
  @ApiOperation({ summary: 'Initiate SAML SSO flow' })
  async initiateSaml(@Body() dto: SamlInitiateDto) {
    return this.ssoService.initiateSaml(dto);
  }

  // ── SSO OIDC ──
  @Post('sso/oidc/initiate')
  @ApiOperation({ summary: 'Initiate OIDC/OAuth2 SSO flow' })
  async initiateOidc(@Body() dto: OidcInitiateDto) {
    return this.ssoService.initiateOidc(dto);
  }

  // ── SSO Callback ──
  @Post('sso/callback')
  @ApiOperation({ summary: 'Handle SSO callback from IdP' })
  async ssoCallback(@Body() dto: SsoCallbackDto) {
    return this.ssoService.handleSsoCallback(dto);
  }

  // ── Passwordless: Push ──
  @Post('passwordless/push/register')
  @ApiOperation({ summary: 'Register push notification authenticator' })
  async registerPush(@Req() req: any, @Body() dto: PasswordlessPushRegisterDto) {
    return this.passwordlessService.registerPushDevice(req.user.id, dto);
  }

  @Post('passwordless/push/challenge')
  @ApiOperation({ summary: 'Send push authentication challenge' })
  async sendPushChallenge(@Req() req: any) {
    return this.passwordlessService.sendPushChallenge(req.user.id);
  }

  // ── Passwordless: Magic Links ──
  @Post('passwordless/magic-link/request')
  @ApiOperation({ summary: 'Request magic link login' })
  async requestMagicLink(@Body() dto: MagicLinkRequestDto) {
    return this.passwordlessService.generateMagicLink(dto);
  }

  @Post('passwordless/magic-link/verify')
  @ApiOperation({ summary: 'Verify magic link token' })
  async verifyMagicLink(@Body() dto: MagicLinkVerifyDto) {
    return this.passwordlessService.verifyMagicLink(dto);
  }

  // ── Passwordless: DID ──
  @Post('passwordless/did/register')
  @ApiOperation({ summary: 'Register decentralized DID' })
  async registerDid(@Req() req: any, @Body() dto: DidRegisterDto) {
    return this.passwordlessService.registerDid(req.user.id, dto);
  }

  // ── Security: Brute Force ──
  @Put('security/brute-force/config')
  @ApiOperation({ summary: 'Configure brute force protection' })
  async updateBruteForceConfig(@Body() dto: BruteForceConfigDto) {
    await this.securityService.updateBruteForceConfig(dto);
    return { success: true };
  }

  @Get('security/brute-force/config')
  @ApiOperation({ summary: 'Get brute force config' })
  async getBruteForceConfig() {
    return this.securityService.getBruteForceConfig();
  }

  // ── Security: Session Limits ──
  @Put('security/session/config')
  @ApiOperation({ summary: 'Configure session limits' })
  async updateSessionConfig(@Body() dto: SessionLimitDto) {
    await this.securityService.updateSessionConfig(dto);
    return { success: true };
  }

  @Get('security/session/config')
  @ApiOperation({ summary: 'Get session limit config' })
  async getSessionConfig() {
    return this.securityService.getSessionConfig();
  }

  @Post('security/session/timeout-cleanup')
  @ApiOperation({ summary: 'Force expire idle sessions' })
  async enforceTimeout() {
    const revoked = await this.securityService.enforceSessionTimeout();
    return { revoked };
  }

  // ── Compliance ──
  @Get('compliance/gdpr/:userId')
  @ApiOperation({ summary: 'Check GDPR consent status' })
  async getGdprStatus(@Param('userId') userId: string) {
    return this.complianceService.getGdprConsentStatus(userId);
  }

  @Get('compliance/ccpa/disclosure')
  @ApiOperation({ summary: 'Get CCPA privacy disclosure' })
  async getCcpaDisclosure() {
    return this.complianceService.getCcpaDisclosure();
  }

  @Get('compliance/soc2/artifacts')
  @ApiOperation({ summary: 'Collect SOC 2 artifacts' })
  async getSoc2Artifacts(@Query('start') start: string, @Query('end') end: string) {
    return this.complianceService.collectSoc2Artifacts({ start: new Date(start), end: new Date(end) });
  }

  @Get('compliance/iso27001/checklist')
  @ApiOperation({ summary: 'Get ISO 27001 checklist' })
  async getIso27001Checklist() {
    return this.complianceService.getIso27001Checklist();
  }

  @Get('compliance/pci-dss/scan')
  @ApiOperation({ summary: 'Run PCI DSS requirement scan' })
  async scanPciDss() {
    return this.complianceService.scanPciDssRequirements();
  }

  // ── Security Audits ──
  @Post('audit/access-review/schedule')
  @ApiOperation({ summary: 'Schedule periodic access review' })
  async scheduleAccessReview(@Query('period') period: 'quarterly' | 'annually') {
    return this.securityAuditService.scheduleAccessReview(period);
  }

  @Get('audit/privileged-access/review')
  @ApiOperation({ summary: 'Review privileged accounts' })
  async reviewPrivileged() {
    return this.securityAuditService.reviewPrivilegedAccounts();
  }

  @Get('audit/vendor/:vendorId/assessment')
  @ApiOperation({ summary: 'Assess third-party vendor security' })
  async assessVendor(@Param('vendorId') vendorId: string) {
    return this.securityAuditService.assessThirdPartyVendor(vendorId);
  }

  @Post('audit/pen-test/schedule')
  @ApiOperation({ summary: 'Schedule penetration test' })
  async schedulePenTest(@Query('type') type: 'internal' | 'external' | 'both') {
    return this.securityAuditService.schedulePenetrationTest(type);
  }

  @Post('audit/vuln-scan/run')
  @ApiOperation({ summary: 'Run vulnerability scan' })
  async runVulnScan() {
    return this.securityAuditService.runVulnerabilityScan();
  }
}
