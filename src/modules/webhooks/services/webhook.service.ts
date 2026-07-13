import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WebhookSubscription, WebhookStatus } from '../entities/webhook-subscription.entity';
import { WebhookDeliveryLog, WebhookDeliveryStatus } from '../entities/webhook-delivery-log.entity';
import { CreateWebhookDto } from '../dto/create-webhook.dto';
import { TriggerWebhookDto } from '../dto/trigger-webhook.dto';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    @InjectRepository(WebhookSubscription)
    private subscriptionRepo: Repository<WebhookSubscription>,
    @InjectRepository(WebhookDeliveryLog)
    private deliveryLogRepo: Repository<WebhookDeliveryLog>,
  ) {}

  async createWebhook(tenantId: string, dto: CreateWebhookDto): Promise<WebhookSubscription> {
    const subscription = this.subscriptionRepo.create({
      tenantId,
      endpointUrl: dto.endpointUrl,
      eventTypes: dto.eventTypes,
      apiVersion: dto.apiVersion || 'v1',
      maxRetries: dto.maxRetries || 3,
      secretKey: crypto.randomUUID(),
      headers: dto.headers || null,
    });

    return this.subscriptionRepo.save(subscription);
  }

  async listWebhooks(tenantId: string): Promise<WebhookSubscription[]> {
    return this.subscriptionRepo.find({ where: { tenantId } });
  }

  async getWebhook(subscriptionId: string, tenantId: string): Promise<WebhookSubscription> {
    const subscription = await this.subscriptionRepo.findOne({
      where: { id: subscriptionId, tenantId },
    });

    if (!subscription) {
      throw new NotFoundException('Webhook subscription not found');
    }

    return subscription;
  }

  async deleteWebhook(subscriptionId: string, tenantId: string): Promise<void> {
    const result = await this.subscriptionRepo.delete({ id: subscriptionId, tenantId });

    if (result.affected === 0) {
      throw new NotFoundException('Webhook subscription not found');
    }
  }

  async triggerWebhook(subscriptionId: string, dto: TriggerWebhookDto): Promise<WebhookDeliveryLog> {
    const subscription = await this.subscriptionRepo.findOne({ where: { id: subscriptionId } });

    if (!subscription) {
      throw new NotFoundException('Webhook subscription not found');
    }

    if (subscription.status !== WebhookStatus.ACTIVE) {
      throw new Error('Webhook subscription is not active');
    }

    // Check event type filter
    if (!subscription.eventTypes.includes(dto.eventType)) {
      this.logger.warn(`Event ${dto.eventType} not subscribed for ${subscriptionId}`);
      throw new Error('Event type not subscribed');
    }

    const deliveryLog = this.deliveryLogRepo.create({
      subscriptionId,
      eventId: crypto.randomUUID(),
      eventType: dto.eventType,
      payload: dto.payload,
      status: WebhookDeliveryStatus.PENDING,
      attemptNumber: 1,
    });

    const saved = await this.deliveryLogRepo.save(deliveryLog);
    
    // Async delivery (mock implementation)
    setTimeout(async () => {
      await this.deliverWebhook(saved.id, subscription.endpointUrl);
    }, 0);

    return saved;
  }

  private async deliverWebhook(logId: string, endpointUrl: string): Promise<void> {
    const log = await this.deliveryLogRepo.findOne({ where: { id: logId } });
    if (!log) return;

    try {
      // Simulate HTTP request - in production use http/http2 client
      // const response = await axios.post(endpointUrl, log.payload, {
      //   headers: { 'X-Webhook-Signature': this.signPayload(log.payload, subscription.secretKey) }
      // });

      // Mock success for demo
      log.status = WebhookDeliveryStatus.DELIVERED;
      log.responseStatus = 200;
      log.deliveredAt = new Date();
      log.durationMs = Math.floor(Math.random() * 500) + 50;
      
      await this.deliveryLogRepo.save(log);

      // Update subscription stats
      const subscription = await this.subscriptionRepo.findOne({ where: { id: log.subscriptionId } });
      if (subscription) {
        subscription.totalDeliveries += 1;
        subscription.successfulDeliveries += 1;
        subscription.lastTriggeredAt = new Date();
        await this.subscriptionRepo.save(subscription);
      }
    } catch (error) {
      log.status = WebhookDeliveryStatus.FAILED;
      log.errorMessage = error.message;
      log.nextRetryAt = this.calculateNextRetry(log.attemptNumber);
      await this.deliveryLogRepo.save(log);

      // Retry logic
      const subscription = await this.subscriptionRepo.findOne({ where: { id: log.subscriptionId } });
      if (subscription && subscription.status === WebhookStatus.ACTIVE && log.attemptNumber < subscription.maxRetries) {
        await this.scheduleRetry(log.id);
      } else {
        log.status = WebhookDeliveryStatus.DEAD_LETTER;
        await this.deliveryLogRepo.save(log);
      }
    }
  }

  private calculateNextRetry(attempt: number): Date {
    const backoffMs = Math.min(300000, 1000 * Math.pow(2, attempt));
    const retryDate = new Date(Date.now() + backoffMs);
    return retryDate;
  }

  private async scheduleRetry(logId: string): Promise<void> {
    // In production, use Bull/Redis queue for delayed retries
    // For demo, just update the timestamp
    const log = await this.deliveryLogRepo.findOne({ where: { id: logId } });
    if (log) {
      log.attemptNumber += 1;
      log.nextRetryAt = this.calculateNextRetry(log.attemptNumber);
      await this.deliveryLogRepo.save(log);
    }
  }

  async getDeliveryLogs(subscriptionId: string): Promise<WebhookDeliveryLog[]> {
    return this.deliveryLogRepo.find({
      where: { subscriptionId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async replayFromDeadLetter(eventId: string): Promise<void> {
    const log = await this.deliveryLogRepo.findOne({ where: { eventId } });
    if (!log || log.status !== WebhookDeliveryStatus.DEAD_LETTER) {
      throw new NotFoundException('Event not found in dead letter queue');
    }

    // Reset to pending and retry
    log.status = WebhookDeliveryStatus.PENDING;
    log.attemptNumber = 1;
    log.errorMessage = null;
    log.nextRetryAt = null;
    await this.deliveryLogRepo.save(log);

    const subscription = await this.subscriptionRepo.findOne({ where: { id: log.subscriptionId } });
    if (subscription) {
      setTimeout(() => this.deliverWebhook(log.id, subscription.endpointUrl), 0);
    }
  }

  async sendTestPayload(subscriptionId: string, payload: Record<string, unknown>): Promise<WebhookDeliveryLog> {
    const subscription = await this.getWebhook(subscriptionId, 'any-tenant-id');
    
    return this.triggerWebhook(subscriptionId, {
      eventType: 'TEST_EVENT',
      payload: payload,
    });
  }
}
