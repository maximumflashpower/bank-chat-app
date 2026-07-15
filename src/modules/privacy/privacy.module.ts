import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PrivacyConsent } from './entities/privacy-consent.entity';
import { PrivacyDsarRequest } from './entities/privacy-dsar-request.entity';
import { PrivacyProcessingActivity } from './entities/privacy-processing-activity.entity';
import { PrivacyDpiaAssessment } from './entities/privacy-dpia-assessment.entity';
import { PrivacyBreachNotification } from './entities/privacy-breach-notification.entity';
import { PrivacyErasureRequest } from './entities/privacy-erasure-request.entity';
// Entidades existentes que se mantienen
import { RetentionSchedule } from './entities/retention-schedule.entity';
import { PolicyVersion } from './entities/policy-version.entity';
import { DpoContact } from './entities/dpo-contact.entity';
import { ThirdPartyProcessor } from './entities/third-party-processor.entity';
// Services
import { ConsentService } from './services/consent.service';
import { DsarService } from './services/dsar.service';
import { ProcessingActivityService } from './services/processing-activity.service';
import { DpiaService } from './services/dpia.service';
import { BreachService } from './services/breach.service';
import { RetentionService } from './services/retention.service';
import { PolicyVersionService } from './services/policy-version.service';
import { DpoContactService } from './services/dpo-contact.service';
import { ThirdPartyProcessorService } from './services/third-party-processor.service';
import { PrivacyByDesignService } from './services/privacy-by-design.service';
import { PrivacyMetricsService } from './services/privacy-metrics.service';
import { AiPrivacyService } from './services/ai-privacy.service';
// Controllers
import { ConsentController } from './controllers/consent.controller';
import { DsarController } from './controllers/dsar.controller';
import { ProcessingActivityController } from './controllers/processing-activity.controller';
import { DpiaController } from './controllers/dpia.controller';
import { BreachController } from './controllers/breach.controller';
import { RetentionController } from './controllers/retention.controller';
import { PolicyVersionController } from './controllers/policy-version.controller';
import { DpoContactController } from './controllers/dpo-contact.controller';
import { ThirdPartyProcessorController } from './controllers/third-party-processor.controller';
import { PrivacyByDesignController } from './controllers/privacy-by-design.controller';
import { PrivacyMetricsController } from './controllers/privacy-metrics.controller';
import { AiPrivacyController } from './controllers/ai-privacy.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PrivacyConsent,
      PrivacyDsarRequest,
      PrivacyProcessingActivity,
      PrivacyDpiaAssessment,
      PrivacyBreachNotification,
      PrivacyErasureRequest,
      RetentionSchedule,
      PolicyVersion,
      DpoContact,
      ThirdPartyProcessor,
    ]),
  ],
  controllers: [
    ConsentController,
    DsarController,
    ProcessingActivityController,
    DpiaController,
    BreachController,
    RetentionController,
    PolicyVersionController,
    DpoContactController,
    ThirdPartyProcessorController,
    PrivacyByDesignController,
    PrivacyMetricsController,
    AiPrivacyController,
  ],
  providers: [
    ConsentService,
    DsarService,
    ProcessingActivityService,
    DpiaService,
    BreachService,
    RetentionService,
    PolicyVersionService,
    DpoContactService,
    ThirdPartyProcessorService,
    PrivacyByDesignService,
    PrivacyMetricsService,
    AiPrivacyService,
  ],
  exports: [
    ConsentService,
    DsarService,
    ProcessingActivityService,
    DpiaService,
    BreachService,
    RetentionService,
    PolicyVersionService,
    DpoContactService,
    ThirdPartyProcessorService,
    PrivacyByDesignService,
    PrivacyMetricsService,
    AiPrivacyService,
  ],
})
export class PrivacyModule {}
