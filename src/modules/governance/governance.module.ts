import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GovPolicy } from './entities/gov-policy.entity';
import { GovDecisionLog } from './entities/gov-decision-log.entity';
import { GovDriftDetection } from './entities/gov-drift-detection.entity';
import { GovFrameworkMapping } from './entities/gov-framework-mapping.entity';
import { GovViolation } from './entities/gov-violation.entity';
import { GovRegComp } from './entities/gov-reg-comp.entity';
import { PolicyService } from './services/policy.service';
import { DecisionService } from './services/decision.service';
import { DriftService } from './services/drift.service';
import { FrameworkService } from './services/framework.service';
import { ViolationService } from './services/violation.service';
import { GovernanceEngineService } from './services/governance-engine.service';
import { RegCompService } from './services/reg-comp.service';
import { PolicyController } from './controllers/policy.controller';
import { DecisionController } from './controllers/decision.controller';
import { DriftController } from './controllers/drift.controller';
import { FrameworkController } from './controllers/framework.controller';
import { ViolationController } from './controllers/violation.controller';
import { DashboardController } from './controllers/dashboard.controller';
import { RegCompController } from './controllers/reg-comp.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      GovPolicy,
      GovDecisionLog,
      GovDriftDetection,
      GovFrameworkMapping,
      GovViolation,
      GovRegComp,
    ]),
  ],
  providers: [
    PolicyService,
    DecisionService,
    DriftService,
    FrameworkService,
    ViolationService,
    GovernanceEngineService,
    RegCompService,
  ],
  controllers: [
    PolicyController,
    DecisionController,
    DriftController,
    FrameworkController,
    ViolationController,
    DashboardController,
    RegCompController,
  ],
  exports: [GovernanceEngineService, PolicyService, RegCompService],
})
export class GovernanceModule {}
