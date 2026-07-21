// src/modules/loans/services/interest-accrual.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoanMaster } from '../entities/loan-master.entity.js';
import { LoanAmortizationSchedule } from '../entities/loan-amortization-schedule.entity.js';

@Injectable()
export class InterestAccrualService {
  constructor(
    @InjectRepository(LoanMaster)
    private loanRepo: Repository<LoanMaster>,
    @InjectRepository(LoanAmortizationSchedule)
    private scheduleRepo: Repository<LoanAmortizationSchedule>,
  ) {}

  // ─── 1. Calculate daily accrued interest ───────────────────────
  async calculateDailyInterest(loanId: string): Promise<{
    dailyInterest: number;
    currentBalance: number;
    rateUsed: number;
  }> {
    const loan = await this.loanRepo.findOne({ where: { id: loanId } });
    if (!loan) throw new NotFoundException(`Loan ${loanId} not found`);

    const rate = Number(loan.currentInterestRate ?? loan.interestRate);
    const balance = Number(loan.currentPrincipalBalance ?? loan.originalBalance);

    const dailyInterest = (balance * rate) / 365;

    return {
      dailyInterest: Math.round(dailyInterest * 100) / 100,
      currentBalance: balance,
      rateUsed: rate,
    };
  }

  // ─── 2. Process accrual for a single loan ──────────────────────
  async processAccrual(loanId: string, days = 1): Promise<{
    accruedInterest: number;
    updatedPayoff: number;
  }> {
    const loan = await this.loanRepo.findOne({ where: { id: loanId } });
    if (!loan) throw new NotFoundException(`Loan ${loanId} not found`);

    if (loan.status !== 'active') {
      return {
        accruedInterest: 0,
        updatedPayoff: Number(loan.payoffAmountCurrent ?? loan.currentPrincipalBalance ?? loan.originalBalance),
      };
    }

    const { dailyInterest } = await this.calculateDailyInterest(loanId);
    const accruedInterest = Math.round(dailyInterest * days * 100) / 100;

    const currentPayoff = Number(loan.payoffAmountCurrent ?? loan.currentPrincipalBalance ?? loan.originalBalance);
    loan.payoffAmountCurrent = Math.round((currentPayoff + accruedInterest) * 100) / 100;

    await this.loanRepo.save(loan);

    return {
      accruedInterest,
      updatedPayoff: Number(loan.payoffAmountCurrent),
    };
  }

  // ─── 3. Batch process all active loans ─────────────────────────
  async batchProcessAccruals(days = 1): Promise<{
    processed: number;
    totalAccrued: number;
    errors: string[];
  }> {
    const activeLoans = await this.loanRepo
      .createQueryBuilder('loan')
      .where('loan.status = :status', { status: 'active' })
      .getMany();

    let processed = 0;
    let totalAccrued = 0;
    const errors: string[] = [];

    for (const loan of activeLoans) {
      try {
        const result = await this.processAccrual(loan.id, days);
        processed++;
        totalAccrued += result.accruedInterest;
      } catch (err) {
        errors.push(
          `Loan ${loan.loanNumber ?? loan.id}: ${err instanceof Error ? err.message : 'unknown error'}`,
        );
      }
    }

    return {
      processed,
      totalAccrued: Math.round(totalAccrued * 100) / 100,
      errors,
    };
  }

  // ─── 4. Adjust ARM rate ────────────────────────────────────────
  async adjustArmRate(
    loanId: string,
    newIndexRate: number,
  ): Promise<{ oldRate: number; newRate: number; adjustmentDate: Date }> {
    const loan = await this.loanRepo.findOne({ where: { id: loanId } });
    if (!loan) throw new NotFoundException(`Loan ${loanId} not found`);

    if (loan.interestType !== 'arm' && loan.interestType !== 'variable') {
      throw new Error(`Loan ${loanId} is not an ARM/variable rate loan`);
    }

    const oldRate = Number(loan.currentInterestRate ?? loan.interestRate);
    const margin = Number(loan.armMargin ?? 0);
    const newRate = Math.round((newIndexRate + margin) * 100000) / 100000;

    loan.currentInterestRate = newRate;
    loan.nextRateAdjustmentDate = this.calculateNextAdjustmentDate(
      loan.armAdjustmentFrequency,
    );

    // Recalculate monthly payment with new rate
    const balance = Number(loan.currentPrincipalBalance ?? loan.originalBalance);
    const remainingTerm = this.calculateRemainingTerm(loan);
    loan.monthlyPaymentAmount = this.calculateMonthlyPayment(
      balance,
      newRate,
      remainingTerm,
    );
    loan.nextPaymentAmount = Number(loan.monthlyPaymentAmount);

    await this.loanRepo.save(loan);

    return {
      oldRate,
      newRate,
      adjustmentDate: new Date(),
    };
  }

  // ─── 5. Calculate payoff amount as of date ─────────────────────
  async calculatePayoffAmount(
    loanId: string,
    payoffDate: Date = new Date(),
  ): Promise<{
    payoffAmount: number;
    principalBalance: number;
    accruedInterest: number;
    perDiem: number;
  }> {
    const loan = await this.loanRepo.findOne({ where: { id: loanId } });
    if (!loan) throw new NotFoundException(`Loan ${loanId} not found`);

    const principalBalance = Number(
      loan.currentPrincipalBalance ?? loan.originalBalance,
    );
    const rate = Number(loan.currentInterestRate ?? loan.interestRate);
    const perDiem = Math.round(((principalBalance * rate) / 365) * 100) / 100;

    // Estimate days since last payment cycle
    const referenceDate =
      loan.nextPaymentDueDate ?? loan.disbursementDate;
    const daysAccrued = Math.max(
      0,
      Math.ceil(
        (payoffDate.getTime() - new Date(referenceDate).getTime()) /
          (1000 * 60 * 60 * 24),
      ) - 30, // subtract the current period already covered
    );
    const accruedInterest = Math.round(perDiem * daysAccrued * 100) / 100;
    const payoffAmount =
      Math.round((principalBalance + accruedInterest) * 100) / 100;

    // Persist updated payoff
    loan.payoffAmountCurrent = payoffAmount;
    await this.loanRepo.save(loan);

    return { payoffAmount, principalBalance, accruedInterest, perDiem };
  }

  // ─── 6. Assess late fees for overdue installments ──────────────
  async assessLateFees(loanId: string): Promise<{
    lateFee: number;
    overdueInstallments: number;
  }> {
    const loan = await this.loanRepo.findOne({ where: { id: loanId } });
    if (!loan) throw new NotFoundException(`Loan ${loanId} not found`);

    const today = new Date();
    const pendingSchedules = await this.scheduleRepo.find({
      where: { loanId },
      order: { dueDate: 'ASC' },
    });

    let totalLateFee = 0;
    let overdueCount = 0;
    const gracePeriodDays = 10;

    for (const sched of pendingSchedules) {
      if (sched.paymentStatus !== 'scheduled') continue;
      if (sched.dueDate >= today) continue;

      const daysLate = Math.floor(
        (today.getTime() - new Date(sched.dueDate).getTime()) /
          (1000 * 60 * 60 * 24),
      );

      if (daysLate <= gracePeriodDays) continue;

      // Late fee: max(5% of scheduled payment, $25)
      const scheduledPayment = Number(sched.scheduledPayment);
      const calculatedFee = Math.max(scheduledPayment * 0.05, 25);
      const lateFee = Math.round(calculatedFee * 100) / 100;

      sched.lateFeeAssessed = lateFee;
      sched.daysLate = daysLate;
      await this.scheduleRepo.save(sched);

      totalLateFee += lateFee;
      overdueCount++;

      // Track maximum days past due on the loan
      if (daysLate > loan.daysPastDue) {
        loan.daysPastDue = daysLate;
      }
    }

    // Update delinquency status based on daysPastDue
    if (loan.daysPastDue > 0) {
      if (loan.daysPastDue >= 90) {
        loan.delinquencyStatus = 'charge_off' as any;
      } else if (loan.daysPastDue >= 60) {
        loan.delinquencyStatus = 'delinquent_60' as any;
      } else if (loan.daysPastDue >= 30) {
        loan.delinquencyStatus = 'delinquent_30' as any;
      } else {
        loan.delinquencyStatus = 'delinquent' as any;
      }
      await this.loanRepo.save(loan);
    }

    return {
      lateFee: Math.round(totalLateFee * 100) / 100,
      overdueInstallments: overdueCount,
    };
  }

  // ─── 7. Capitalize unpaid interest into principal ──────────────
  async capitalizeInterest(
    loanId: string,
    amount: number,
  ): Promise<{ newPrincipalBalance: number; capitalizedAmount: number }> {
    const loan = await this.loanRepo.findOne({ where: { id: loanId } });
    if (!loan) throw new NotFoundException(`Loan ${loanId} not found`);

    const currentBalance = Number(
      loan.currentPrincipalBalance ?? loan.originalBalance,
    );
    const newBalance = Math.round((currentBalance + amount) * 100) / 100;

    loan.currentPrincipalBalance = newBalance;
    loan.payoffAmountCurrent = newBalance;

    await this.loanRepo.save(loan);

    return {
      newPrincipalBalance: newBalance,
      capitalizedAmount: amount,
    };
  }

  // ─── 8. Get accrual summary for a loan ─────────────────────────
  async getAccrualSummary(loanId: string): Promise<{
    currentBalance: number;
    interestRate: number;
    dailyAccrual: number;
    monthlyAccrual: number;
    totalInterestPaid: number;
    totalPrincipalPaid: number;
    payoffAmount: number;
    nextPaymentDue: Date | null;
  }> {
    const loan = await this.loanRepo.findOne({ where: { id: loanId } });
    if (!loan) throw new NotFoundException(`Loan ${loanId} not found`);

    const rate = Number(loan.currentInterestRate ?? loan.interestRate);
    const balance = Number(
      loan.currentPrincipalBalance ?? loan.originalBalance,
    );
    const dailyAccrual = Math.round(((balance * rate) / 365) * 100) / 100;
    const monthlyAccrual = Math.round(dailyAccrual * 30 * 100) / 100;

    return {
      currentBalance: balance,
      interestRate: rate,
      dailyAccrual,
      monthlyAccrual,
      totalInterestPaid: Number(loan.totalInterestPaid),
      totalPrincipalPaid: Number(loan.totalPrincipalPaid),
      payoffAmount: Number(loan.payoffAmountCurrent ?? balance),
      nextPaymentDue: loan.nextPaymentDueDate,
    };
  }

  // ─── Private helpers ───────────────────────────────────────────

  private calculateNextAdjustmentDate(
    frequency: string | null,
  ): Date {
    const now = new Date();
    if (!frequency) {
      now.setFullYear(now.getFullYear() + 1);
      return now;
    }

    switch (frequency) {
      case 'monthly':
        now.setMonth(now.getMonth() + 1);
        break;
      case 'quarterly':
        now.setMonth(now.getMonth() + 3);
        break;
      case 'semi_annual':
        now.setMonth(now.getMonth() + 6);
        break;
      case 'annual':
        now.setFullYear(now.getFullYear() + 1);
        break;
      default:
        now.setFullYear(now.getFullYear() + 1);
    }
    return now;
  }

  private calculateRemainingTerm(loan: LoanMaster): number {
    const now = new Date();
    const maturity = new Date(loan.maturityDate);
    const monthsRemaining = Math.max(
      1,
      (maturity.getFullYear() - now.getFullYear()) * 12 +
        (maturity.getMonth() - now.getMonth()),
    );
    return monthsRemaining;
  }

  private calculateMonthlyPayment(
    principal: number,
    annualRate: number,
    termMonths: number,
  ): number {
    if (termMonths <= 0) return Math.round(principal * 100) / 100;

    const monthlyRate = annualRate / 12;
    if (monthlyRate === 0) {
      return Math.round((principal / termMonths) * 100) / 100;
    }

    const factor = Math.pow(1 + monthlyRate, termMonths);
    const payment =
      (principal * (monthlyRate * factor)) / (factor - 1);

    return Math.round(payment * 100) / 100;
  }
}
