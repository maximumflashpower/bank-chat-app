import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { WebhookService } from '../services/webhook.service';
import { CreateWebhookDto } from '../dto/create-webhook.dto';
import { TriggerWebhookDto } from '../dto/trigger-webhook.dto';

@ApiTags('Webhooks')
@Controller('v1/webhooks')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post('register')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Register webhook subscription' })
  @ApiResponse({ status: 201, description: 'Webhook registered' })
  async register(@Request() req: any, @Body() dto: CreateWebhookDto) {
    return this.webhookService.createWebhook(req.user?.id || 'default-tenant', dto);
  }

  @Get('list')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List active webhooks' })
  @ApiResponse({ status: 200, description: 'Webhook list' })
  async list(@Request() req: any) {
    return this.webhookService.listWebhooks(req.user?.id || 'default-tenant');
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete webhook subscription' })
  @ApiResponse({ status: 200, description: 'Deleted' })
  async delete(@Param('id') id: string, @Request() req: any) {
    await this.webhookService.deleteWebhook(id, req.user?.id || 'default-tenant');
    return { deleted: true };
  }

  @Post(':id/test')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send test payload to webhook' })
  @ApiResponse({ status: 200, description: 'Test sent' })
  async test(@Param('id') id: string, @Body() payload: Record<string, unknown>) {
    return this.webhookService.sendTestPayload(id, payload);
  }

  @Get(':id/logs')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get delivery logs for webhook' })
  @ApiResponse({ status: 200, description: 'Delivery history' })
  async logs(@Param('id') id: string) {
    return this.webhookService.getDeliveryLogs(id);
  }

  @Post('replay/:eventId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Replay event from dead letter queue' })
  @ApiResponse({ status: 200, description: 'Replay initiated' })
  async replay(@Param('eventId') eventId: string) {
    await this.webhookService.replayFromDeadLetter(eventId);
    return { replayed: true };
  }
}
