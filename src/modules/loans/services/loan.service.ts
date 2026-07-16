// src/modules/loans/services/loan.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoanMaster } from '../entities/loan-master.entity.js';
import { LoanProduct } from '../entities/loan-product.entity.js';
import { LoanAmortizationSchedule } from '../entities/loan-amortization-schedule.entity.js';
import { LoanApplicationService } from './loan-application.service.js';
import { LoanType, LoanStatus, InterestType, ArmAdjustmentFrequency, DelinquencyStatus, PaymentStatus } from '../entities/loans.enums.js';

@Injectable()
export class LoanService {
  constructor(
    @InjectRepository(LoanMaster)
    private readonly repo: Repository<LoanMaster>,
    @InjectRepository(LoanProduct)
    private readonly productRepo: Repository<LoanProduct>,
    @InjectRepository(LoanAmortizationSchedule)
    private readonly scheduleRepo: Repository<LoanAmortizationSchedule>,
    private readonly applicationService: LoanApplicationService,
  ) {}

  async disburseLoan(applicationId: string, amount: number, rate: number, term: number): Promise<LoanMaster> {
    const application = await this.applicationService.findById(applicationId);
    
    const today = new Date();
    const firstPayment = new Date(today.getFullYear(), today.getMonth() + 1, 15);
    const maturity = new Date(firstPayment);
    maturity.setMonth(maturity.getMonth() + term - 1);
    
    const monthlyPayment = this.calculateMonthlyPayment(amount, rate, term);
    
    const loan = new LoanMaster();
    loan.loanNumber = `LN-${today.toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(Math.random()*100000).toString().padStart(5,'0')}`;
    loan.applicationId = applicationId;
    loan.customerId = application.customerId;
    loan.loanProductId = application.loanProductId;
    loan.loanType = LoanType.PERSONAL;
    loan.principalAmount = amount;
    loan.interestRate = rate;
    loan.apr = rate;
    loan.termMonths = term;
    loan.monthlyPaymentAmount = monthlyPayment;
    loan.paymentDueDay = 15;
    loan.disbursementDate = today;
    loan.firstPaymentDate = firstPayment;
    loan.maturityDate = maturity;
    loan.interestType = InterestType.FIXED;
    loan.originalBalance = amount;
    loan.currentPrincipalBalance = amount;
    loan.status = LoanStatus.ACTIVE;
    
    await this.repo.save(loan);
    await this.generateAmortizationSchedule(loan.id!, amount, rate, term, monthlyPayment);
    return loan;
  }

  private calculateMonthlyPayment(principal: number, annualRate: number, months: number): number {
    const monthlyRate = annualRate / 100 / 12;
    return (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
  }

  private async generateAmortizationSchedule(loanId: string, principal: number, rate: number, months: number, monthlyPayment: number): Promise<void> {
    let balance = principal;
    const monthlyRate = rate / 100 / 12;
    const startDate = new Date();
    
    for (let i = 1; i <= months; i++) {
      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + i);
      
      const interestComponent = balance * monthlyRate;
      const principalComponent = monthlyPayment - interestComponent;
      balance -= principalComponent;
      
      if (balance < 0) balance = 0;
      
      const schedule = new LoanAmortizationSchedule();
      schedule.loanId = loanId;
      schedule.installmentNumber = i;
      schedule.dueDate = dueDate;
      schedule.beginningBalance = balance + principalComponent;
      schedule.scheduledPayment = monthlyPayment;
      schedule.principalComponent = principalComponent;
      schedule.interestComponent = interestComponent;
      schedule.endingBalance = balance;
      schedule.paymentStatus = PaymentStatus.SCHEDULED;
      await this.scheduleRepo.save(schedule);
    }
  }

  async findById(loanId: string): Promise<LoanMaster> {
    const loan = await this.repo.findOne({ where: { id: loanId } });
    if (!loan) throw new NotFoundException(`Loan ${loanId} not found`);
    return loan;
  }

  async getPayoffQuote(loanId: string, asOfDate: Date = new Date()): Promise<{ payoffAmount: number, accruedInterest: number }> {
    const loan = await this.findById(loanId);
    const daysSinceLastPayment = Math.floor((asOfDate.getTime() - loan.disbursementDate.getTime()) / (1000 * 60 * 60 * 24));
    const dailyRate = loan.interestRate / 100 / 365;
    const balance = loan.currentPrincipalBalance ?? loan.principalAmount;
    const accruedInterest = balance * dailyRate * daysSinceLastPayment;
    return {
      payoffAmount: balance + accruedInterest,
      accruedInterest,
    };
  }

  async processPayment(loanId: string, amount: number): Promise<LoanMaster> {
    const loan = await this.findById(loanId);
    const dailyRate = loan.interestRate / 100 / 365;
    const daysPastDue = Math.floor((new Date().getTime() - loan.firstPaymentDate.getTime()) / (1000 * 60 * 60 * 24));
    const balance = loan.currentPrincipalBalance ?? loan.principalAmount;
    const accruedInterest = balance * dailyRate * daysPastDue;
    
    const principalApplied = Math.max(0, amount - accruedInterest);
    loan.currentPrincipalBalance = balance - principalApplied;
    loan.totalInterestPaid += accruedInterest;
    loan.totalPrincipalPaid += principalApplied;
    
    if (loan.currentPrincipalBalance <= 0) {
      loan.status = LoanStatus.PAID_OFF;
      loan.closedAt = new Date();
    }
    
    return this.repo.save(loan);
  }

  async registerExtraPayment(loanId: string, amount: number): Promise<LoanMaster> {
    const loan = await this.findById(loanId);
    const balance = loan.currentPrincipalBalance ?? loan.principalAmount;
    loan.currentPrincipalBalance = balance - amount;
    loan.totalPrincipalPaid += amount;
    return this.repo.save(loan);
  }
}
