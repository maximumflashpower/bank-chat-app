import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SmbInvoiceDocument } from '../entities/smb-invoice-document.entity';
import { PaymentRecordDto } from '../dto/payment-record.dto';
import { ReminderCampaignDto } from '../dto/reminder-campaign.dto';

@Injectable()
export class SmbPaymentService {
  constructor(
    @InjectRepository(SmbInvoiceDocument)
    private invoiceRepo: Repository<SmbInvoiceDocument>,
  ) {}

  async processOnlinePayment(invoiceId: string, amount: number, method: string): Promise<{ success: boolean; transactionId: string }> {
    const invoice = await this.invoiceRepo.findOne({ where: { id: invoiceId } });
    if (!invoice) throw new NotFoundException(`Invoice ${invoiceId} not found`);

    const currentPaid = invoice.paidAmountTotalReceived ?? 0;
    const newPaid = currentPaid + amount;
    const remaining = invoice.grandTotalAmountDue - newPaid;
    const newStatus = remaining <= 0 ? 'full_paid' : 'partial_paid';

    await this.invoiceRepo.update(invoiceId, {
      paidAmountTotalReceived: newPaid,
      remainingBalanceOwed: Math.max(0, remaining),
      status: newStatus,
    });

    return { success: true, transactionId: 'TXN-' + Date.now() };
  }

  async markAsPaid(dto: PaymentRecordDto): Promise<void> {
    const invoice = await this.invoiceRepo.findOne({ where: { id: dto.invoiceId } });
    if (!invoice) throw new NotFoundException(`Invoice ${dto.invoiceId} not found`);

    const currentPaid = invoice.paidAmountTotalReceived ?? 0;
    const newPaid = currentPaid + dto.amountPaid;
    const remaining = invoice.grandTotalAmountDue - newPaid;
    const newStatus = remaining <= 0 ? 'full_paid' : 'partial_paid';

    await this.invoiceRepo.update(dto.invoiceId, {
      paidAmountTotalReceived: newPaid,
      remainingBalanceOwed: Math.max(0, remaining),
      status: newStatus,
    });
  }

  async createReminderCampaign(dto: ReminderCampaignDto): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    for (const invoiceId of dto.invoiceIds) {
      const invoice = await this.invoiceRepo.findOne({ where: { id: invoiceId } });
      if (!invoice) {
        failed++;
        continue;
      }
      sent++;
    }

    return { sent, failed };
  }

  async applyLateFee(invoiceId: string, feeAmount: number): Promise<void> {
    const invoice = await this.invoiceRepo.findOne({ where: { id: invoiceId } });
    if (!invoice) throw new NotFoundException(`Invoice ${invoiceId} not found`);

    const currentLateFee = invoice.lateFeePenaltyCharged ?? 0;
    await this.invoiceRepo.update(invoiceId, {
      lateFeePenaltyCharged: currentLateFee + feeAmount,
      grandTotalAmountDue: invoice.grandTotalAmountDue + feeAmount,
      remainingBalanceOwed: (invoice.remainingBalanceOwed ?? 0) + feeAmount,
    });
  }

  async generatePaymentLink(invoiceId: string): Promise<{ url: string; expiresAt: Date }> {
    const invoice = await this.invoiceRepo.findOne({ where: { id: invoiceId } });
    if (!invoice) throw new NotFoundException(`Invoice ${invoiceId} not found`);

    const token = Math.random().toString(36).substr(2, 16);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    return {
      url: `https://pay.example.com/invoice/${invoiceId}?token=${token}`,
      expiresAt,
    };
  }

  async getInvoicePayments(invoiceId: string): Promise<any> {
    const invoice = await this.invoiceRepo.findOne({ where: { id: invoiceId } });
    if (!invoice) throw new NotFoundException(`Invoice ${invoiceId} not found`);

    return {
      invoiceId,
      totalDue: invoice.grandTotalAmountDue,
      totalPaid: invoice.paidAmountTotalReceived ?? 0,
      remaining: invoice.remainingBalanceOwed ?? 0,
      status: invoice.status,
    };
  }
}
