import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { RedisModule } from '@nestjs-modules/ioredis';
import { envValidationSchema } from './config/env_validation';
import { IdentityModule } from './modules/identity/identity.module';
import { PrivacyModule } from './modules/privacy/privacy.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { UserModule } from './modules/user/user.module';
import { LedgerModule } from './modules/ledger/ledger.module';
import { AuditModule } from './modules/audit/audit.module';
import { NotificationModule } from './modules/notification/notification.module';
import { ChatModule } from './modules/chat/chat.module';
import { StorageModule } from './modules/storage/storage.module';
import { ReconciliationModule } from './modules/reconciliation/reconciliation.module.js';
import { GovernanceModule } from './modules/governance/governance.module';
import { DataPipelineModule } from './modules/data-pipeline/data-pipeline.module';
import { MonitoringModule } from './modules/monitoring/monitoring.module';
import { ChangeManagementModule } from './modules/change-management/change-management.module';
import { TaxModule } from './modules/tax/tax.module.js';
import { AccountingAiModule } from './modules/accounting-ai/accounting-ai.module.js';
import { PaymentsModule } from './modules/payments/payments.module.js';
import { SmbModule } from './modules/smb/smb.module.js';
import { SmbReportingModule } from './modules/smb/smb-reporting.module';
import { SmbInventoryModule } from './modules/smb-inventory/smb-inventory.module.js';
import { SmbBudgetingModule } from './modules/smb-budgeting/smb-budgeting.module';
import { RegulatoryExamModule } from './modules/regulatory/exam/regulatory-exam.module';
import { SoxModule } from './modules/regulatory/sox/sox.module';
import { SurveillanceModule } from './modules/regulatory/surveillance/surveillance.module';
import { EthicsModule } from './modules/regulatory/ethics/ethics.module';
import { BaselModule } from './modules/regulatory/basel/basel.module';
import { ExportControlModule } from './modules/regulatory/export-control/export-control.module';
import { MiscModule } from './modules/regulatory/misc/misc.module';
import { AiRegulatoryModule } from './modules/regulatory/ai/ai-regulatory.module';
import { SocModule } from './modules/soc/soc.module';
import { LoansModule } from "./modules/loans/loans.module.js";
import { DataGovernanceModule } from "./modules/data-governance/data-governance.module.js";
import { IdentityUser } from './modules/identity/entities/identity-user.entity';
import { Credential } from './modules/identity/entities/credential.entity';
import { Role } from './modules/identity/entities/role.entity';
import { UserRole } from './modules/identity/entities/user-role.entity';
import { MfaFactor } from './modules/identity/entities/mfa-factor.entity';
import { Passkey } from './modules/identity/entities/passkey.entity';
import { PrivacyConsent as Consent } from './modules/privacy/entities/privacy-consent.entity';
import { PrivacyDsarRequest as DsarRequest } from './modules/privacy/entities/privacy-dsar-request.entity';
import { PrivacyProcessingActivity as ProcessingActivity } from './modules/privacy/entities/privacy-processing-activity.entity';
import { PrivacyDpiaAssessment as Dpia } from './modules/privacy/entities/privacy-dpia-assessment.entity';
import { PrivacyBreachNotification as BreachNotification } from './modules/privacy/entities/privacy-breach-notification.entity';
import { RetentionSchedule } from './modules/privacy/entities/retention-schedule.entity';
import { PolicyVersion } from './modules/privacy/entities/policy-version.entity';
import { DpoContact } from './modules/privacy/entities/dpo-contact.entity';
import { ThirdPartyProcessor } from './modules/privacy/entities/third-party-processor.entity';
import { RegExam } from './modules/regulatory/exam/entities/reg-exam.entity';
import { SoxControl } from './modules/regulatory/sox/entities/sox-control.entity';
import { SurveillanceAlert } from './modules/regulatory/surveillance/entities/surveillance-alert.entity';
import { EthicsCase } from './modules/regulatory/ethics/entities/ethics-case.entity';
import { ConflictOfInterest } from './modules/regulatory/ethics/entities/conflict-of-interest.entity';
import { GiftEntertainmentLog } from './modules/regulatory/ethics/entities/gift-entertainment-log.entity';
import { BaselReport } from './modules/regulatory/basel/entities/basel-report.entity';
import { ExportControlLicense } from './modules/regulatory/export-control/entities/export-control-license.entity';
import { RegulatoryChange } from './modules/regulatory/misc/entities/regulatory-change.entity';
import { ComplianceTraining } from './modules/regulatory/misc/entities/compliance-training.entity';
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
import { LoanProduct } from "./modules/loans/entities/loan-product.entity.js";
import { LoanApplication } from "./modules/loans/entities/loan-application.entity.js";
import { LoanMaster } from "./modules/loans/entities/loan-master.entity.js";
import { DatagovClassification } from './modules/data-governance/entities/datagov-classification.entity.js';
import { DatagovRetentionPolicy } from './modules/data-governance/entities/datagov-retention-policy.entity.js';
import { DatagovDlpRule } from './modules/data-governance/entities/datagov-dlp-rule.entity.js';
import { DatagovDlpViolation } from './modules/data-governance/entities/datagov-dlp-violation.entity.js';
import { DatagovCatalogEntry } from './modules/data-governance/entities/datagov-catalog-entry.entity.js';
import { DatagovQualityScore } from './modules/data-governance/entities/datagov-quality-score.entity.js';
import { DatagovLineage } from './modules/data-governance/entities/datagov-lineage.entity.js';
import { LoanAmortizationSchedule } from "./modules/loans/entities/loan-amortization-schedule.entity.js";
import { LoanCollateral } from "./modules/loans/entities/loan-collateral.entity.js";
import { LoanDelinquencyEvent } from "./modules/loans/entities/loan-delinquency-event.entity.js";
import { GovDecisionLog } from './modules/governance/entities/gov-decision-log.entity';
import { GovDriftDetection } from './modules/governance/entities/gov-drift-detection.entity';
import { BudgetHeader } from './modules/smb-budgeting/entities/budget-header.entity';
import { BudgetLineItem } from './modules/smb-budgeting/entities/budget-line-item.entity';
import { ProjectRegistry } from './modules/smb-budgeting/entities/project-registry.entity';
import { TimeEntryLog } from './modules/smb-budgeting/entities/time-entry-log.entity';
import { OverheadAllocationMethod } from './modules/smb-budgeting/entities/overhead-allocation-method.entity';
import { GovFrameworkMapping } from './modules/governance/entities/gov-framework-mapping.entity';
import { GovViolation } from './modules/governance/entities/gov-violation.entity';
import { GovRegComp } from './modules/governance/entities/gov-reg-comp.entity';
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
import { SmbCompanyProfile } from './modules/smb/entities/smb-company-profile.entity.js';
import { SmbContactParty } from './modules/smb/entities/smb-contact-party.entity.js';
import { SmbInvoiceDocument } from './modules/smb/entities/smb-invoice-document.entity.js';
import { SmbBankAccountLinked } from './modules/smb/entities/smb-bank-account-linked.entity.js';
import { SmbInventoryItem } from './modules/smb-inventory/entities/smb-inventory-item.entity.js';
import { SmbWarehouse } from './modules/smb-inventory/entities/smb-warehouse.entity.js';
import { SmbStockMovement } from './modules/smb-inventory/entities/smb-stock-movement.entity.js';
import { SmbStockLevel } from './modules/smb-inventory/entities/smb-stock-level.entity.js';
import { InventoryAccountMapping } from './modules/ledger/entities/inventory-account-mapping.entity';
import { InventoryJournalLink } from './modules/ledger/entities/inventory-journal-link.entity';
import { InventoryPostingRule } from './modules/ledger/entities/inventory-posting-rule.entity';
import { InventoryTaxLine } from './modules/tax/entities/inventory-tax-line.entity';
import { SmbInvoiceLineItem } from './modules/smb/entities/smb-invoice-line-item.entity';
import { SmbReportSnapshot } from './modules/smb/entities/smb-report-snapshot.entity';
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
RegExam,
SoxControl,
SurveillanceAlert,
EthicsCase,
ConflictOfInterest,
GiftEntertainmentLog,
BaselReport,
ExportControlLicense,
RegulatoryChange,
ComplianceTraining,
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
          LoanProduct,
          LoanApplication,
          LoanMaster,
          LoanAmortizationSchedule,
          LoanCollateral,
          LoanDelinquencyEvent,
DatagovClassification,
DatagovRetentionPolicy,
DatagovDlpRule,
DatagovDlpViolation,
DatagovCatalogEntry,
DatagovQualityScore,
DatagovLineage,
          GovDecisionLog,
          GovDriftDetection,
          GovFrameworkMapping,
          GovViolation,
    GovRegComp,
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
          SmbCompanyProfile,
          SmbContactParty,
          SmbInvoiceDocument,
          SmbBankAccountLinked,
          SmbInventoryItem,
          SmbWarehouse,
          SmbStockMovement,
          SmbStockLevel,
          InventoryAccountMapping,
          InventoryJournalLink,
          InventoryPostingRule,
          InventoryTaxLine,
          SmbInvoiceLineItem,
          SmbReportSnapshot,
          BudgetHeader,
          BudgetLineItem,
          ProjectRegistry,
          TimeEntryLog,
          OverheadAllocationMethod,
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
    WebhooksModule,
    UserModule,
    LedgerModule,
    AuditModule,
    NotificationModule,
    ChatModule,
    StorageModule,
    ReconciliationModule,
    GovernanceModule,
    LoansModule,
DataGovernanceModule,
    DataPipelineModule,
    MonitoringModule,
    ChangeManagementModule,
    TaxModule,
    AccountingAiModule,
    PaymentsModule,
    SmbModule,
    SmbReportingModule,
    SmbInventoryModule,
    SmbBudgetingModule,
RegulatoryExamModule,
SoxModule,
SurveillanceModule,
EthicsModule,
BaselModule,
ExportControlModule,
MiscModule,
AiRegulatoryModule,
    SocModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
