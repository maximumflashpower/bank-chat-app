import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { RedisModule } from '@nestjs-modules/ioredis';
import { envValidationSchema } from './config/env_validation';
import { IdentityModule } from './modules/identity/identity.module';
import { UserModule } from './modules/user/user.module';
import { LedgerModule } from './modules/ledger/ledger.module';
import { AuditModule } from './modules/audit/audit.module';
import { IdentityUser } from './modules/identity/entities/identity-user.entity';
import { Credential } from './modules/identity/entities/credential.entity';
import { UserProfile } from './modules/user/entities/user-profile.entity';
import { Account } from './modules/ledger/entities/account.entity';
import { Transaction } from './modules/ledger/entities/transaction.entity';
import { AuditLog } from './modules/audit/entities/audit-log.entity';
import * as path from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: path.resolve(process.cwd(), '.env'),
      validationSchema: envValidationSchema,
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_DATABASE'),
        ssl: config.get<boolean>('DB_SSL'),
        synchronize: config.get<boolean>('DB_SYNC'),
        logging: config.get<boolean>('DB_LOGGING'),
        entities: [IdentityUser, Credential, UserProfile, Account, Transaction, AuditLog],
        migrations: [path.join(__dirname, '../db/migrations/*{.ts,.js}')],
        migrationsRun: false,
      }),
    }),

    RedisModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'single' as const,
        url: `redis://${config.get('REDIS_HOST')}:${config.get('REDIS_PORT')}`,
      }),
    }),

    ThrottlerModule.forRoot([
      {
        ttl: Number(process.env.THROTTLE_TTL) || 60000,
        limit: Number(process.env.THROTTLE_LIMIT) || 10,
      },
    ]),

    IdentityModule,
    UserModule,
    LedgerModule,
    AuditModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
