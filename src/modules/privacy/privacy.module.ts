import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Consent } from './entities/consent.entity';
import { DsarRequest } from './entities/dsar-request.entity';
import { ProcessingActivity } from './entities/processing-activity.entity';
import { Dpia } from './entities/dpia.entity';
import { BreachNotification } from './entities/breach-notification.entity';
import { RetentionSchedule } from './entities/retention-schedule.entity';
import { ConsentService } from './services/consent.service';
import { DsarService } from './services/dsar.service';
import { ProcessingActivityService } from './services/processing-activity.service';
import { DpiaService } from './services/dpia.service';
import { BreachService } from './services/breach.service';
import { RetentionService } from './services/retention.service';
import { ConsentController } from './controllers/consent.controller';
import { DsarController } from './controllers/dsar.controller';
import { ProcessingActivityController } from './controllers/processing-activity.controller';
import { DpiaController } from './controllers/dpia.controller';
import { BreachController } from './controllers/breach.controller';
import { RetentionController } from './controllers/retention.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Consent,
      DsarRequest,
      ProcessingActivity,
      Dpia,
      BreachNotification,
      RetentionSchedule,
    ]),
  ],
  controllers: [
    ConsentController,
    DsarController,
    ProcessingActivityController,
    DpiaController,
    BreachController,
    RetentionController,
  ],
  providers: [
    ConsentService,
    DsarService,
    ProcessingActivityService,
    DpiaService,
    BreachService,
    RetentionService,
  ],
  exports: [
    ConsentService,
    DsarService,
    ProcessingActivityService,
    DpiaService,
    BreachService,
    RetentionService,
  ],
})
export class PrivacyModule {}
