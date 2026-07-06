import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Consent } from './entities/consent.entity';
import { DsarRequest } from './entities/dsar-request.entity';
import { ProcessingActivity } from './entities/processing-activity.entity';
import { Dpia } from './entities/dpia.entity';
import { BreachNotification } from './entities/breach-notification.entity';
import { RetentionSchedule } from './entities/retention-schedule.entity';
import { PolicyVersion } from './entities/policy-version.entity';
import { DpoContact } from './entities/dpo-contact.entity';
import { ThirdPartyProcessor } from './entities/third-party-processor.entity';
import { ConsentService } from './services/consent.service';
import { DsarService } from './services/dsar.service';
import { ProcessingActivityService } from './services/processing-activity.service';
import { DpiaService } from './services/dpia.service';
import { BreachService } from './services/breach.service';
import { RetentionService } from './services/retention.service';
import { PolicyVersionService } from './services/policy-version.service';
import { DpoContactService } from './services/dpo-contact.service';
import { ThirdPartyProcessorService } from './services/third-party-processor.service';
import { ConsentController } from './controllers/consent.controller';
import { DsarController } from './controllers/dsar.controller';
import { ProcessingActivityController } from './controllers/processing-activity.controller';
import { DpiaController } from './controllers/dpia.controller';
import { BreachController } from './controllers/breach.controller';
import { RetentionController } from './controllers/retention.controller';
import { PolicyVersionController } from './controllers/policy-version.controller';
import { DpoContactController } from './controllers/dpo-contact.controller';
import { ThirdPartyProcessorController } from './controllers/third-party-processor.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Consent,
      DsarRequest,
      ProcessingActivity,
      Dpia,
      BreachNotification,
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
  ],
})
export class PrivacyModule {}
