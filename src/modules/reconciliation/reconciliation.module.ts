import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReconMatchingBatch } from './entities/recon-matching-batch.entity';
import { ReconMatchingResult } from './entities/recon-match-result.entity';
import { ReconInterSystemBreak } from './entities/recon-inter-system-break.entity';
import { ReconNettingBatch } from './entities/recon-netting-batch.entity';
import { ReconSettlementBatch } from './entities/recon-settlement-batch.entity';
import { MatchingEngineService } from './services/matching-engine.service';
import { NettingService } from './services/netting.service';
import { InterSystemReconService } from './services/inter-system-recon.service';
import { SettlementOptimizerService } from './services/settlement-optimizer.service';
import { ReconDashboardService } from './services/recon-dashboard.service';
import { MatchingEngineController } from './controllers/matching-engine.controller';
import { NettingController } from './controllers/netting.controller';
import { InterSystemReconController } from './controllers/inter-system-recon.controller';
import { DashboardController } from './controllers/dashboard.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ReconMatchingBatch,
      ReconMatchingResult,
      ReconInterSystemBreak,
      ReconNettingBatch,
      ReconSettlementBatch,
    ]),
  ],
  controllers: [
    MatchingEngineController,
    NettingController,
    InterSystemReconController,
    DashboardController,
  ],
  providers: [
    MatchingEngineService,
    NettingService,
    InterSystemReconService,
    SettlementOptimizerService,
    ReconDashboardService,
  ],
  exports: [
    MatchingEngineService,
    NettingService,
    InterSystemReconService,
    SettlementOptimizerService,
    ReconDashboardService,
  ],
})
export class ReconciliationModule {}
