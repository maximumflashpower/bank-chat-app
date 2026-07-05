import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Consent } from './entities/consent.entity';
import { DsarRequest } from './entities/dsar-request.entity';
import { ConsentService } from './services/consent.service';
import { DsarService } from './services/dsar.service';
import { ConsentController } from './controllers/consent.controller';
import { DsarController } from './controllers/dsar.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Consent, DsarRequest])],
  controllers: [ConsentController, DsarController],
  providers: [ConsentService, DsarService],
  exports: [ConsentService, DsarService],
})
export class PrivacyModule {}
