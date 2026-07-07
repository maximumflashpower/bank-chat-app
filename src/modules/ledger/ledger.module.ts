import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LedgerController } from './controllers/ledger.controller';
import { JournalEntryController } from './controllers/journal-entry.controller';
import { LedgerAccountingController } from './controllers/ledger-accounting.controller';
import { LedgerService } from './services/ledger.service';
import { JournalEntryService } from './services/journal-entry.service';
import { ChartOfAccountsService } from './services/chart-of-accounts.service';
import { FiscalPeriodService } from './services/fiscal-period.service';
import { ReconciliationService } from './services/reconciliation.service';
import { FinancialReportsService } from './services/financial-reports.service';
import { Account } from './entities/account.entity';
import { Transaction } from './entities/transaction.entity';
import { LedgerJournalEntry } from './entities/ledger_journal_entry.entity';
import { LedgerJournalLine } from './entities/ledger_journal_line.entity';
import { LedgerChartOfAccounts } from './entities/ledger_chart_of_accounts.entity';
import { LedgerFiscalPeriod } from './entities/ledger_fiscal_period.entity';
import { LedgerReconciliation } from './entities/ledger_reconciliation.entity';
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
    ]),
    NotificationModule,
  ],
  controllers: [
    LedgerController,
    JournalEntryController,
    LedgerAccountingController,
  ],
  providers: [
    LedgerService,
    JournalEntryService,
    ChartOfAccountsService,
    FiscalPeriodService,
    ReconciliationService,
    FinancialReportsService,
  ],
  exports: [
    LedgerService,
    JournalEntryService,
    ChartOfAccountsService,
  ],
})
export class LedgerModule {}
