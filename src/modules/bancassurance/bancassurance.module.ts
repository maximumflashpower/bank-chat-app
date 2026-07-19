import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InsuranceProduct } from './entities/insurance-product.entity';
import { InsuranceQuote } from './entities/insurance-quote.entity';
import { InsurancePolicy } from './entities/insurance-policy.entity';
import { PolicyEndorsement } from './entities/policy-endorsement.entity';
import { InsuranceClaim } from './entities/insurance-claim.entity';
import { ClaimEvidence } from './entities/claim-evidence.entity';
import { UnderwritingAssessment } from './entities/underwriting-assessment.entity';
import { AgentCommission } from './entities/agent-commission.entity';
import { PremiumSchedule } from './entities/premium-schedule.entity';
import { QuoteService } from './services/quote.service';
import { PolicyService } from './services/policy.service';
import { ClaimService } from './services/claim.service';
import { UnderwritingService } from './services/underwriting.service';
import { CommissionService } from './services/commission.service';
import { PremiumService } from './services/premium.service';
import { InsuranceController } from './controllers/insurance.controller';
import { ClaimController } from './controllers/claim.controller';
import { UnderwritingController } from './controllers/underwriting.controller';
import { AgentController } from './controllers/agent.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InsuranceProduct,
      InsuranceQuote,
      InsurancePolicy,
      PolicyEndorsement,
      InsuranceClaim,
      ClaimEvidence,
      UnderwritingAssessment,
      AgentCommission,
      PremiumSchedule,
    ]),
  ],
  controllers: [
    InsuranceController,
    ClaimController,
    UnderwritingController,
    AgentController,
  ],
  providers: [
    QuoteService,
    PolicyService,
    ClaimService,
    UnderwritingService,
    CommissionService,
    PremiumService,
  ],
  exports: [
    QuoteService,
    PolicyService,
    ClaimService,
    UnderwritingService,
    CommissionService,
    PremiumService,
  ],
})
export class BancassuranceModule {}
