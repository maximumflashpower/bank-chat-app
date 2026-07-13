import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegulatoryChange } from './entities/regulatory-change.entity';
import { ComplianceTraining } from './entities/compliance-training.entity';
import { RegulatoryChangeService } from './services/regulatory-change.service';
import { ComplianceTrainingService } from './services/compliance-training.service';
import { VendorRiskService } from './services/vendor-risk.service';
import { InsiderThreatService } from './services/insider-threat.service';
import { DlPService } from './services/dlp.service';
import { ComplianceKpiService } from './services/compliance-kpi.service';
import { MiscController } from './controllers/misc.controller';

@Module({
  imports: [TypeOrmModule.forFeature([RegulatoryChange, ComplianceTraining])],
  controllers: [MiscController],
  providers: [
    RegulatoryChangeService,
    ComplianceTrainingService,
    VendorRiskService,
    InsiderThreatService,
    DlPService,
    ComplianceKpiService,
  ],
  exports: [
    RegulatoryChangeService,
    ComplianceTrainingService,
    VendorRiskService,
    InsiderThreatService,
    DlPService,
    ComplianceKpiService,
  ],
})
export class MiscModule {}
