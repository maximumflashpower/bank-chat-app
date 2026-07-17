// src/modules/loans/controllers/loan.controller.ts

import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { LoanService } from '../services/loan.service.js';
import { LoanPaymentDto, ExtraPaymentDto, EnrollAutoDebitDto, ConfigureEscrowDto, ModifyLoanDto } from '../dto/loan-payment.dto.js';

@Controller('v1/loans')
export class LoanController {
  constructor(private readonly loanService: LoanService) {}

  @Post(':loanId/disburse')
  async disburse(
    @Param('loanId') loanId: string,
    @Body() body: { applicationId: string, amount: number, rate: number, term: number },
  ) {
    return this.loanService.disburseLoan(body.applicationId, body.amount, body.rate, body.term);
  }

  @Get(':loanId')
  async findById(@Param('loanId') loanId: string) {
    return this.loanService.findById(loanId);
  }

  @Get(':loanId/payoff-quote')
  async getPayoffQuote(@Param('loanId') loanId: string) {
    return this.loanService.getPayoffQuote(loanId);
  }

  @Post(':loanId/payment')
  async processPayment(@Param('loanId') loanId: string, @Body() body: { amount: number }) {
    return this.loanService.processPayment(loanId, body.amount);
  }

  @Post(':loanId/extra-payment')
  async extraPayment(@Param('loanId') loanId: string, @Body() dto: ExtraPaymentDto) {
    return this.loanService.registerExtraPayment(loanId, dto.amount);
  }

  @Post(':loanId/refinance')
  async refinance(@Param('loanId') loanId: string, @Body() body: { newTermMonths: number, newRate: number }) {
    const loan = await this.loanService.findById(loanId);
    return { message: 'Refinance application created', originalLoanId: loanId, newTermMonths: body.newTermMonths, newRate: body.newRate };
  }

  @Post('auto-debit/enroll')
  async enrollAutoDebit(@Body() dto: EnrollAutoDebitDto) {
    return { message: 'Auto-debit enrolled', loanId: dto.loanId, accountId: dto.accountId };
  }

  @Post(':loanId/modify')
  async modifyLoan(@Param('loanId') loanId: string, @Body() dto: ModifyLoanDto) {
    return { message: 'Loan modification requested', loanId, ...dto };
  }
}
