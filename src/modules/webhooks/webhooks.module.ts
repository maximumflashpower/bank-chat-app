import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebhookSubscription } from './entities/webhook-subscription.entity';
import { WebhookDeliveryLog } from './entities/webhook-delivery-log.entity';
import { ApiKey } from './entities/api-key.entity';
import { Tenant } from './entities/tenant.entity';
import { TenantService } from './services/tenant.service';
import { WebhookService } from './services/webhook.service';
import { ApiKeyService } from './services/api-key.service';
import { WebhookController } from './controllers/webhook.controller';
import { ApiKeyController } from './controllers/api-key.controller';
import { TenantController } from './controllers/tenant.controller';

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
    TenantController,
  ],
  providers: [
    WebhookService,
    ApiKeyService,
    TenantService,
  ],
  exports: [
    WebhookService,
    ApiKeyService,
    TenantService,
  ],
})
export class WebhooksModule {}
