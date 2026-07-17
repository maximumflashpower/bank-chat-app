// src/modules/loans/controllers/portfolio.controller.ts

import { Controller, Get } from '@nestjs/common';
import { LoanService } from '../services/loan.service.js';
import { LoanMaster } from '../entities/loan-master.entity.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Controller('v1/loans/portfolio')
export class PortfolioController {
  constructor(
    @InjectRepository(LoanMaster)
    private readonly loanRepo: Repository<LoanMaster>,
  ) {}

  @Get('summary')
  async getSummary() {
    const loans = await this.loanRepo.find();
    const totalLoans = loans.length;
    const activeLoans = loans.filter(l => l.status === 'active').length;
    const totalOutstanding = loans.reduce((sum, l) => sum + (l.currentPrincipalBalance || 0), 0);
    const totalDelinquent = loans.filter(l => l.delinquencyStatus !== 'current').length;
    const delinquencyRate = totalLoans > 0 ? (totalDelinquent / totalLoans) * 100 : 0;
    const totalChargedOff = loans.filter(l => l.status === 'charged_off').length;
    
    return {
      totalLoans,
      activeLoans,
      totalOutstanding,
      totalDelinquent,
      delinquencyRate: delinquencyRate.toFixed(2) + '%',
      totalChargedOff,
      nplRatio: ((loans.filter(l => l.delinquencyStatus === '90+' || l.delinquencyStatus === 'defaulted').length / Math.max(totalLoans, 1)) * 100).toFixed(2) + '%',
    };
  }
}
