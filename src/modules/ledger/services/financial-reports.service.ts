import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Logger } from '@nestjs/common';
import { LedgerJournalEntry } from '../entities/ledger_journal_entry.entity';
import { LedgerJournalLine } from '../entities/ledger_journal_line.entity';
import { LedgerChartOfAccounts } from '../entities/ledger_chart_of_accounts.entity';
import { JournalEntryStatus } from '../entities/journal-entry-status.enum';
import { GlAccountType } from '../entities/gl-account-type.enum';

export interface TrialBalanceRow {
  account_id: string;
  account_code: string;
  account_name: string;
  account_type: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface GeneralLedgerRow {
  entry_number: string;
  description: string;
  effective_date: Date;
  debit: number;
  credit: number;
  line_description: string | null;
  status: string;
}

@Injectable()
export class FinancialReportsService {
  private readonly logger = new Logger(FinancialReportsService.name);

  constructor(
    @InjectRepository(LedgerJournalLine)
    private lineRepo: Repository<LedgerJournalLine>,
    @InjectRepository(LedgerChartOfAccounts)
    private coaRepo: Repository<LedgerChartOfAccounts>,
    @InjectRepository(LedgerJournalEntry)
    private jeRepo: Repository<LedgerJournalEntry>,
  ) {}

  async trialBalance(periodId: string): Promise<TrialBalanceRow[]> {
    this.logger.log(`Generating trial balance for period ${periodId}`);

    const lines = await this.lineRepo
      .createQueryBuilder('jl')
      .innerJoin('jl.journal_entry', 'je')
      .innerJoin('jl.account', 'coa')
      .where('je.fiscal_period_id = :periodId', { periodId })
      .andWhere('je.status = :status', { status: JournalEntryStatus.POSTED })
      .select([
        'coa.id AS account_id',
        'coa.account_code AS account_code',
        'coa.account_name AS account_name',
        'coa.account_type AS account_type',
      ])
      .addSelect('SUM(jl.debit)', 'debit')
      .addSelect('SUM(jl.credit)', 'credit')
      .groupBy('coa.id')
      .addGroupBy('coa.account_code')
      .addGroupBy('coa.account_name')
      .addGroupBy('coa.account_type')
      .orderBy('coa.account_code', 'ASC')
      .getRawMany();

    return lines.map((row: any) => ({
      account_id: row.account_id,
      account_code: row.account_code,
      account_name: row.account_name,
      account_type: row.account_type,
      debit: Number(row.debit) || 0,
      credit: Number(row.credit) || 0,
      balance: (Number(row.debit) || 0) - (Number(row.credit) || 0),
    }));
  }

  async generalLedger(accountId: string, fromDate: Date, toDate: Date): Promise<GeneralLedgerRow[]> {
    this.logger.log(`Generating GL for account ${accountId} from ${fromDate} to ${toDate}`);

    const lines = await this.lineRepo
      .createQueryBuilder('jl')
      .innerJoin('jl.journal_entry', 'je')
      .where('jl.account_id = :accountId', { accountId })
      .andWhere('je.status = :status', { status: JournalEntryStatus.POSTED })
      .andWhere('jl.effective_date >= :fromDate', { fromDate })
      .andWhere('jl.effective_date <= :toDate', { toDate })
      .select([
        'je.entry_number AS entry_number',
        'je.description AS description',
        'je.status AS status',
      ])
      .addSelect('jl.effective_date', 'effective_date')
      .addSelect('jl.debit', 'debit')
      .addSelect('jl.credit', 'credit')
      .addSelect('jl.line_description', 'line_description')
      .orderBy('jl.effective_date', 'ASC')
      .addOrderBy('je.entry_number', 'ASC')
      .getRawMany();

    return lines.map((row: any) => ({
      entry_number: row.entry_number,
      description: row.description,
      effective_date: row.effective_date,
      debit: Number(row.debit) || 0,
      credit: Number(row.credit) || 0,
      line_description: row.line_description,
      status: row.status,
    }));
  }

  async balanceSheet(asOfDate: Date): Promise<{
    assets: number;
    liabilities: number;
    equity: number;
    details: Record<string, { account_code: string; account_name: string; balance: number }[]>;
  }> {
    this.logger.log(`Generating balance sheet as of ${asOfDate}`);

    const lines = await this.lineRepo
      .createQueryBuilder('jl')
      .innerJoin('jl.journal_entry', 'je')
      .innerJoin('jl.account', 'coa')
      .where('je.status = :status', { status: JournalEntryStatus.POSTED })
      .andWhere('jl.effective_date <= :asOfDate', { asOfDate })
      .select([
        'coa.account_code AS account_code',
        'coa.account_name AS account_name',
        'coa.account_type AS account_type',
        'coa.normal_balance AS normal_balance',
      ])
      .addSelect('SUM(jl.debit)', 'debit_total')
      .addSelect('SUM(jl.credit)', 'credit_total')
      .groupBy('coa.account_code')
      .addGroupBy('coa.account_name')
      .addGroupBy('coa.account_type')
      .addGroupBy('coa.normal_balance')
      .orderBy('coa.account_code', 'ASC')
      .getRawMany();

    let assets = 0;
    let liabilities = 0;
    let equity = 0;
    const details: Record<string, any[]> = {
      asset: [],
      liability: [],
      equity: [],
    };

    for (const row of lines) {
      const debit = Number(row.debit_total) || 0;
      const credit = Number(row.credit_total) || 0;
      const balance = debit - credit;

      const entry = {
        account_code: row.account_code,
        account_name: row.account_name,
        balance: Math.abs(balance),
      };

      switch (row.account_type) {
        case GlAccountType.ASSET:
          assets += balance;
          details.asset.push(entry);
          break;
        case GlAccountType.LIABILITY:
          liabilities -= balance;
          details.liability.push(entry);
          break;
        case GlAccountType.EQUITY:
          equity -= balance;
          details.equity.push(entry);
          break;
      }
    }

    return { assets, liabilities, equity, details };
  }

  async incomeStatement(fromDate: Date, toDate: Date): Promise<{
    revenue: number;
    expenses: number;
    netIncome: number;
    details: Record<string, { account_code: string; account_name: string; balance: number }[]>;
  }> {
    this.logger.log(`Generating income statement from ${fromDate} to ${toDate}`);

    const lines = await this.lineRepo
      .createQueryBuilder('jl')
      .innerJoin('jl.journal_entry', 'je')
      .innerJoin('jl.account', 'coa')
      .where('je.status = :status', { status: JournalEntryStatus.POSTED })
      .andWhere('jl.effective_date >= :fromDate', { fromDate })
      .andWhere('jl.effective_date <= :toDate', { toDate })
      .andWhere('coa.account_type IN (:...types)', {
        types: [GlAccountType.REVENUE, GlAccountType.EXPENSE],
      })
      .select([
        'coa.account_code AS account_code',
        'coa.account_name AS account_name',
        'coa.account_type AS account_type',
      ])
      .addSelect('SUM(jl.debit)', 'debit_total')
      .addSelect('SUM(jl.credit)', 'credit_total')
      .groupBy('coa.account_code')
      .addGroupBy('coa.account_name')
      .addGroupBy('coa.account_type')
      .orderBy('coa.account_code', 'ASC')
      .getRawMany();

    let revenue = 0;
    let expenses = 0;
    const details: Record<string, any[]> = {
      revenue: [],
      expense: [],
    };

    for (const row of lines) {
      const debit = Number(row.debit_total) || 0;
      const credit = Number(row.credit_total) || 0;

      const entry = {
        account_code: row.account_code,
        account_name: row.account_name,
        balance: Math.abs(credit - debit),
      };

      if (row.account_type === GlAccountType.REVENUE) {
        revenue += credit - debit;
        details.revenue.push(entry);
      } else if (row.account_type === GlAccountType.EXPENSE) {
        expenses += debit - credit;
        details.expense.push(entry);
      }
    }

    return {
      revenue,
      expenses,
      netIncome: revenue - expenses,
      details,
    };
  }

  async cashFlowStatement(
    fromDate: Date,
    toDate: Date,
    method: 'direct' | 'indirect',
  ): Promise<{
    method: string;
    operatingActivities: number;
    investingActivities: number;
    financingActivities: number;
    netCashFlow: number;
    details: Record<string, any[]>;
  }> {
    this.logger.log(`Generating cash flow (${method}) from ${fromDate} to ${toDate}`);

    const lines = await this.lineRepo
      .createQueryBuilder('jl')
      .innerJoin('jl.journal_entry', 'je')
      .innerJoin('jl.account', 'coa')
      .where('je.status = :status', { status: JournalEntryStatus.POSTED })
      .andWhere('jl.effective_date >= :fromDate', { fromDate })
      .andWhere('jl.effective_date <= :toDate', { toDate })
      .select([
        'coa.account_code AS account_code',
        'coa.account_name AS account_name',
        'coa.account_type AS account_type',
      ])
      .addSelect('SUM(jl.debit)', 'debit_total')
      .addSelect('SUM(jl.credit)', 'credit_total')
      .groupBy('coa.account_code')
      .addGroupBy('coa.account_name')
      .addGroupBy('coa.account_type')
      .orderBy('coa.account_code', 'ASC')
      .getRawMany();

    let operating = 0;
    let investing = 0;
    let financing = 0;
    const details: Record<string, any[]> = {
      operating: [],
      investing: [],
      financing: [],
    };

    for (const row of lines) {
      const debit = Number(row.debit_total) || 0;
      const credit = Number(row.credit_total) || 0;
      const net = debit - credit;

      const entry = {
        account_code: row.account_code,
        account_name: row.account_name,
        amount: Math.abs(net),
        direction: net > 0 ? 'inflow' : net < 0 ? 'outflow' : 'none',
      };

      switch (row.account_type) {
        case GlAccountType.REVENUE:
        case GlAccountType.EXPENSE:
          operating += net;
          details.operating.push(entry);
          break;
        case GlAccountType.ASSET:
          investing -= net;
          details.investing.push(entry);
          break;
        case GlAccountType.LIABILITY:
        case GlAccountType.EQUITY:
          financing += net;
          details.financing.push(entry);
          break;
      }
    }

    return {
      method,
      operatingActivities: operating,
      investingActivities: investing,
      financingActivities: financing,
      netCashFlow: operating + investing + financing,
      details,
    };
  }

  async xbrlExport(
    type: 'balance-sheet' | 'income-statement',
    periodId: string,
  ): Promise<string> {
    this.logger.log(`Generating XBRL export (${type}) for period ${periodId}`);

    const period = await this.jeRepo
      .createQueryBuilder('je')
      .select('je.fiscal_period_id', 'period_id')
      .where('je.fiscal_period_id = :periodId', { periodId })
      .getRawOne();

    let data: string;
    if (type === 'balance-sheet') {
      const bs = await this.balanceSheet(new Date());
      data = `<xbrl:assets>${bs.assets}</xbrl:assets>\n<xbrl:liabilities>${bs.liabilities}</xbrl:liabilities>\n<xbrl:equity>${bs.equity}</xbrl:equity>`;
    } else {
      const is = await this.incomeStatement(
        new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
        new Date(),
      );
      data = `<xbrl:revenue>${is.revenue}</xbrl:revenue>\n<xbrl:expenses>${is.expenses}</xbrl:expenses>\n<xbrl:netIncome>${is.netIncome}</xbrl:netIncome>`;
    }

    return `<?xml version="1.0" encoding="UTF-8"?>
<xbrl xmlns="http://www.xbrl.org/2023" xmlns:xbrl="http://www.xbrl.org/2023">
  <context id="ctx_${periodId}">
    <period>
      <instant>2026-12-31</instant>
    </period>
  </context>
  ${data}
</xbrl>`;
  }
}
