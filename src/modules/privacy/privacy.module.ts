import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Consent } from './entities/consent.entity';
import { DsarRequest } from './entities/dsar-request.entity';
import { ProcessingActivity } from './entities/processing-activity.entity';
import { Dpia } from './entities/dpia.entity';
import { ConsentService } from './services/consent.service';
import { DsarService } from './services/dsar.service';
import { ProcessingActivityService } from './services/processing-activity.service';
import { DpiaService } from './services/dpia.service';
import { ConsentController } from './controllers/consent.controller';
import { DsarController } from './controllers/dsar.controller';
import { ProcessingActivityController } from './controllers/processing-activity.controller';
import { DpiaController } from './controllers/dpia.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Consent, DsarRequest, ProcessingActivity, Dpia])],
  controllers: [ConsentController, DsarController, ProcessingActivityController, DpiaController],
  providers: [ConsentService, DsarService, ProcessingActivityService, DpiaService],
  exports: [ConsentService, DsarService, ProcessingActivityService, DpiaService],
})
export class PrivacyModule {}
