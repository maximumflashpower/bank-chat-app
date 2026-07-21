import { Controller, Post, Get, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiIntegrationService, WebhookRegistration } from '../services/api-integration.service.js';

@Controller('api/v1/api-integration')
@UseGuards(AuthGuard('jwt'))
export class ApiIntegrationController {
  constructor(private readonly apiService: ApiIntegrationService) {}

  @Get('credentials')
  async getApiCredentials(@Query('partnerId') partnerId: string) {
    return this.apiService.getApiCredentials(partnerId);
  }

  @Post('tokenize')
  async tokenizePayment(@Body() body: {
    cardNumber?: string;
    bankAccount?: string;
    walletRef?: string;
  }) {
    return this.apiService.tokenizePaymentData(body);
  }

  @Post('webhook/register')
  async registerWebhook(@Body() body: { url: string; events: string[] }): Promise<WebhookRegistration> {
    return this.apiService.registerWebhook(body);
  }

  @Get('webhooks')
  async listWebhooks() {
    return this.apiService.getWebhooks();
  }

  @Delete('webhook/:id')
  async deleteWebhook(@Param('id') id: string) {
    return this.apiService.deleteWebhook(id);
  }

  @Post('webhook/dispatch')
  async dispatchWebhook(@Body() body: { eventType: string; payload: Record<string, unknown> }) {
    return this.apiService.dispatchWebhookEvent(body);
  }

  @Get('events/log')
  async getEventLogs(@Query('webhookId') webhookId?: string, @Query('eventType') eventType?: string) {
    return this.apiService.getEventLogs({ webhookId, eventType });
  }

  @Get('analytics/dashboard')
  async getAnalytics(@Query('organizationId') organizationId: string) {
    return this.apiService.getAnalyticsDashboard(organizationId);
  }
}
