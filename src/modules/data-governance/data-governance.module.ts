import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  DatagovClassification,
} from './entities/datagov-classification.entity';
import {
  DatagovRetentionPolicy,
} from './entities/datagov-retention-policy.entity';
import {
  DatagovDlpRule,
} from './entities/datagov-dlp-rule.entity';
import {
  DatagovDlpViolation,
} from './entities/datagov-dlp-violation.entity';
import {
  DatagovCatalogEntry,
} from './entities/datagov-catalog-entry.entity';
import {
  DatagovQualityScore,
} from './entities/datagov-quality-score.entity';
import {
  DatagovLineage,
} from './entities/datagov-lineage.entity';

import { ClassificationController } from './controllers/classification.controller';
import { RetentionController } from './controllers/retention.controller';
import { DlpController } from './controllers/dlp.controller';
import { CatalogController } from './controllers/catalog.controller';
import { LineageController } from './controllers/lineage.controller';
import { QualityController } from './controllers/quality.controller';

import { ClassificationService } from './services/classification.service';
import { RetentionService } from './services/retention.service';
import { DlpService } from './services/dlp.service';
import { MaskingService } from './services/masking.service';
import { LineageService } from './services/lineage.service';
import { CatalogService } from './services/catalog.service';
import { QualityService } from './services/quality.service';
import { SecurityService } from './services/security.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DatagovClassification,
      DatagovRetentionPolicy,
      DatagovDlpRule,
      DatagovDlpViolation,
      DatagovCatalogEntry,
      DatagovQualityScore,
      DatagovLineage,
    ]),
  ],
  controllers: [
    ClassificationController,
    RetentionController,
    DlpController,
    CatalogController,
    LineageController,
    QualityController,
  ],
  providers: [
    ClassificationService,
    RetentionService,
    DlpService,
    MaskingService,
    LineageService,
    CatalogService,
    QualityService,
    SecurityService,
  ],
  exports: [
    TypeOrmModule,
    ClassificationService,
    RetentionService,
    DlpService,
    MaskingService,
    LineageService,
    CatalogService,
    QualityService,
    SecurityService,
  ],
})
export class DataGovernanceModule {}
