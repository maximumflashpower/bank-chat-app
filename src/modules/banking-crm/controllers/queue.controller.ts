import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { QueueService } from '../services/queue.service.js';
import { QueueChannelOrigin, QueueInteractionType, QueuePriorityLevel, QueueStatus } from '../entities/crm-omnichannel-queue.entity.js';

@Controller('api/v1/crm/queue')
@UseGuards(AuthGuard('jwt'))
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Post('enqueue')
  async enqueue(@Body() body: {
    interactionId: string;
    customerId: string;
    channelOrigin: QueueChannelOrigin;
    interactionType: QueueInteractionType;
    priorityLevel?: QueuePriorityLevel;
    skillRequired?: string;
    languageRequired?: string;
  }) {
    const result = await this.queueService.enqueue(body);
    return { queued: true, queueItemId: result.id };
  }

  @Post('assign')
  async assignAgent(@Body() body: { queueItemId: string; agentId: string }) {
    await this.queueService.assignAgent(body.queueItemId, body.agentId);
    return { assigned: true };
  }

  @Get('omnichannel')
  async getQueuedItems(
    @Query('channel') channel?: QueueChannelOrigin,
    @Query('skill') skill?: string,
    @Query('status') status?: QueueStatus,
  ) {
    return this.queueService.getQueuedItems({ channel, skill, status });
  }

  @Get('sla-dashboard')
  async getSlaDashboard() {
    return this.queueService.getSlaDashboard();
  }

  @Post(':id/escalate')
  async escalate(@Param('id') id: string, @Body() body: { reason: string }) {
    await this.queueService.escalateToSupervisor(id, body.reason);
    return { escalated: true };
  }

  @Post(':id/resolve')
  async resolve(@Param('id') id: string) {
    await this.queueService.resolve(id);
    return { resolved: true };
  }

  @Get('sla-breaches')
  async checkSlaBreaches() {
    return this.queueService.checkSlaBreaches();
  }

  @Post('workload-balance')
  async balanceWorkload() {
    return this.queueService.balanceWorkload();
  }

  @Get('volume-spike')
  async detectVolumeSpike() {
    return this.queueService.detectVolumeSpike();
  }

  @Get('vip-check/:customerId')
  async checkVipPriority(@Param('customerId') customerId: string) {
    return this.queueService.checkVipPriority(customerId);
  }
}
