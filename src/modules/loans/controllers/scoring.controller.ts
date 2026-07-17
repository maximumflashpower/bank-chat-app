// src/modules/loans/controllers/scoring.controller.ts

import { Controller, Get, Param } from '@nestjs/common';
import { ScoringService } from '../services/scoring.service.js';
import { LoanApplicationService } from '../services/loan-application.service.js';

@Controller('v1/loans/scoring')
export class ScoringController {
  constructor(
    private readonly scoringService: ScoringService,
    private readonly applicationService: LoanApplicationService,
  ) {}

  @Get(':applicationId')
  async getScoringDetail(@Param('applicationId') applicationId: string) {
    const app = await this.applicationService.findById(applicationId);
    const result = this.scoringService.calculateInternalScore({
      bureauScore: app.bureauCreditScore || undefined,
      dtiRatio: app.dtiRatioCalculated ? Number(app.dtiRatioCalculated) : undefined,
      annualIncome: app.annualIncomeDeclared ? Number(app.annualIncomeDeclared) : undefined,
      loanAmountRequested: app.requestedAmount ? Number(app.requestedAmount) : undefined,
    });
    return {
      applicationId,
      bureauScore: app.bureauCreditScore,
      internalScore: result.score,
      creditRating: result.rating,
      probabilityOfDefault: result.pd,
      lossGivenDefault: result.lgd,
      expectedLoss: result.el,
      decisionFactors: {
        bureauScoreImpact: 'medium',
        dtiImpact: app.dtiRatioCalculated && Number(app.dtiRatioCalculated) > 43 ? 'high_negative' : 'low',
        incomeStability: 'medium',
      },
    };
  }
}
