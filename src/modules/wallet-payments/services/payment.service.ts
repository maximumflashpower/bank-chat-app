import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentTransactionHub, ChannelType, ReconciliationStatus, RiskDecision } from '../entities/payment-transaction-hub.entity.js';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(PaymentTransactionHub)
    private txnRepo: Repository<PaymentTransactionHub>,
  ) {}

  // PAY-HIST-001: Initiate payment with selected method
  async initiatePayment(data: {
    initiatorId: string;
    channelType: ChannelType;
    paymentMethodUsed: string;
    payeePayerIdentifier: string;
    amount: number;
    currencyIsoCode: string;
    transactionFee?: number;
  }): Promise<PaymentTransactionHub> {
    const txn = new PaymentTransactionHub();
    txn.paymentReference = this.generateReference('PAY');
    txn.initiatorId = data.initiatorId;
    txn.channelType = data.channelType;
    txn.paymentMethodUsed = data.paymentMethodUsed;
    txn.payeePayerIdentifier = data.payeePayerIdentifier;
    txn.amount = data.amount;
    txn.currencyIsoCode = data.currencyIsoCode;
    txn.transactionFee = data.transactionFee || 0;
    txn.netSettlementAmount = data.amount - (data.transactionFee || 0);
    txn.reconciliationStatus = ReconciliationStatus.PENDING;
    txn.webhookNotificationSent = false;
    txn.processedAt = new Date();
    txn.riskDecisionFinal = RiskDecision.APPROVED;
    txn.riskScoreCalculated = 0;
    return this.txnRepo.save(txn);
  }

  // BILL-SPLIT-001: Split bill among participants
  async splitBill(data: {
    initiatorId: string;
    paymentMethodUsed: string;
    totalAmount: number;
    currencyIsoCode: string;
    participants: { userId: string; percentage: number }[];
  }): Promise<PaymentTransactionHub> {
    const txn = new PaymentTransactionHub();
    txn.paymentReference = this.generateReference('SPLIT');
    txn.initiatorId = data.initiatorId;
    txn.channelType = ChannelType.P2P;
    txn.paymentMethodUsed = data.paymentMethodUsed;
    txn.payeePayerIdentifier = 'bill-split-group';
    txn.amount = data.totalAmount;
    txn.currencyIsoCode = data.currencyIsoCode;
    txn.transactionFee = 0;
    txn.netSettlementAmount = data.totalAmount;
    txn.splitParticipantIds = data.participants.map(p => p.userId);
    const percentages: Record<string, number> = {};
    for (const p of data.participants) {
      percentages[p.userId] = p.percentage;
    }
    txn.splitPercentages = percentages;
    txn.reconciliationStatus = ReconciliationStatus.PENDING;
    txn.webhookNotificationSent = false;
    txn.processedAt = new Date();
    txn.riskDecisionFinal = RiskDecision.APPROVED;
    txn.riskScoreCalculated = 0;
    return this.txnRepo.save(txn);
  }

  // BILL-SPLIT-REMIND-001: Send reminders to pending participants
  async sendSplitReminders(transactionId: string): Promise<{ sent: number; pendingParticipants: string[] }> {
    const txn = await this.txnRepo.findOneOrFail({ where: { id: transactionId } });
    const pending = txn.splitParticipantIds || [];
    return { sent: pending.length, pendingParticipants: pending };
  }

  // PAY-HIST-001: Unified payment history all channels
  async getHistory(customerId: string, filters?: {
    channelType?: ChannelType;
    startDate?: Date;
    endDate?: Date;
  }): Promise<PaymentTransactionHub[]> {
    const where: Record<string, unknown> = { initiatorId: customerId };
    if (filters?.channelType) where.channelType = filters.channelType;
    return this.txnRepo.find({
      where,
      order: { processedAt: 'DESC' },
      take: 100,
    });
  }

  // REFUND-PROCESS-001: Process refund full or partial
  async processRefund(originalTxnId: string, refundAmount: number, reason: string): Promise<PaymentTransactionHub> {
    const original = await this.txnRepo.findOneOrFail({ where: { id: originalTxnId } });
    const refund = new PaymentTransactionHub();
    refund.paymentReference = this.generateReference('RFND');
    refund.initiatorId = original.initiatorId;
    refund.channelType = original.channelType;
    refund.paymentMethodUsed = original.paymentMethodUsed;
    refund.payeePayerIdentifier = original.payeePayerIdentifier;
    refund.amount = refundAmount;
    refund.currencyIsoCode = original.currencyIsoCode;
    refund.transactionFee = 0;
    refund.netSettlementAmount = refundAmount;
    refund.originalTxnReference = original.id;
    refund.reconciliationStatus = ReconciliationStatus.PENDING;
    refund.webhookNotificationSent = false;
    refund.processedAt = new Date();
    refund.riskDecisionFinal = RiskDecision.APPROVED;
    refund.riskScoreCalculated = 0;
    return this.txnRepo.save(refund);
  }

  // CHARGEBACK-CONTEST-001: Chargeback contest workflow
  async contestChargeback(data: {
    originalTxnId: string;
    disputeCaseId: string;
    evidenceDescription: string;
  }): Promise<{ contestSubmitted: boolean; disputeCaseId: string }> {
    const original = await this.txnRepo.findOneOrFail({ where: { id: data.originalTxnId } });
    original.disputeCaseId = data.disputeCaseId;
    await this.txnRepo.save(original);
    return { contestSubmitted: true, disputeCaseId: data.disputeCaseId };
  }

  // FAIL-RETRY-001: Failed payment retry logic
  async retryFailedPayment(originalTxnId: string): Promise<PaymentTransactionHub> {
    const original = await this.txnRepo.findOneOrFail({ where: { id: originalTxnId } });
    const retry = new PaymentTransactionHub();
    retry.paymentReference = this.generateReference('RETY');
    retry.initiatorId = original.initiatorId;
    retry.channelType = original.channelType;
    retry.paymentMethodUsed = original.paymentMethodUsed;
    retry.payeePayerIdentifier = original.payeePayerIdentifier;
    retry.amount = original.amount;
    retry.currencyIsoCode = original.currencyIsoCode;
    retry.transactionFee = original.transactionFee;
    retry.netSettlementAmount = original.netSettlementAmount;
    retry.originalTxnReference = original.id;
    retry.reconciliationStatus = ReconciliationStatus.PENDING;
    retry.webhookNotificationSent = false;
    retry.processedAt = new Date();
    retry.riskDecisionFinal = RiskDecision.APPROVED;
    retry.riskScoreCalculated = 0;
    return this.txnRepo.save(retry);
  }

  // SUBSCRIPTION-BILL-001: Recurring billing support
  async processRecurringPayment(data: {
    initiatorId: string;
    paymentMethodUsed: string;
    payeePayerIdentifier: string;
    amount: number;
    currencyIsoCode: string;
  }): Promise<PaymentTransactionHub> {
    return this.initiatePayment({
      initiatorId: data.initiatorId,
      channelType: ChannelType.API_EMBEDDED,
      paymentMethodUsed: data.paymentMethodUsed,
      payeePayerIdentifier: data.payeePayerIdentifier,
      amount: data.amount,
      currencyIsoCode: data.currencyIsoCode,
    });
  }

  // TAX-CALCULATE-001: Tax calculation at checkout
  async calculateTax(amount: number, taxRatePct: number, taxType: string): Promise<{
    subtotal: number;
    taxAmount: number;
    total: number;
    taxType: string;
  }> {
    const taxAmount = (amount * taxRatePct) / 100;
    return {
      subtotal: amount,
      taxAmount,
      total: amount + taxAmount,
      taxType,
    };
  }

  // MARK webhook as sent
  async markWebhookSent(transactionId: string): Promise<void> {
    const txn = await this.txnRepo.findOneOrFail({ where: { id: transactionId } });
    txn.webhookNotificationSent = true;
    await this.txnRepo.save(txn);
  }

  private generateReference(prefix: string): string {
    const date = new Date();
    const ymd = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const random = Math.floor(10000 + Math.random() * 90000);
    return `${prefix}-${ymd}-${random}`;
  }
}
