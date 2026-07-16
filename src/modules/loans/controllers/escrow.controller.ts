// src/modules/loans/controllers/escrow.controller.ts

import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ConfigureEscrowDto } from '../dto/loan-payment.dto.js';

@Controller('api/v1/loans')
export class EscrowController {
  @Post(':loanId/escrow/configure')
  async configureEscrow(@Param('loanId') loanId: string, @Body() dto: ConfigureEscrowDto) {
    return { message: 'Escrow configured', loanId, ...dto };
  }

  @Get(':loanId/escrow/analysis')
  async escrowAnalysis(@Param('loanId') loanId: string) {
    return {
      loanId,
      annualTaxEstimate: 4800,
      annualInsurancePremium: 1200,
      monthlyEscrowPayment: 500,
      escrowBalance: 1500,
      nextDisbursementDate: new Date(new Date().getFullYear(), 11, 1).toISOString(),
      lastAnalysisDate: new Date().toISOString(),
      shortageAmount: 0,
      surplusAmount: 100,
    };
  }
}
