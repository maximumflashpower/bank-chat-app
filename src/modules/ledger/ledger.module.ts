import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LedgerController } from './controllers/ledger.controller';
import { JournalEntryController } from './controllers/journal-entry.controller';
import { LedgerAccountingController } from './controllers/ledger-accounting.controller';
import { SegmentController } from './controllers/segment.controller';
import { LedgerService } from './services/ledger.service';
import { JournalEntryService } from './services/journal-entry.service';
import { ChartOfAccountsService } from './services/chart-of-accounts.service';
import { FiscalPeriodService } from './services/fiscal-period.service';
import { ReconciliationService } from './services/reconciliation.service';
import { FinancialReportsService } from './services/financial-reports.service';
import { SegmentAccountingService } from './services/segment-accounting.service';
import { MultiCurrencyService } from './services/multi-currency.service';
import { AccrualsService } from './services/accruals.service';
import { IntercompanyService } from './services/intercompany.service';
import { BudgetVarianceService } from './services/budget-variance.service';
import { SubLedgerService } from './services/sub-ledger.service';
import { LedgerAiService } from './services/ledger-ai.service';
import { InventoryAccountMappingController } from './controllers/inventory-account-mapping.controller';
import { InventoryJournalController } from './controllers/inventory-journal.controller';
import { InventoryJournalService } from './services/inventory-journal.service';
import { InventoryLedgerIntegrationService } from './services/inventory-ledger-integration.service';
import { InventoryFinancialReportingService } from './services/inventory-financial-reporting.service';
import { Account } from './entities/account.entity';
import { Transaction } from './entities/transaction.entity';
import { LedgerJournalEntry } from './entities/ledger_journal_entry.entity';
import { LedgerJournalLine } from './entities/ledger_journal_line.entity';
import { LedgerChartOfAccounts } from './entities/ledger_chart_of_accounts.entity';
import { LedgerFiscalPeriod } from './entities/ledger_fiscal_period.entity';
import { LedgerReconciliation } from './entities/ledger_reconciliation.entity';
import { InventoryAccountMapping } from './entities/inventory-account-mapping.entity';
import { InventoryJournalLink } from './entities/inventory-journal-link.entity';
import { InventoryPostingRule } from './entities/inventory-posting-rule.entity';
import { LedgerSegment } from './entities/ledger-segment.entity';
import { LedgerExchangeRate } from './entities/ledger-exchange-rate.entity';
import { LedgerAccrual } from './entities/ledger-accrual.entity';
import { LedgerIntercompany } from './entities/ledger-intercompany.entity';
import { LedgerBudget, LedgerEncumbrance } from './entities/ledger-budget.entity';
import { LedgerSubLedgerRule, LedgerSubLedgerEntry } from './entities/ledger-sub-ledger-rule.entity';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Account,
      Transaction,
      LedgerJournalEntry,
      LedgerJournalLine,
      LedgerChartOfAccounts,
      LedgerFiscalPeriod,
      LedgerReconciliation,
      InventoryAccountMapping,
      InventoryJournalLink,
      InventoryPostingRule,
      LedgerSegment,
      LedgerExchangeRate,
      LedgerAccrual,
      LedgerIntercompany,
      LedgerBudget,
      LedgerEncumbrance,
      LedgerSubLedgerRule,
      LedgerSubLedgerEntry,
    ]),
    NotificationModule,
  ],
  controllers: [
    InventoryAccountMappingController,
    InventoryJournalController,
    LedgerController,
    JournalEntryController,
    LedgerAccountingController,
    SegmentController,
  ],
  providers: [
    InventoryJournalService,
    InventoryLedgerIntegrationService,
    InventoryFinancialReportingService,
    LedgerService,
    JournalEntryService,
    ChartOfAccountsService,
    FiscalPeriodService,
    ReconciliationService,
    FinancialReportsService,
    SegmentAccountingService,
    MultiCurrencyService,
    AccrualsService,
    IntercompanyService,
    BudgetVarianceService,
    SubLedgerService,
    LedgerAiService,
  ],
  exports: [
    LedgerService,
    JournalEntryService,
    ChartOfAccountsService,
    SegmentAccountingService,
    MultiCurrencyService,
    AccrualsService,
    IntercompanyService,
    BudgetVarianceService,
    SubLedgerService,
    LedgerAiService,
  ],
})
export class LedgerModule {}
