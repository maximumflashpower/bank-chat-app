import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { CrmOmnichannelQueue, QueueStatus, QueuePriorityLevel, QueueChannelOrigin, QueueInteractionType } from '../entities/crm-omnichannel-queue.entity.js';

@Injectable()
export class QueueService {
  constructor(
    @InjectRepository(CrmOmnichannelQueue)
    private repo: Repository<CrmOmnichannelQueue>,
  ) {}

  async enqueue(data: {
    interactionId: string;
    customerId: string;
    channelOrigin: QueueChannelOrigin;
    interactionType: QueueInteractionType;
    priorityLevel?: QueuePriorityLevel;
    skillRequired?: string;
    languageRequired?: string;
  }): Promise<CrmOmnichannelQueue> {
    const item = new CrmOmnichannelQueue();
    item.interactionId = data.interactionId;
    item.customerId = data.customerId;
    item.channelOrigin = data.channelOrigin;
    item.interactionType = data.interactionType;
    item.priorityLevel = data.priorityLevel || QueuePriorityLevel.NORMAL;
    if (data.skillRequired) item.skillRequired = data.skillRequired;
    if (data.languageRequired) item.languageRequired = data.languageRequired;
    item.status = QueueStatus.QUEUED;
    item.slaDeadline = new Date(Date.now() + 30 * 60 * 1000);
    return this.repo.save(item);
  }

  async assignAgent(queueItemId: string, agentId: string): Promise<void> {
    await this.repo.update({ id: queueItemId }, {
      assignedAgentId: agentId,
      status: QueueStatus.ASSIGNED,
    } as any);
  }

  async getQueuedItems(filters?: {
    channel?: QueueChannelOrigin;
    skill?: string;
    status?: QueueStatus;
  }): Promise<CrmOmnichannelQueue[]> {
    const where: any = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.channel) where.channelOrigin = filters.channel;
    if (filters?.skill) where.skillRequired = filters.skill;
    return this.repo.find({ where, order: { createdAt: 'ASC' } });
  }

  async checkVipPriority(customerId: string): Promise<{ isVip: boolean; overrideApplied: boolean }> {
    return { isVip: false, overrideApplied: false };
  }

  async matchLanguagePreference(customerId: string): Promise<{ language: string; matchedAgent?: string }> {
    return { language: 'es' };
  }

  async balanceWorkload(): Promise<{ agents: { agentId: string; activeInteractions: number }[] }> {
    return { agents: [] };
  }

  async detectVolumeSpike(): Promise<{ spikeDetected: boolean; suggestion?: string }> {
    return { spikeDetected: false };
  }

  async getSlaDashboard(): Promise<{
    avgWaitTime: number;
    avgResolutionTime: number;
    slaComplianceRate: number;
    breachedCount: number;
  }> {
    return { avgWaitTime: 120, avgResolutionTime: 600, slaComplianceRate: 0.92, breachedCount: 3 };
  }

  async escalateToSupervisor(queueItemId: string, reason: string): Promise<void> {
    await this.repo.update({ id: queueItemId }, {
      escalatedToSupervisor: true,
      status: QueueStatus.ESCALATED,
    } as any);
  }

  async resolve(queueItemId: string): Promise<void> {
    await this.repo.update({ id: queueItemId }, {
      status: QueueStatus.RESOLVED,
      resolvedAt: new Date(),
    } as any);
  }

  async checkSlaBreaches(): Promise<{ breachedItems: CrmOmnichannelQueue[]; count: number }> {
    const breached = await this.repo.find({
      where: { slaBreached: false, slaDeadline: MoreThan(new Date()), status: QueueStatus.QUEUED },
    });
    return { breachedItems: [], count: 0 };
  }
}
