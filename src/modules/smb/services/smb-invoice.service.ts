import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { SmbInvoiceDocument } from '../entities/smb-invoice-document.entity';
import { SmbContactParty } from '../entities/smb-contact-party.entity';
import { CreateInvoiceDto } from '../dto/create-invoice.dto';

@Injectable()
export class SmbInvoiceService {
  constructor(
    @InjectRepository(SmbInvoiceDocument)
    private invoiceRepo: Repository<SmbInvoiceDocument>,
    @InjectRepository(SmbContactParty)
    private contactRepo: Repository<SmbContactParty>,
  ) {}

  async create(dto: CreateInvoiceDto): Promise<SmbInvoiceDocument> {
    const customer = await this.contactRepo.findOne({ where: { id: dto.customerId } });
    if (!customer) throw new NotFoundException(`Customer ${dto.customerId} not found`);

    const invoiceNumber = await this.generateInvoiceNumber();
    const invoice = this.invoiceRepo.create({
      ...dto,
      invoiceNumber,
      issueDate: new Date(dto.issueDate),
      dueDate: new Date(dto.dueDate),
      status: 'draft',
      paidAmountTotalReceived: 0,
      remainingBalanceOwed: dto.grandTotalAmountDue,
    });
    const saved = await this.invoiceRepo.save(invoice);

    await this.contactRepo.update(dto.customerId, { lastInvoiceDate: new Date(dto.issueDate) });

    return saved;
  }

  async findById(id: string): Promise<SmbInvoiceDocument | null> {
    return this.invoiceRepo.findOne({ where: { id } });
  }

  async findAll(filters?: { status?: string; customerId?: string }): Promise<SmbInvoiceDocument[]> {
    const qb = this.invoiceRepo.createQueryBuilder('inv');
    if (filters?.status) qb.andWhere('inv.status = :status', { status: filters.status });
    if (filters?.customerId) qb.andWhere('inv.customerId = :customerId', { customerId: filters.customerId });
    return qb.orderBy('inv.createdAt', 'DESC').getMany();
  }

  async send(id: string): Promise<void> {
    const invoice = await this.findById(id);
    if (!invoice) throw new NotFoundException(`Invoice ${id} not found`);
    await this.invoiceRepo.update(id, {
      status: 'issued',
      sentAt: new Date(),
    });
  }

  async recordView(id: string): Promise<void> {
    const invoice = await this.findById(id);
    if (!invoice) throw new NotFoundException(`Invoice ${id} not found`);
    await this.invoiceRepo.update(id, { viewTrackingCount: (invoice.viewTrackingCount ?? 0) + 1 });
  }

  async markAsPaid(id: string, amount: number, paymentMethod?: string): Promise<SmbInvoiceDocument> {
    const invoice = await this.findById(id);
    if (!invoice) throw new NotFoundException(`Invoice ${id} not found`);

    const currentPaid = invoice.paidAmountTotalReceived ?? 0;
    const newPaid = currentPaid + amount;
    const remaining = invoice.grandTotalAmountDue - newPaid;
    const newStatus = remaining <= 0 ? 'full_paid' : 'partial_paid';

    await this.invoiceRepo.update(id, {
      paidAmountTotalReceived: newPaid,
      remainingBalanceOwed: Math.max(0, remaining),
      status: newStatus,
    });

    return (await this.findById(id))!;
  }

  async findOverdue(): Promise<SmbInvoiceDocument[]> {
    const today = new Date();
    return this.invoiceRepo.find({
      where: {
        status: 'issued',
        dueDate: LessThanOrEqual(today),
      },
    });
  }

  async createRecurring(parentInvoiceId: string, interval: string): Promise<SmbInvoiceDocument> {
    const parent = await this.findById(parentInvoiceId);
    if (!parent) throw new NotFoundException(`Invoice ${parentInvoiceId} not found`);

    const newInvoice = this.invoiceRepo.create({
      ...parent,
      id: undefined,
      invoiceNumber: await this.generateInvoiceNumber(),
      issueDate: new Date(),
      status: 'draft',
      paidAmountTotalReceived: 0,
      remainingBalanceOwed: parent.grandTotalAmountDue,
    });
    return this.invoiceRepo.save(newInvoice);
  }

  async createEstimate(dto: CreateInvoiceDto): Promise<SmbInvoiceDocument> {
    const estimate = this.invoiceRepo.create({
      ...dto,
      invoiceNumber: 'EST-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
      issueDate: new Date(dto.issueDate),
      dueDate: new Date(dto.dueDate),
      status: 'estimate',
      paidAmountTotalReceived: 0,
      remainingBalanceOwed: dto.grandTotalAmountDue,
    });
    return this.invoiceRepo.save(estimate);
  }

  async convertEstimateToInvoice(estimateId: string): Promise<SmbInvoiceDocument> {
    const estimate = await this.findById(estimateId);
    if (!estimate) throw new NotFoundException(`Estimate ${estimateId} not found`);

    const newNumber = await this.generateInvoiceNumber();
    await this.invoiceRepo.update(estimateId, {
      status: 'draft',
      invoiceNumber: newNumber,
    });
    return (await this.findById(estimateId))!;
  }

  async createCreditNote(invoiceId: string, amount: number, reason: string): Promise<SmbInvoiceDocument> {
    const original = await this.findById(invoiceId);
    if (!original) throw new NotFoundException(`Invoice ${invoiceId} not found`);

    const creditNote = this.invoiceRepo.create({
      invoiceNumber: 'CN-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
      customerId: original.customerId,
      issueDate: new Date(),
      dueDate: new Date(),
      subtotalNetAmount: -amount,
      taxableBaseAmount: -amount,
      taxAmountCalculated: 0,
      grandTotalAmountDue: -amount,
      currencyIsoCode: original.currencyIsoCode,
      status: 'credit_note',
      createdByUserId: original.createdByUserId,
    });
    return this.invoiceRepo.save(creditNote);
  }

  async generateStatement(customerId: string): Promise<any> {
    const invoices = await this.invoiceRepo.find({ where: { customerId } });
    const balance = invoices.reduce((sum, inv) => sum + (inv.remainingBalanceOwed ?? 0), 0);

    return {
      customerId,
      totalOutstanding: balance,
      invoiceCount: invoices.length,
      invoices: invoices.map(inv => ({
        invoiceNumber: inv.invoiceNumber,
        status: inv.status,
        amountDue: inv.grandTotalAmountDue,
        remaining: inv.remainingBalanceOwed,
      })),
    };
  }

  private async generateInvoiceNumber(): Promise<string> {
    const now = new Date();
    const yyyy = now.getFullYear();
    const seq = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    return `INV-${yyyy}-${seq}`;
  }
}
