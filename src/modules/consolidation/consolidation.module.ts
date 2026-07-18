import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  ConsolidationEntity,
  ConsolidationRun,
  ConsolidationEliminationEntry,
  ConsolidationCurrencyTranslation,
  ConsolidationAcquisitionRegister,
} from './entities';

import { EntityRegistryService } from './services/entity-registry.service';
import { ConsolidationRunService } from './services/consolidation-run.service';
import { CurrencyTranslationService } from './services/currency-translation.service';
import { EliminationEngineService } from './services/elimination-engine.service';
import { MinorityInterestService } from './services/minority-interest.service';
import { GoodwillService } from './services/goodwill.service';
import { AcquisitionService } from './services/acquisition.service';

import { EntityController } from './controllers/entity.controller';
import { ConsolidationRunController } from './controllers/consolidation-run.controller';
import { EliminationController } from './controllers/elimination.controller';
import { CurrencyTranslationController } from './controllers/currency-translation.controller';
import { AcquisitionController } from './controllers/acquisition.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ConsolidationEntity,
      ConsolidationRun,
      ConsolidationEliminationEntry,
      ConsolidationCurrencyTranslation,
      ConsolidationAcquisitionRegister,
    ]),
  ],
  controllers: [
    EntityController,
    ConsolidationRunController,
    EliminationController,
    CurrencyTranslationController,
    AcquisitionController,
  ],
  providers: [
    EntityRegistryService,
    ConsolidationRunService,
    CurrencyTranslationService,
    EliminationEngineService,
    MinorityInterestService,
    GoodwillService,
    AcquisitionService,
  ],
  exports: [
    TypeOrmModule,
    EntityRegistryService,
    ConsolidationRunService,
    CurrencyTranslationService,
    EliminationEngineService,
    MinorityInterestService,
    GoodwillService,
    AcquisitionService,
  ],
})
export class ConsolidationModule {}
