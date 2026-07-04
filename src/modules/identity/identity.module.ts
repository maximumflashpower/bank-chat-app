import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { IdentityController } from './controllers/identity.controller';
import { IdentityService } from './services/identity.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { IdentityUser } from './entities/identity-user.entity';
import { Credential } from './entities/credential.entity';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([IdentityUser, Credential]),
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
  controllers: [IdentityController],
  providers: [IdentityService, JwtStrategy],
  exports: [IdentityService, JwtModule],
})
export class IdentityModule {}
