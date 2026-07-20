import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrmServiceTicket, TicketCategory, TicketPriority, TicketStatus } from '../entities/crm-service-ticket.entity.js';

@Injectable()
export class TicketService {
  constructor(
    @InjectRepository(CrmServiceTicket)
    private repo: Repository<CrmServiceTicket>,
  ) {}

  async createTicket(data: {
    customerId: string;
    category: TicketCategory;
    subjectTitle: string;
    description: string;
    priority?: TicketPriority;
    sourceChannel: string;
    relatedAccountId?: string;
    relatedCardId?: string;
    relatedLoanId?: string;
  }): Promise<CrmServiceTicket> {
    const ticket = new CrmServiceTicket();
    ticket.ticketNumber = `TKT-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(Math.random()*100000)}`;
    ticket.customerId = data.customerId;
    ticket.category = data.category;
    ticket.subjectTitle = data.subjectTitle;
    ticket.description = data.description;
    ticket.priority = data.priority || TicketPriority.NORMAL;
    ticket.sourceChannel = data.sourceChannel;
    ticket.status = TicketStatus.OPEN;
    ticket.slaDeadline = new Date(Date.now() + 48 * 60 * 60 * 1000);
    if (data.relatedAccountId) ticket.relatedAccountId = data.relatedAccountId;
    if (data.relatedCardId) ticket.relatedCardId = data.relatedCardId;
    if (data.relatedLoanId) ticket.relatedLoanId = data.relatedLoanId;
    return this.repo.save(ticket);
  }

  async getTicket(id: string): Promise<CrmServiceTicket> {
    const ticket = await this.repo.findOne({ where: { id } });
    if (!ticket) throw new NotFoundException(`Ticket ${id} not found`);
    return ticket;
  }

  async updateTicket(id: string, data: Partial<CrmServiceTicket>): Promise<void> {
    await this.repo.update({ id }, data as any);
  }

  async resolveTicket(id: string, resolutionNotes: string, resolutionCode: string): Promise<void> {
    await this.repo.update({ id }, {
      status: TicketStatus.RESOLVED,
      resolutionNotes,
      resolutionCode,
      resolvedAt: new Date(),
    } as any);
  }

  async closeTicket(id: string): Promise<void> {
    await this.repo.update({ id }, {
      status: TicketStatus.CLOSED,
      closedAt: new Date(),
    } as any);
  }

  async listTickets(filters?: {
    customerId?: string;
    status?: TicketStatus;
    category?: TicketCategory;
    assignedAgentId?: string;
  }): Promise<CrmServiceTicket[]> {
    const where: any = {};
    if (filters?.customerId) where.customerId = filters.customerId;
    if (filters?.status) where.status = filters.status;
    if (filters?.category) where.category = filters.category;
    if (filters?.assignedAgentId) where.assignedAgentId = filters.assignedAgentId;
    return this.repo.find({ where, order: { createdAt: 'DESC' } });
  }

  async attachDocument(id: string, documentUrl: string, documentName: string): Promise<void> {
    const ticket = await this.getTicket(id);
    const docs = ticket.attachedDocuments || { files: [] };
    (docs as any).files.push({ url: documentUrl, name: documentName, uploadedAt: new Date() });
    await this.repo.update({ id }, { attachedDocuments: docs } as any);
  }

  async checkTicketSla(id: string): Promise<{ breached: boolean; deadline: Date; remainingMinutes: number }> {
    const ticket = await this.getTicket(id);
    const now = new Date();
    const deadline = ticket.slaDeadline || new Date();
    const remaining = Math.round((deadline.getTime() - now.getTime()) / 60000);
    return { breached: remaining < 0, deadline, remainingMinutes: remaining };
  }
}
