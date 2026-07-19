import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { BusinessAccount, BusinessAccountTier, BusinessAccountStatus, KycCorporateStatus } from '../entities/business-account.entity';

@Injectable()
export class BusinessAccountService {
  private readonly logger = new Logger(BusinessAccountService.name);

  constructor(
    @InjectRepository(BusinessAccount)
    private readonly repo: Repository<BusinessAccount>,
  ) {}

  async openAccount(data: Partial<BusinessAccount>): Promise<BusinessAccount> {
    const accountNumber = this.generateAccountNumber();
    
    const account = this.repo.create({
      ...data,
      accountNumber,
      status: BusinessAccountStatus.ACTIVE,
      kycCorporateStatus: KycCorporateStatus.PENDING,
      positivePayEnabled: true,
      fraudFilterAchEnabled: true,
    });

    const saved = await this.repo.save(account);
    this.logger.log(`Business account opened: ${accountNumber}, org=${data.organizationId}`);
    return saved;
  }

  async findById(id: string): Promise<BusinessAccount> {
    const account = await this.repo.findOne({ where: { id } });
    if (!account) throw new NotFoundException(`Business account ${id} not found`);
    return account;
  }

  async findByOrganization(organizationId: string): Promise<BusinessAccount[]> {
    return this.repo.find({ 
      where: { organizationId },
      order: { openedAt: 'DESC' },
    });
  }

  async getBalance(accountId: string): Promise<{ currentBalance: number; availableBalance: number; holdAmount: number }> {
    const account = await this.findById(accountId);
    return {
      currentBalance: Number(account.currentBalance),
      availableBalance: Number(account.availableBalance),
      holdAmount: Number(account.holdAmount),
    };
  }

  async updateStatus(accountId: string, status: BusinessAccountStatus, reason?: string): Promise<BusinessAccount> {
    const account = await this.findById(accountId);
    account.status = status;
    await this.repo.save(account);
    this.logger.log(`Account ${accountId} status updated to ${status}${reason ? `, reason: ${reason}` : ''}`);
    return account;
  }

  async freezeAccount(accountId: string): Promise<BusinessAccount> {
    const account = await this.findById(accountId);
    account.status = BusinessAccountStatus.FROZEN;
    return this.repo.save(account);
  }

  async unfreezeAccount(accountId: string): Promise<BusinessAccount> {
    const account = await this.findById(accountId);
    account.status = BusinessAccountStatus.ACTIVE;
    return this.repo.save(account);
  }

  async configureOverdraft(accountId: string, limit: number, enabled: boolean): Promise<void> {
    const account = await this.findById(accountId);
    account.overdraftLineCredit = enabled ? limit : 0;
    await this.repo.save(account);
    this.logger.log(`Overdraft configured for ${accountId}: ${enabled ? limit : 0}`);
  }

  async verifyKyc(accountId: string): Promise<BusinessAccount> {
    const account = await this.findById(accountId);
    account.kycCorporateStatus = KycCorporateStatus.VERIFIED;
    account.kycVerifiedAt = new Date();
    return this.repo.save(account);
  }

  async closeAccount(accountId: string, reason: string): Promise<BusinessAccount> {
    const account = await this.findById(accountId);
    account.status = BusinessAccountStatus.CLOSED;
    account.closedAt = new Date();
    return this.repo.save(account);
  }

  private generateAccountNumber(): string {
    const prefix = 'BA';
    const date = new Date().toISOString().slice(0, 7).replace('-', '');
    const seq = Math.floor(Math.random() * 99999).toString().padStart(5, '0');
    return `${prefix}-${date}-${seq}`;
  }
}
