import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SmbInvoiceDocument } from '../entities/smb-invoice-document.entity';
import { SmbContactParty } from '../entities/smb-contact-party.entity';

@Injectable()
export class SmbReceivableService {
  constructor(
    @InjectRepository(SmbInvoiceDocument)
    private invoiceRepo: Repository<SmbInvoiceDocument>,
    @InjectRepository(SmbContactParty)
    private contactRepo: Repository<SmbContactParty>,
  ) {}

  async getAgingReport(): Promise<any> {
    const invoices = await this.invoiceRepo.find({
      where: [{ status: 'issued' }, { status: 'partial_paid' }],
    });
    const today = new Date();

    const buckets = { current: 0, '1_30': 0, '31_60': 0, '61_90': 0, '90_plus': 0 };

    for (const inv of invoices) {
      const remaining = inv.remainingBalanceOwed ?? 0;
      const diffDays = Math.floor((today.getTime() - inv.dueDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays <= 0) buckets.current += remaining;
      else if (diffDays <= 30) buckets['1_30'] += remaining;
      else if (diffDays <= 60) buckets['31_60'] += remaining;
      else if (diffDays <= 90) buckets['61_90'] += remaining;
      else buckets['90_plus'] += remaining;
    }

    return { buckets, totalOutstanding: Object.values(buckets).reduce((a, b) => a + b, 0) };
  }

  async getDSO(): Promise<{ dso: number; totalReceivables: number; averageDailySales: number }> {
    const invoices = await this.invoiceRepo.find({
      where: [{ status: 'issued' }, { status: 'partial_paid' }, { status: 'full_paid' }],
    });

    const totalReceivables = invoices.reduce((sum, inv) => sum + (inv.remainingBalanceOwed ?? 0), 0);
    const totalSales = invoices.reduce((sum, inv) => sum + inv.grandTotalAmountDue, 0);
    const avgDailySales = totalSales / 30;

    return {
      dso: avgDailySales > 0 ? Math.round(totalReceivables / avgDailySales) : 0,
      totalReceivables,
      averageDailySales: avgDailySales,
    };
  }

  async manageCreditLimit(customerId: string, newLimit: number): Promise<void> {
    await this.contactRepo.update(customerId, { creditLimitAssigned: newLimit });
  }

  async getCustomerStatement(customerId: string): Promise<any> {
    const invoices = await this.invoiceRepo.find({ where: { customerId } });
    const customer = await this.contactRepo.findOne({ where: { id: customerId } });

    return {
      customer,
      openingBalance: 0,
      closingBalance: invoices.reduce((sum, inv) => sum + (inv.remainingBalanceOwed ?? 0), 0),
      transactions: invoices.map(inv => ({
        date: inv.issueDate,
        invoiceNumber: inv.invoiceNumber,
        type: 'invoice',
        amount: inv.grandTotalAmountDue,
        balance: inv.remainingBalanceOwed,
        status: inv.status,
      })),
    };
  }

  async writeOffBadDebt(invoiceId: string, reason: string): Promise<void> {
    await this.invoiceRepo.update(invoiceId, {
      status: 'written_off',
      remainingBalanceOwed: 0,
    });
  }
}
