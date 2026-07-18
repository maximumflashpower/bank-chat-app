import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { RetailAccount, AccountType, AccountStatus, KycStatus } from '../entities/retail-account.entity';

@Injectable()
export class RetailAccountService {
  private readonly logger = new Logger(RetailAccountService.name);

  constructor(
    @InjectRepository(RetailAccount)
    private readonly repo: Repository<RetailAccount>,
  ) {}

  async openAccount(data: Partial<RetailAccount>): Promise<RetailAccount> {
    const accountNumber = data.accountNumber || this.generateAccountNumber();
    const iban = data.ibanNumber || this.generateIban(accountNumber);
    const account = this.repo.create({
      ...data,
      accountNumber,
      ibanNumber: iban,
      status: AccountStatus.ACTIVE,
      kycVerificationStatus: KycStatus.PENDING,
      currentBalance: 0,
      availableBalance: 0,
      holdAmount: 0,
      openedAt: new Date(),
      lastActivityAt: new Date(),
    });
    const saved = await this.repo.save(account);
    this.logger.log(`Account opened: ${saved.accountNumber} for customer ${saved.customerId}`);
    return saved;
  }

  async findById(id: string): Promise<RetailAccount> {
    const account = await this.repo.findOne({ where: { id } });
    if (!account) throw new NotFoundException(`Account ${id} not found`);
    return account;
  }

  async findByAccountNumber(accountNumber: string): Promise<RetailAccount | null> {
    return this.repo.findOne({ where: { accountNumber } });
  }

  async findByCustomer(customerId: string): Promise<RetailAccount[]> {
    return this.repo.find({ where: { customerId }, order: { openedAt: 'DESC' } });
  }

  async getBalance(accountId: string): Promise<{ current: number; available: number; hold: number }> {
    const account = await this.findById(accountId);
    return {
      current: Number(account.currentBalance),
      available: Number(account.availableBalance),
      hold: Number(account.holdAmount),
    };
  }

  async updateStatus(accountId: string, status: AccountStatus, reason?: string): Promise<RetailAccount> {
    const account = await this.findById(accountId);
    account.status = status;
    if (status === AccountStatus.CLOSED) {
      account.closedAt = new Date();
      account.closeReason = reason || 'Account closed';
    }
    this.logger.log(`Account ${account.accountNumber} status → ${status}`);
    return this.repo.save(account);
  }

  async closeAccount(accountId: string, reason: string, dispositionAccountId?: string): Promise<RetailAccount> {
    const account = await this.findById(accountId);
    if (account.status === AccountStatus.CLOSED) {
      throw new BadRequestException(`Account ${accountId} is already closed`);
    }
    if (Number(account.currentBalance) !== 0 && !dispositionAccountId) {
      throw new BadRequestException('Remaining balance requires disposition account');
    }
    account.status = AccountStatus.CLOSED;
    account.closedAt = new Date();
    account.closeReason = reason;
    this.logger.log(`Account ${account.accountNumber} closed: ${reason}`);
    return this.repo.save(account);
  }

  async freezeAccount(accountId: string): Promise<RetailAccount> {
    return this.updateStatus(accountId, AccountStatus.FROZEN, 'Compliance hold');
  }

  async unfreezeAccount(accountId: string): Promise<RetailAccount> {
    return this.updateStatus(accountId, AccountStatus.ACTIVE, 'Unfrozen');
  }

  async checkDormancy(monthsInactive: number = 12): Promise<{ flagged: number; accounts: RetailAccount[] }> {
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - monthsInactive);
    const dormant = await this.repo.find({
      where: { lastActivityAt: LessThan(cutoffDate), status: AccountStatus.ACTIVE, dormancyFlag: false },
    });
    for (const account of dormant) {
      account.dormancyFlag = true;
      account.status = AccountStatus.DORMANT;
    }
    await this.repo.save(dormant);
    this.logger.log(`Dormancy check: ${dormant.length} accounts flagged`);
    return { flagged: dormant.length, accounts: dormant };
  }

  async updateActivity(accountId: string): Promise<void> {
    const account = await this.findById(accountId);
    account.lastActivityAt = new Date();
    if (account.dormancyFlag) {
      account.dormancyFlag = false;
      account.status = AccountStatus.ACTIVE;
    }
    await this.repo.save(account);
  }

  async configureOverdraft(accountId: string, limit: number, enabled: boolean): Promise<RetailAccount> {
    const account = await this.findById(accountId);
    account.overdraftLimit = limit;
    account.overdraftProtectionEnabled = enabled;
    this.logger.log(`Overdraft configured for ${account.accountNumber}: limit=${limit}, enabled=${enabled}`);
    return this.repo.save(account);
  }

  async chargeMonthlyFee(accountId: string): Promise<{ fee: number; waived: boolean }> {
    const account = await this.findById(accountId);
    if (!account.monthlyFee || Number(account.monthlyFee) === 0) {
      return { fee: 0, waived: false };
    }
    let waived = false;
    if (account.feeWaiverConditions) {
      const conditions = account.feeWaiverConditions as any;
      if (conditions.minBalance && Number(account.currentBalance) >= conditions.minBalance) {
        waived = true;
      }
    }
    if (!waived) {
      account.currentBalance = Number(account.currentBalance) - Number(account.monthlyFee);
      account.availableBalance = Number(account.availableBalance) - Number(account.monthlyFee);
      await this.repo.save(account);
    }
    return { fee: waived ? 0 : Number(account.monthlyFee), waived };
  }

  private generateAccountNumber(): string {
    const random = Math.floor(Math.random() * 9000000000) + 1000000000;
    return `ACC${random}`;
  }

  private generateIban(accountNumber: string): string {
    const countryCode = 'US';
    const checkDigits = '00';
    return `${countryCode}${checkDigits}${accountNumber}`;
  }
}
