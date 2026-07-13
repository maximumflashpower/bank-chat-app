import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { IdentityController } from './controllers/identity.controller';
import { RbacController } from './controllers/rbac.controller';
import { MfaController } from './controllers/mfa.controller';
import { PasskeyController } from './controllers/passkey.controller';
import { GovernanceController } from './controllers/governance.controller';
import { AuthExtendedController } from './controllers/auth-extended.controller';
import { IdentityService } from './services/identity.service';
import { RbacService } from './services/rbac.service';
import { MfaService } from './services/mfa.service';
import { PasskeyService } from './services/passkey.service';
import { SessionService } from './services/session.service';
import { PasskeySyncService } from './services/passkey-sync.service';
import { MfaPolicyService } from './services/mfa-policy.service';
import { DelegationService } from './services/delegation.service';
import { RecoveryService } from './services/recovery.service';
import { AccessReviewService } from './services/access-review.service';
import { SessionGovernanceService } from './services/session-governance.service';
import { DeviceTrustService } from './services/device-trust.service';
import { GovAuditService } from './services/gov-audit.service';
import { SsoService } from './services/sso.service';
import { PasswordlessService } from './services/passwordless.service';
import { AuthSecurityService } from './services/auth-security.service';
import { ComplianceService } from './services/compliance.service';
import { SecurityAuditService } from './services/security-audit.service';
import { DidService } from './services/did.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { IdentityUser } from './entities/identity-user.entity';
import { Credential } from './entities/credential.entity';
import { Role } from './entities/role.entity';
import { UserRole } from './entities/user-role.entity';
import { MfaFactor } from './entities/mfa-factor.entity';
import { Passkey } from './entities/passkey.entity';
import { PasskeySyncMetadata } from './entities/passkey-sync-metadata.entity';
import { MfaPolicy } from './entities/mfa-policy.entity';
import { DelegationRule } from './entities/delegation-rule.entity';
import { RecoveryTicket } from './entities/recovery-ticket.entity';
import { SessionAuditLog } from './entities/session-audit-log.entity';
import { AccessReview } from './entities/access-review.entity';
import { DeviceTrust } from './entities/device-trust.entity';
import { GovAuditLog } from './entities/gov-audit-log.entity';
import { IdentitySession } from './entities/identity-session.entity';
import { IdentitySsoConfig } from './entities/identity-sso-config.entity';
import { IdentityDid } from './entities/identity-did.entity';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      IdentityUser,
      Credential,
      Role,
      UserRole,
      MfaFactor,
      Passkey,
      PasskeySyncMetadata,
      MfaPolicy,
      DelegationRule,
      RecoveryTicket,
      SessionAuditLog,
      AccessReview,
      DeviceTrust,
      GovAuditLog,
      IdentitySession,
      IdentitySsoConfig,
      IdentityDid,
    ]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: config.get<string>('JWT_EXPIRES_IN', '15m') as any,
        },
      }),
    }),
    AuditModule,
  ],
  controllers: [
    IdentityController,
    RbacController,
    MfaController,
    PasskeyController,
    GovernanceController,
    AuthExtendedController,
  ],
  providers: [
    DidService,
    IdentityService,
    RbacService,
    MfaService,
    PasskeyService,
    SessionService,
    PasskeySyncService,
    MfaPolicyService,
    DelegationService,
    RecoveryService,
    AccessReviewService,
    SessionGovernanceService,
    DeviceTrustService,
    GovAuditService,
    SsoService,
    PasswordlessService,
    AuthSecurityService,
    ComplianceService,
    SecurityAuditService,
    JwtStrategy,
  ],
  exports: [
    IdentityService,
    JwtModule,
    RbacService,
    MfaService,
    PasskeyService,
    SessionService,
    PasskeySyncService,
    MfaPolicyService,
    DelegationService,
    RecoveryService,
    AccessReviewService,
    SessionGovernanceService,
    DeviceTrustService,
    GovAuditService,
    SsoService,
    PasswordlessService,
    AuthSecurityService,
    ComplianceService,
    SecurityAuditService,
    DidService,
  ],
})
export class IdentityModule {}
