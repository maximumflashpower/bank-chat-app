// src/modules/loans/controllers/collections.controller.ts

import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { CollectionsService } from '../services/collections.service.js';

@Controller('v1/loans')
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Get(':loanId/delinquency-status')
  async getDelinquencyStatus(@Param('loanId') loanId: string) {
    return this.collectionsService.logDelinquencyEvent(loanId, 0, 'cure', 0);
  }

  @Post(':loanId/charge-off')
  async chargeOff(@Param('loanId') loanId: string, @Body() body: { amount: number }) {
    await this.collectionsService.processChargeOff(loanId, body.amount);
    return { message: 'Loan charged off', loanId, chargeOffAmount: body.amount };
  }

  @Post(':loanId/hardship')
  async enrollHardship(@Param('loanId') loanId: string, @Body() body: { program: string }) {
    await this.collectionsService.enrollHardship(loanId, body.program);
    return { message: 'Hardship program enrolled', loanId, program: body.program };
  }
}
