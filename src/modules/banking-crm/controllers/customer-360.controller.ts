import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Customer360Service } from '../services/customer-360.service.js';

@Controller('v1/crm')
@UseGuards(AuthGuard('jwt'))
export class Customer360Controller {
  constructor(private readonly customer360Service: Customer360Service) {}

  @Get('customer-360/:customerId')
  async getCustomer360(@Param('customerId') customerId: string) {
    return this.customer360Service.getCustomer360Profile(customerId);
  }

  @Get('customer/:customerId/products')
  async getProducts(@Param('customerId') customerId: string) {
    return this.customer360Service.getCustomerProducts(customerId);
  }

  @Get('customer/:customerId/interactions')
  async getInteractions(@Param('customerId') customerId: string) {
    return this.customer360Service.getInteractionHistory(customerId);
  }

  @Get('customer/:customerId/transactions/recent')
  async getRecentTransactions(@Param('customerId') customerId: string) {
    return this.customer360Service.getRecentTransactions(customerId);
  }

  @Get('customer/:customerId/segmentation')
  async getSegmentation(@Param('customerId') customerId: string) {
    return this.customer360Service.getSegmentation(customerId);
  }

  @Get('customer/:customerId/alerts')
  async getAlerts(@Param('customerId') customerId: string) {
    return this.customer360Service.getAlerts(customerId);
  }

  @Post('customer/:customerId/note')
  async addNote(@Param('customerId') customerId: string, @Body() body: { note: string; authorId: string }) {
    await this.customer360Service.addNote(customerId, body.note, body.authorId);
    return { added: true };
  }

  @Post('customer/:customerId/flag')
  async setFlag(@Param('customerId') customerId: string, @Body() body: { flagType: 'vip' | 'compliance_risk'; value: boolean | string }) {
    await this.customer360Service.setFlag(customerId, body.flagType, body.value);
    return { updated: true };
  }

  @Put('customer/:customerId/relationship-manager')
  async assignRm(@Param('customerId') customerId: string, @Body() body: { managerId: string }) {
    await this.customer360Service.assignRelationshipManager(customerId, body.managerId);
    return { assigned: true };
  }
}
