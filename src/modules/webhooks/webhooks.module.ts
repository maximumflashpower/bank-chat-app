import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebhookSubscription } from './entities/webhook-subscription.entity';
import { WebhookDeliveryLog } from './entities/webhook-delivery-log.entity';
import { ApiKey } from './entities/api-key.entity';
import { Tenant } from './entities/tenant.entity';
import { WebhookService } from './services/webhook.service';
import { ApiKeyService } from './services/api-key.service';
import { WebhookController } from './controllers/webhook.controller';
import { ApiKeyController } from './controllers/api-key.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WebhookSubscription,
      WebhookDeliveryLog,
      ApiKey,
      Tenant,
    ]),
  ],
  controllers: [
    WebhookController,
    ApiKeyController,
  ],
  providers: [
    WebhookService,
    ApiKeyService,
  ],
  exports: [
    WebhookService,
    ApiKeyService,
  ],
})
export class WebhooksModule {}
