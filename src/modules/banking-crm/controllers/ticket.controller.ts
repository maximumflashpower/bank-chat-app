import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TicketService } from '../services/ticket.service.js';
import { TicketCategory, TicketPriority, TicketStatus } from '../entities/crm-service-ticket.entity.js';

@Controller('api/v1/crm')
@UseGuards(AuthGuard('jwt'))
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  @Post('ticket/create')
  async createTicket(@Body() body: {
    customerId: string;
    category: TicketCategory;
    subjectTitle: string;
    description: string;
    priority?: TicketPriority;
    sourceChannel: string;
    relatedAccountId?: string;
    relatedCardId?: string;
    relatedLoanId?: string;
  }) {
    const result = await this.ticketService.createTicket(body);
    return { created: true, ticketId: result.id, ticketNumber: result.ticketNumber };
  }

  @Get('ticket/:id')
  async getTicket(@Param('id') id: string) {
    return this.ticketService.getTicket(id);
  }

  @Get('tickets/list')
  async listTickets(
    @Query('customerId') customerId?: string,
    @Query('status') status?: TicketStatus,
    @Query('category') category?: TicketCategory,
    @Query('assignedAgentId') assignedAgentId?: string,
  ) {
    return this.ticketService.listTickets({ customerId, status, category, assignedAgentId });
  }

  @Put('ticket/:id/update')
  async updateTicket(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    await this.ticketService.updateTicket(id, body);
    return { updated: true };
  }

  @Put('ticket/:id/resolve')
  async resolveTicket(@Param('id') id: string, @Body() body: { resolutionNotes: string; resolutionCode: string }) {
    await this.ticketService.resolveTicket(id, body.resolutionNotes, body.resolutionCode);
    return { resolved: true };
  }

  @Post('ticket/:id/attachment')
  async attachDocument(@Param('id') id: string, @Body() body: { documentUrl: string; documentName: string }) {
    await this.ticketService.attachDocument(id, body.documentUrl, body.documentName);
    return { attached: true };
  }

  @Get('ticket/:id/sla')
  async checkTicketSla(@Param('id') id: string) {
    return this.ticketService.checkTicketSla(id);
  }

  @Post('ticket/:id/close')
  async closeTicket(@Param('id') id: string) {
    await this.ticketService.closeTicket(id);
    return { closed: true };
  }
}
