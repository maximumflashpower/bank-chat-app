// src/modules/loans/loans.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoanProduct } from './entities/loan-product.entity.js';
import { LoanApplication } from './entities/loan-application.entity.js';
import { LoanMaster } from './entities/loan-master.entity.js';
import { LoanAmortizationSchedule } from './entities/loan-amortization-schedule.entity.js';
import { LoanCollateral } from './entities/loan-collateral.entity.js';
import { LoanDelinquencyEvent } from './entities/loan-delinquency-event.entity.js';
import { ProductService } from './services/product.service.js';
import { LoanApplicationService } from './services/loan-application.service.js';
import { LoanService } from './services/loan.service.js';
import { ScoringService } from './services/scoring.service.js';
import { CollateralService } from './services/collateral.service.js';
import { CollectionsService } from './services/collections.service.js';
import { MortgageService } from './services/mortgage.service.js';
import { EscrowService } from './services/escrow.service.js';
import { PortfolioService } from './services/portfolio.service.js';
import { InterestAccrualService } from './services/interest-accrual.service.js';
import { ChargeOffService } from './services/charge-off.service.js';
import { CreditScoringService } from './services/credit-scoring.service.js';
import { MarginCallService } from './services/margin-call.service.js';
import { LoanRestructureService } from './services/loan-restructure.service.js';
import { CreditScoringController } from './controllers/credit-scoring.controller.js';
import { MarginCallController } from './controllers/margin-call.controller.js';
import { LoanRestructureController } from './controllers/loan-restructure.controller.js';
import { ProductController } from './controllers/product.controller.js';
import { LoanApplicationController } from './controllers/loan-application.controller.js';
import { LoanController } from './controllers/loan.controller.js';
import { CollateralController } from './controllers/collateral.controller.js';
import { MortgageController } from './controllers/mortgage.controller.js';
import { CollectionsController } from './controllers/collections.controller.js';
import { PortfolioController } from './controllers/portfolio.controller.js';
import { EscrowController } from './controllers/escrow.controller.js';
import { ScoringController } from './controllers/scoring.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LoanProduct,
      LoanApplication,
      LoanMaster,
      LoanAmortizationSchedule,
      LoanCollateral,
      LoanDelinquencyEvent,
    ]),
  ],
  controllers: [
    ProductController,
    LoanApplicationController,
    LoanController,
    CollateralController,
    MortgageController,
    CollectionsController,
    PortfolioController,
    EscrowController,
    ScoringController,
    CreditScoringController,
    MarginCallController,
    LoanRestructureController,
  ],
  providers: [
    ProductService,
    LoanApplicationService,
    LoanService,
    ScoringService,
    CollateralService,
    CollectionsService,
    MortgageService,
    EscrowService,
    PortfolioService,
          InterestAccrualService,
          ChargeOffService,
          CreditScoringService,
          MarginCallService,
          LoanRestructureService,
  ],
  exports: [
    ProductService,
    LoanApplicationService,
    LoanService,
    ScoringService,
    CollateralService,
    CollectionsService,
    MortgageService,
    EscrowService,
    PortfolioService,
  ],
})
export class LoansModule {}
