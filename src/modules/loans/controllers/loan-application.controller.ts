// src/modules/loans/controllers/loan-application.controller.ts

import { Controller, Get, Post, Put, Body, Param } from '@nestjs/common';
import { LoanApplicationService } from '../services/loan-application.service.js';
import { ScoringService } from '../services/scoring.service.js';
import { CreateLoanApplicationDto } from '../dto/create-loan-application.dto.js';
import { AcceptOfferDto } from '../dto/accept-offer.dto.js';

@Controller('api/v1/loans/application')
export class LoanApplicationController {
  constructor(
    private readonly applicationService: LoanApplicationService,
    private readonly scoringService: ScoringService,
  ) {}

  @Post('create')
  async create(@Body() dto: CreateLoanApplicationDto) {
    return this.applicationService.create(dto);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.applicationService.findById(id);
  }

  @Put(':id/submit')
  async submit(@Param('id') id: string) {
    return this.applicationService.submitApplication(id);
  }

  @Get(':id/decision')
  async getDecision(@Param('id') id: string) {
    const app = await this.applicationService.findById(id);
    return {
      applicationId: app.id,
      decisionStatus: app.decisionStatus,
      approvedAmount: app.approvedAmount,
      approvedRate: app.approvedRate,
      approvedTermMonths: app.approvedTermMonths,
      approvedMonthlyPayment: app.approvedMonthlyPayment,
      counterofferAmount: app.counterofferAmount,
      counterofferRate: app.counterofferRate,
      decisionReason: app.decisionReason,
    };
  }

  @Post(':id/accept-offer')
  async acceptOffer(@Param('id') id: string, @Body() dto: AcceptOfferDto) {
    return this.applicationService.acceptOffer(id, dto.acceptCounteroffer);
  }

  @Post(':id/reject-offer')
  async rejectOffer(@Param('id') id: string) {
    return this.applicationService.updateDecision(id, 'withdrawn', undefined, undefined, 'Customer rejected offer');
  }

  @Post(':id/e-sign')
  async eSign(@Param('id') id: string) {
    return this.applicationService.acceptOffer(id, false);
  }

  @Get('customer/:customerId')
  async findByCustomer(@Param('customerId') customerId: string) {
    return this.applicationService.findByCustomer(customerId);
  }

  @Post(':id/run-scoring')
  async runScoring(@Param('id') id: string) {
    const app = await this.applicationService.findById(id);
    const result = this.scoringService.calculateInternalScore({
      bureauScore: app.bureauCreditScore || undefined,
      dtiRatio: app.dtiRatioCalculated ? Number(app.dtiRatioCalculated) : undefined,
      annualIncome: app.annualIncomeDeclared ? Number(app.annualIncomeDeclared) : undefined,
      loanAmountRequested: app.requestedAmount ? Number(app.requestedAmount) : undefined,
    });
    
    app.internalScore = result.score;
    app.pdProbabilityDefault = result.pd;
    app.lgdLossGivenDefault = result.lgd;
    app.expectedLoss = result.el;
    app.creditRatingAssigned = result.rating;
    
    const decision = this.scoringService.evaluateDecision(result.pd, result.lgd, result.el, { maxPd: 0.15, maxEl: 50000 });
    const statusMap: Record<string, string> = {
      approve: 'approved',
      conditional: 'conditionally_approved',
      deny: 'declined',
    };
    
    return this.applicationService.updateDecision(
      id,
      statusMap[decision],
      Number(app.requestedAmount),
      undefined,
      `Scoring: ${result.rating}, PD: ${result.pd.toFixed(4)}, Decision: ${decision}`,
    );
  }
}
