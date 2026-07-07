import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { RedisModule } from '@nestjs-modules/ioredis';
import { envValidationSchema } from './config/env_validation';
import { IdentityModule } from './modules/identity/identity.module';
import { PrivacyModule } from './modules/privacy/privacy.module';
import { UserModule } from './modules/user/user.module';
import { LedgerModule } from './modules/ledger/ledger.module';
import { AuditModule } from './modules/audit/audit.module';
import { NotificationModule } from './modules/notification/notification.module';
import { ChatModule } from './modules/chat/chat.module';
import { StorageModule } from './modules/storage/storage.module';
import { GovernanceModule } from './modules/governance/governance.module';
import { DataPipelineModule } from './modules/data-pipeline/data-pipeline.module';
import { MonitoringModule } from './modules/monitoring/monitoring.module';
import { ChangeManagementModule } from './modules/change-management/change-management.module';
import { TaxModule } from './modules/tax/tax.module.js';
import { AccountingAiModule } from './modules/accounting-ai/accounting-ai.module.js';
import { PaymentsModule } from './modules/payments/payments.module.js';
import { IdentityUser } from './modules/identity/entities/identity-user.entity';
import { Credential } from './modules/identity/entities/credential.entity';
import { Role } from './modules/identity/entities/role.entity';
import { UserRole } from './modules/identity/entities/user-role.entity';
import { MfaFactor } from './modules/identity/entities/mfa-factor.entity';
import { Passkey } from './modules/identity/entities/passkey.entity';
import { Consent } from './modules/privacy/entities/consent.entity';
import { DsarRequest } from './modules/privacy/entities/dsar-request.entity';
import { ProcessingActivity } from './modules/privacy/entities/processing-activity.entity';
import { Dpia } from './modules/privacy/entities/dpia.entity';
import { BreachNotification } from './modules/privacy/entities/breach-notification.entity';
import { RetentionSchedule } from './modules/privacy/entities/retention-schedule.entity';
import { PolicyVersion } from './modules/privacy/entities/policy-version.entity';
import { DpoContact } from './modules/privacy/entities/dpo-contact.entity';
import { ThirdPartyProcessor } from './modules/privacy/entities/third-party-processor.entity';
import { UserProfile } from './modules/user/entities/user-profile.entity';
import { Account } from './modules/ledger/entities/account.entity';
import { Transaction } from './modules/ledger/entities/transaction.entity';
import { LedgerJournalEntry } from './modules/ledger/entities/ledger_journal_entry.entity';
import { LedgerJournalLine } from './modules/ledger/entities/ledger_journal_line.entity';
import { LedgerChartOfAccounts } from './modules/ledger/entities/ledger_chart_of_accounts.entity';
import { LedgerFiscalPeriod } from './modules/ledger/entities/ledger_fiscal_period.entity';
import { LedgerReconciliation } from './modules/ledger/entities/ledger_reconciliation.entity';
import { AuditLog } from './modules/audit/entities/audit-log.entity';
import { ForensicCase } from './modules/audit/entities/forensic-case.entity';
import { ForensicEvidenceItem } from './modules/audit/entities/forensic-evidence-item.entity';
import { SecurityEventClassified } from './modules/audit/entities/security-event-classified.entity';
import { Notification } from './modules/notification/entities/notification.entity';
import { Conversation } from './modules/chat/entities/conversation.entity';
import { ConversationParticipant } from './modules/chat/entities/conversation-participant.entity';
import { Message } from './modules/chat/entities/message.entity';
import { StoredFile } from './modules/storage/entities/stored-file.entity';
import { GovPolicy } from './modules/governance/entities/gov-policy.entity';
import { GovDecisionLog } from './modules/governance/entities/gov-decision-log.entity';
import { GovDriftDetection } from './modules/governance/entities/gov-drift-detection.entity';
import { GovFrameworkMapping } from './modules/governance/entities/gov-framework-mapping.entity';
import { GovViolation } from './modules/governance/entities/gov-violation.entity';
import { DataPipeline } from './modules/data-pipeline/entities/data-pipeline.entity';
import { DataCatalogEntry } from './modules/data-pipeline/entities/data-catalog-entry.entity';
import { MonitorMetric } from './modules/monitoring/entities/monitor-metric.entity';
import { AlertRule } from './modules/monitoring/entities/alert-rule.entity';
import { ChangeRequest } from './modules/change-management/entities/change-request.entity';
import { FeatureFlag } from './modules/change-management/entities/feature-flag.entity';
import { TaxCalculationResult } from './modules/tax/entities/tax-calculation-result.entity.js';
import { TaxJurisdictionRule } from './modules/tax/entities/tax-jurisdiction-rule.entity.js';
import { TaxDeclarationPeriod } from './modules/tax/entities/tax-declaration-period.entity.js';
import { TaxWithholdingCertificate } from './modules/tax/entities/tax-withholding-certificate.entity.js';
import { TaxProductMapping } from './modules/tax/entities/tax-product-mapping.entity.js';
import { AiOcrExtractionTask } from './modules/accounting-ai/entities/ai-ocr-extraction-task.entity.js';
import { AiJournalSuggestion } from './modules/accounting-ai/entities/ai-journal-suggestion.entity.js';
import { AiAnomalyDetectionResult } from './modules/accounting-ai/entities/ai-anomaly-detection-result.entity.js';
import { AiRecurringTemplate } from './modules/accounting-ai/entities/ai-recurring-template.entity.js';
import { CashflowClassificationLog } from './modules/accounting-ai/entities/cashflow-classification-log.entity.js';
import { PayInstruction } from './modules/payments/entities/pay-instruction.entity.js';
import { PayTransactionRecord } from './modules/payments/entities/pay-transaction-record.entity.js';
import { PayReconciliationEntry } from './modules/payments/entities/pay-reconciliation-entry.entity.js';
import { BankConnectionConfig } from './modules/payments/entities/bank-connection-config.entity.js';
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
        entities: [
          IdentityUser,
          Credential,
          Role,
          UserRole,
          MfaFactor,
          Passkey,
          Consent,
          DsarRequest,
          ProcessingActivity,
          Dpia,
          BreachNotification,
          RetentionSchedule,
          PolicyVersion,
          DpoContact,
          ThirdPartyProcessor,
          UserProfile,
          Account,
          Transaction,
          LedgerJournalEntry,
          LedgerJournalLine,
          LedgerChartOfAccounts,
          LedgerFiscalPeriod,
          LedgerReconciliation,
          AuditLog,
          ForensicCase,
          ForensicEvidenceItem,
          SecurityEventClassified,
          Notification,
          Conversation,
          ConversationParticipant,
          Message,
          StoredFile,
          GovPolicy,
          GovDecisionLog,
          GovDriftDetection,
          GovFrameworkMapping,
          GovViolation,
          DataPipeline,
          DataCatalogEntry,
          MonitorMetric,
          AlertRule,
          ChangeRequest,
          FeatureFlag,
          TaxCalculationResult,
          TaxJurisdictionRule,
          TaxDeclarationPeriod,
          TaxWithholdingCertificate,
          TaxProductMapping,
          AiOcrExtractionTask,
          AiJournalSuggestion,
          AiAnomalyDetectionResult,
          AiRecurringTemplate,
          CashflowClassificationLog,
          PayInstruction,
          PayTransactionRecord,
          PayReconciliationEntry,
          BankConnectionConfig,
        ],
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
    PrivacyModule,
    UserModule,
    LedgerModule,
    AuditModule,
    NotificationModule,
    ChatModule,
    StorageModule,
    GovernanceModule,
    DataPipelineModule,
    MonitoringModule,
    ChangeManagementModule,
    TaxModule,
    AccountingAiModule,
    PaymentsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
