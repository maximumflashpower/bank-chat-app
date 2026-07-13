import { Module } from '@nestjs/common';
import { AiRegulatoryService } from './services/ai-regulatory.service';
import { AlgorithmicTradingService } from './services/algorithmic-trading.service';
import { ModelGovernanceService } from './services/model-governance.service';
import { MlBiasDetectionService } from './services/ml-bias-detection.service';
import { AiController } from './controllers/ai-controller';

@Module({
  controllers: [AiController],
  providers: [
    AiRegulatoryService,
    AlgorithmicTradingService,
    ModelGovernanceService,
    MlBiasDetectionService,
  ],
  exports: [
    AiRegulatoryService,
    AlgorithmicTradingService,
    ModelGovernanceService,
    MlBiasDetectionService,
  ],
})
export class AiRegulatoryModule {}
