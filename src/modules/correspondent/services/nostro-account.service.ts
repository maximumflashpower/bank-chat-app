import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NostroAccount } from '../entities/nostro-account.entity';

@Injectable()
export class NostroAccountService {
  constructor(
    @InjectRepository(NostroAccount)
    private repo: Repository<NostroAccount>,
  ) {}

  async create(data: Partial<NostroAccount>): Promise<NostroAccount> {
    const account = this.repo.create(data);
    return this.repo.save(account);
  }

  async findById(id: string): Promise<NostroAccount> {
    const account = await this.repo.findOne({ where: { id } });
    if (!account) throw new NotFoundException(`Nostro account ${id} not found`);
    return account;
  }

  async findByNumber(nostroNumber: string): Promise<NostroAccount> {
    const account = await this.repo.findOne({ where: { nostroNumber } });
    if (!account) throw new NotFoundException(`Nostro ${nostroNumber} not found`);
    return account;
  }

  async findByCorrespondent(correspondentBankId: string): Promise<NostroAccount[]> {
    return this.repo.find({ where: { correspondentBankId } });
  }

  async findAll(): Promise<NostroAccount[]> {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async updateBalance(id: string, balanceAvailable: number, balanceLedger: number, balanceReserved: number): Promise<NostroAccount> {
    await this.findById(id);
    await this.repo.update(id, { balanceAvailable, balanceLedger, balanceReserved });
    return this.findById(id);
  }

  async updateOverdraft(id: string, utilized: number): Promise<NostroAccount> {
    await this.findById(id);
    await this.repo.update(id, { overdraftUtilized: utilized });
    return this.findById(id);
  }

  async updateStatementDate(id: string, statementDate: Date): Promise<NostroAccount> {
    await this.findById(id);
    await this.repo.update(id, { lastStatementDate: statementDate });
    return this.findById(id);
  }

  async updateReconciliation(id: string, reconcileDate: Date, variance: number): Promise<NostroAccount> {
    await this.findById(id);
    await this.repo.update(id, {
      lastReconciliationDate: reconcileDate,
      varianceLastClose: variance,
    });
    return this.findById(id);
  }

  async deactivate(id: string): Promise<NostroAccount> {
    await this.findById(id);
    await this.repo.update(id, { status: 'inactive' });
    return this.findById(id);
  }

  async getBalanceSnapshot(id: string): Promise<{
    nostroNumber: string;
    currency: string;
    available: number;
    ledger: number;
    reserved: number;
    availableNet: number;
  }> {
    const account = await this.findById(id);
    return {
      nostroNumber: account.nostroNumber,
      currency: account.currencyCode,
      available: Number(account.balanceAvailable),
      ledger: Number(account.balanceLedger),
      reserved: Number(account.balanceReserved),
      availableNet: Number(account.balanceAvailable) - Number(account.overdraftUtilized),
    };
  }
}
