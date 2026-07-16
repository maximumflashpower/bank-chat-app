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
  ],
  providers: [
    ProductService,
    LoanApplicationService,
    LoanService,
    ScoringService,
    CollateralService,
    CollectionsService,
    MortgageService,
  ],
  exports: [
    ProductService,
    LoanApplicationService,
    LoanService,
    ScoringService,
    CollateralService,
    CollectionsService,
    MortgageService,
  ],
})
export class LoansModule {}
