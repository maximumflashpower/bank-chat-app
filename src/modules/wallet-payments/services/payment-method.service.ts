import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentMethodSource, PaymentType, VerificationStatus } from '../entities/payment-method-source.entity.js';

@Injectable()
export class PaymentMethodService {
  constructor(
    @InjectRepository(PaymentMethodSource)
    private methodRepo: Repository<PaymentMethodSource>,
  ) {}

  // Add new payment method
  async addMethod(data: {
    customerId: string;
    paymentType: PaymentType;
    paymentSubtype?: string;
    sourceBankAccountId?: string;
    sourceCardId?: string;
    sourceExternalWalletRef?: string;
    labelNameDisplay?: string;
    currencySupported?: string;
    dailySpendLimit?: number;
    weeklySpendLimit?: number;
    monthlySpendLimit?: number;
  }): Promise<PaymentMethodSource> {
    const method = new PaymentMethodSource();
    method.customerId = data.customerId;
    method.paymentType = data.paymentType;
    if (data.paymentSubtype) method.paymentSubtype = data.paymentSubtype;
    if (data.sourceBankAccountId) method.sourceBankAccountId = data.sourceBankAccountId;
    if (data.sourceCardId) method.sourceCardId = data.sourceCardId;
    if (data.sourceExternalWalletRef) method.sourceExternalWalletRef = data.sourceExternalWalletRef;
    if (data.labelNameDisplay) method.labelNameDisplay = data.labelNameDisplay;
    if (data.currencySupported) method.currencySupported = data.currencySupported;
    method.isPrimaryDefault = false;
    method.verificationStatus = VerificationStatus.PENDING;
    if (data.dailySpendLimit) method.dailySpendLimit = data.dailySpendLimit;
    if (data.weeklySpendLimit) method.weeklySpendLimit = data.weeklySpendLimit;
    if (data.monthlySpendLimit) method.monthlySpendLimit = data.monthlySpendLimit;
    return this.methodRepo.save(method);
  }

  // Set primary payment method
  async setPrimary(methodId: string): Promise<PaymentMethodSource> {
    const method = await this.methodRepo.findOneOrFail({ where: { id: methodId } });
    
    // Unset current primary if exists
    const currentPrimaries = await this.methodRepo.find({
      where: { customerId: method.customerId, isPrimaryDefault: true },
    });
    for (const pm of currentPrimaries) {
      pm.isPrimaryDefault = false;
      await this.methodRepo.save(pm);
    }
    
    method.isPrimaryDefault = true;
    return this.methodRepo.save(method);
  }

  // Remove payment method
  async removeMethod(methodId: string): Promise<void> {
    const method = await this.methodRepo.findOneOrFail({ where: { id: methodId } });
    method.isActive = false;
    await this.methodRepo.save(method);
  }

  // Get customer payment methods
  async getMethodsByCustomer(customerId: string): Promise<PaymentMethodSource[]> {
    return this.methodRepo.find({
      where: { customerId, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  // Verify payment method via micro-deposits
  async verifyWithMicrodeposit(methodId: string, verified: boolean): Promise<PaymentMethodSource> {
    const method = await this.methodRepo.findOneOrFail({ where: { id: methodId } });
    method.verificationStatus = verified ? VerificationStatus.VERIFIED : VerificationStatus.PENDING;
    if (verified) method.micropaymentVerifiedAt = new Date();
    return this.methodRepo.save(method);
  }

  // Update spending limits
  async updateSpendLimits(methodId: string, limits: {
    dailySpendLimit?: number;
    weeklySpendLimit?: number;
    monthlySpendLimit?: number;
  }): Promise<PaymentMethodSource> {
    const method = await this.methodRepo.findOneOrFail({ where: { id: methodId } });
    if (limits.dailySpendLimit !== undefined) method.dailySpendLimit = limits.dailySpendLimit;
    if (limits.weeklySpendLimit !== undefined) method.weeklySpendLimit = limits.weeklySpendLimit;
    if (limits.monthlySpendLimit !== undefined) method.monthlySpendLimit = limits.monthlySpendLimit;
    return this.methodRepo.save(method);
  }

  // Mark as used
  async markAsUsed(methodId: string): Promise<PaymentMethodSource> {
    const method = await this.methodRepo.findOneOrFail({ where: { id: methodId } });
    method.lastUsedAt = new Date();
    return this.methodRepo.save(method);
  }
}
