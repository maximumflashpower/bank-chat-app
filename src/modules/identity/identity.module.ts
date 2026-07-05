import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { IdentityController } from './controllers/identity.controller';
import { RbacController } from './controllers/rbac.controller';
import { MfaController } from './controllers/mfa.controller';
import { PasskeyController } from './controllers/passkey.controller';
import { IdentityService } from './services/identity.service';
import { RbacService } from './services/rbac.service';
import { MfaService } from './services/mfa.service';
import { PasskeyService } from './services/passkey.service';
import { SessionService } from './services/session.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { IdentityUser } from './entities/identity-user.entity';
import { Credential } from './entities/credential.entity';
import { Role } from './entities/role.entity';
import { UserRole } from './entities/user-role.entity';
import { MfaFactor } from './entities/mfa-factor.entity';
import { Passkey } from './entities/passkey.entity';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([IdentityUser, Credential, Role, UserRole, MfaFactor, Passkey]),
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
  controllers: [IdentityController, RbacController, MfaController, PasskeyController],
  providers: [
    IdentityService,
    RbacService,
    MfaService,
    PasskeyService,
    SessionService,
    JwtStrategy,
  ],
  exports: [IdentityService, JwtModule, RbacService, MfaService, PasskeyService, SessionService],
})
export class IdentityModule {}
