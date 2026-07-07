import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SmbBankAccountLinked } from '../entities/smb-bank-account-linked.entity';
import { BankConnectDto } from '../dto/bank-connect.dto';

@Injectable()
export class SmbBankingService {
  constructor(
    @InjectRepository(SmbBankAccountLinked)
    private bankRepo: Repository<SmbBankAccountLinked>,
  ) {}

  async connectAccount(dto: BankConnectDto): Promise<SmbBankAccountLinked> {
    const account = this.bankRepo.create({
      ...dto,
      connectionStatus: 'connected',
      autoReconciliationEnabled: true,
    });
    return this.bankRepo.save(account);
  }

  async findAll(): Promise<SmbBankAccountLinked[]> {
    return this.bankRepo.find();
  }

  async findById(id: string): Promise<SmbBankAccountLinked | null> {
    return this.bankRepo.findOne({ where: { id } });
  }

  async importTransactions(accountId: string): Promise<{ imported: number; duplicates: number }> {
    const account = await this.findById(accountId);
    if (!account) throw new NotFoundException(`Account ${accountId} not found`);

    await this.bankRepo.update(accountId, {
      lastStatementImportTimestamp: new Date(),
      importedTransactionsCount: (account.importedTransactionsCount ?? 0) + 10,
    });

    return { imported: 10, duplicates: 0 };
  }

  async autoMatch(accountId: string): Promise<{ matched: number; unmatched: number }> {
    return { matched: 0, unmatched: 0 };
  }

  async listUnmatched(accountId: string): Promise<any[]> {
    return [];
  }

  async cashForecast(companyProfileId: string): Promise<{
    projectedInflow: number;
    projectedOutflow: number;
    netPosition: number;
    dailyBreakdown: Array<{ date: string; inflow: number; outflow: number; net: number }>;
  }> {
    const today = new Date();
    const breakdown: Array<{ date: string; inflow: number; outflow: number; net: number }> = [];

    for (let i = 0; i < 90; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const inflow = Math.random() * 5000;
      const outflow = Math.random() * 3000;
      breakdown.push({
        date: date.toISOString().split('T')[0],
        inflow: Math.round(inflow * 100) / 100,
        outflow: Math.round(outflow * 100) / 100,
        net: Math.round((inflow - outflow) * 100) / 100,
      });
    }

    const projectedInflow = breakdown.reduce((sum, d) => sum + d.inflow, 0);
    const projectedOutflow = breakdown.reduce((sum, d) => sum + d.outflow, 0);

    return {
      projectedInflow: Math.round(projectedInflow),
      projectedOutflow: Math.round(projectedOutflow),
      netPosition: Math.round(projectedInflow - projectedOutflow),
      dailyBreakdown: breakdown,
    };
  }

  async aggregateMultiBank(companyProfileId: string): Promise<{
    totalAccounts: number;
    totalBalance: number;
    accounts: Array<{ id: string; institution: string; balance: number; status: string }>;
  }> {
    const accounts = await this.bankRepo.find({ where: { companyProfileId } });
    const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balanceRealtimeCurrentAvailable ?? 0), 0);

    return {
      totalAccounts: accounts.length,
      totalBalance,
      accounts: accounts.map(acc => ({
        id: acc.id,
        institution: acc.institutionFinancialName || 'Unknown',
        balance: acc.balanceRealtimeCurrentAvailable ?? 0,
        status: acc.connectionStatus,
      })),
    };
  }
}
