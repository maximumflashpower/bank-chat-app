import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RetailAccountAlert, AlertType, ThresholdComparison } from '../entities/retail-account-alert.entity';

@Injectable()
export class AlertService {
  private readonly logger = new Logger(AlertService.name);

  constructor(
    @InjectRepository(RetailAccountAlert)
    private readonly repo: Repository<RetailAccountAlert>,
  ) {}

  async createAlert(data: Partial<RetailAccountAlert>): Promise<RetailAccountAlert> {
    const alert = this.repo.create({
      ...data,
      isActive: true,
      triggerCount: 0,
      createdAt: new Date(),
    });
    const saved = await this.repo.save(alert);
    this.logger.log(`Alert created: ${alert.alertType} for account ${alert.accountId}`);
    return saved;
  }

  async findById(id: string): Promise<RetailAccountAlert> {
    const alert = await this.repo.findOne({ where: { id } });
    if (!alert) throw new Error(`Alert ${id} not found`);
    return alert;
  }

  async findByAccount(accountId: string): Promise<RetailAccountAlert[]> {
    return this.repo.find({ where: { accountId }, order: { createdAt: 'DESC' } });
  }

  async findByUser(userId: string): Promise<RetailAccountAlert[]> {
    return this.repo.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }

  async deleteAlert(id: string): Promise<void> {
    await this.repo.delete(id);
    this.logger.log(`Alert deleted: ${id}`);
  }

  async toggleAlert(id: string): Promise<RetailAccountAlert> {
    const alert = await this.findById(id);
    alert.isActive = !alert.isActive;
    return this.repo.save(alert);
  }

  async checkLowBalance(accountId: string, threshold: number): Promise<RetailAccountAlert | null> {
    const alerts = await this.findByAccount(accountId);
    const lowBalanceAlert = alerts.find(a => a.alertType === AlertType.LOW_BALANCE && a.isActive && a.thresholdAmount && a.thresholdComparison === ThresholdComparison.BELOW);
    if (lowBalanceAlert && threshold < Number(lowBalanceAlert.thresholdAmount)) {
      await this.triggerAlert(lowBalanceAlert);
      return lowBalanceAlert;
    }
    return null;
  }

  async checkLargeTransaction(accountId: string, amount: number): Promise<RetailAccountAlert | null> {
    const alerts = await this.findByAccount(accountId);
    const largeTxAlert = alerts.find(a => a.alertType === AlertType.LARGE_TRANSACTION && a.isActive && a.thresholdAmount && a.thresholdComparison === ThresholdComparison.ABOVE);
    if (largeTxAlert && amount > Number(largeTxAlert.thresholdAmount)) {
      await this.triggerAlert(largeTxAlert);
      return largeTxAlert;
    }
    return null;
  }

  async triggerAlert(alert: RetailAccountAlert): Promise<RetailAccountAlert> {
    alert.triggerCount = alert.triggerCount + 1;
    alert.lastTriggeredAt = new Date();
    await this.repo.save(alert);
    this.logger.log(`Alert triggered: ${alert.id}, type=${alert.alertType}, count=${alert.triggerCount}`);
    return alert;
  }
}
