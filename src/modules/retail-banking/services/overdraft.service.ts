import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RetailOverdraftEvent } from '../entities/retail-overdraft-event.entity';
import { RetailAccountService } from './retail-account.service';

@Injectable()
export class OverdraftService {
  private readonly logger = new Logger(OverdraftService.name);

  constructor(
    @InjectRepository(RetailOverdraftEvent)
    private readonly repo: Repository<RetailOverdraftEvent>,
    private readonly accountService: RetailAccountService,
  ) {}

  async checkTransaction(accountId: string, amount: number): Promise<{
    allowed: boolean;
    overdraftCreated: boolean;
    fee: number;
    newBalance: number;
    overdraftAmount: number;
    protectionRemaining: number;
  }> {
    const account = await this.accountService.findById(accountId);
    const currentBalance = Number(account.availableBalance);
    const overdraftLimit = Number(account.overdraftLimit);
    const overdraftProtection = account.overdraftProtectionEnabled;

    const newBalance = currentBalance - amount;

    if (newBalance >= 0) {
      return { allowed: true, overdraftCreated: false, fee: 0, newBalance, overdraftAmount: 0, protectionRemaining: 0 };
    }

    const overdraftAmount = Math.abs(newBalance);

    if (!overdraftProtection || overdraftAmount > overdraftLimit) {
      await this.createNsfEvent(accountId, amount, currentBalance, newBalance);
      return { allowed: false, overdraftCreated: false, fee: this.calculateNsfFee(), newBalance: currentBalance, overdraftAmount: 0, protectionRemaining: overdraftLimit };
    }

    const fee = this.calculateOverdraftFee(overdraftAmount);
    const remaining = Math.max(0, overdraftLimit - overdraftAmount);

    await this.createOverdraftEvent(accountId, amount, currentBalance, newBalance, overdraftAmount, fee, remaining);
    await this.sendNotification(accountId);

    return { allowed: true, overdraftCreated: true, fee, newBalance, overdraftAmount, protectionRemaining: remaining };
  }

  private calculateOverdraftFee(amount: number): number {
    if (amount <= 0) return 0;
    if (amount <= 50) return 35;
    if (amount <= 100) return 38;
    return 39;
  }

  private calculateNsfFee(): number {
    return 25;
  }

  private async createOverdraftEvent(accountId: string, transactionAmount: number, balanceBefore: number, balanceAfter: number, overdraftAmount: number, fee: number, remaining: number): Promise<void> {
    const event = this.repo.create({
      accountId,
      transactionAmount,
      balanceBefore,
      balanceAfter,
      overdraftAmount,
      overdraftFeeCharged: fee,
      protectionUsed: true,
      protectionRemaining: remaining,
      nsfReturned: false,
      notificationSent: false,
      notificationChannels: ['push', 'email'],
      eventTimestamp: new Date(),
    });
    await this.repo.save(event);
    this.logger.log(`Overdraft event: account=${accountId}, amount=${overdraftAmount}, fee=${fee}`);
  }

  private async createNsfEvent(accountId: string, transactionAmount: number, balanceBefore: number, balanceAfter: number): Promise<void> {
    const event = this.repo.create({
      accountId,
      transactionAmount,
      balanceBefore,
      balanceAfter,
      overdraftAmount: 0,
      overdraftFeeCharged: null,
      protectionUsed: false,
      protectionRemaining: null,
      nsfReturned: true,
      nsfFeeCharged: this.calculateNsfFee(),
      notificationSent: false,
      notificationChannels: ['push', 'email', 'sms'],
      eventTimestamp: new Date(),
    });
    await this.repo.save(event);
    this.logger.warn(`NSF event: account=${accountId}, amount=${transactionAmount}, fee=${event.nsfFeeCharged}`);
  }

  private async sendNotification(accountId: string): Promise<void> {
    const events = await this.repo.find({ where: { accountId }, order: { eventTimestamp: 'DESC' } });
    const recent = events[0];
    if (recent) {
      recent.notificationSent = true;
      await this.repo.save(recent);
      this.logger.log(`Notifications sent for overdraft event to account ${accountId}`);
    }
  }

  async configureOverdraftLimit(accountId: string, limit: number): Promise<void> {
    await this.accountService.configureOverdraft(accountId, limit, true);
    this.logger.log(`Overdraft limit set for ${accountId}: ${limit}`);
  }

  async getOverdraftHistory(accountId: string): Promise<RetailOverdraftEvent[]> {
    return this.repo.find({ where: { accountId }, order: { eventTimestamp: 'DESC' } });
  }

  async getAvailableOverdraft(accountId: string): Promise<{ limit: number; used: number; available: number }> {
    const account = await this.accountService.findById(accountId);
    const limit = Number(account.overdraftLimit);
    const recentEvents = await this.getOverdraftHistory(accountId);
    const used = recentEvents.filter(e => !e.nsfReturned).reduce((sum, e) => sum + (Number(e.overdraftAmount) || 0), 0);
    return { limit, used, available: Math.max(0, limit - used) };
  }
}
