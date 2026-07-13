import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebhookSubscription } from './entities/webhook-subscription.entity';
import { WebhookDeliveryLog } from './entities/webhook-delivery-log.entity';
import { ApiKey } from './entities/api-key.entity';
import { Tenant } from './entities/tenant.entity';
import { WebhookService } from './services/webhook.service';
import { ApiKeyService } from './services/api-key.service';
import { TenantService } from './services/tenant.service';
import { DeveloperPortalService } from './services/developer-portal.service';
import { ModernFeaturesService } from './services/modern-features.service';
import { WebhookController } from './controllers/webhook.controller';
import { ApiKeyController } from './controllers/api-key.controller';
import { TenantController } from './controllers/tenant.controller';
import { DeveloperPortalController } from './controllers/developer-portal.controller';
import { ModernFeaturesController } from './controllers/modern-features.controller';

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
    DeveloperPortalController,
    ModernFeaturesController,
  ],
  providers: [
    WebhookService,
    ApiKeyService,
    TenantService,
    DeveloperPortalService,
    ModernFeaturesService,
  ],
  exports: [
    WebhookService,
    ApiKeyService,
    TenantService,
    DeveloperPortalService,
    ModernFeaturesService,
  ],
})
export class WebhooksModule {}
