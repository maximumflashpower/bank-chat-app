// src/modules/loans/services/charge-off.service.ts

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoanMaster } from '../entities/loan-master.entity.js';
import { LoanAmortizationSchedule } from '../entities/loan-amortization-schedule.entity.js';

@Injectable()
export class ChargeOffService {
  constructor(
    @InjectRepository(LoanMaster)
    private loanRepo: Repository<LoanMaster>,
    @InjectRepository(LoanAmortizationSchedule)
    private scheduleRepo: Repository<LoanAmortizationSchedule>,
  ) {}

  // ─── 1. Evaluate if loan should be charged off ─────────────────
  async evaluateForChargeOff(loanId: string): Promise<{
    eligible: boolean;
    reason: string | null;
    daysPastDue: number;
    recommendedAction: 'charge_off' | 'workout' | 'continue_monitoring';
  }> {
    const loan = await this.loanRepo.findOne({ where: { id: loanId } });
    if (!loan) throw new NotFoundException(`Loan ${loanId} not found`);

    const daysPastDue = loan.daysPastDue;
    
    if (daysPastDue >= 180) {
      return {
        eligible: true,
        reason: 'Exceeds 180 days past due threshold',
        daysPastDue,
        recommendedAction: 'charge_off',
      };
    }

    if (daysPastDue >= 120 && daysPastDue < 180) {
      return {
        eligible: false,
        reason: 'Warning period - approaching charge-off threshold',
        daysPastDue,
        recommendedAction: 'workout',
      };
    }

    if (daysPastDue >= 90) {
      return {
        eligible: false,
        reason: 'Delinquent but not yet eligible for charge-off',
        daysPastDue,
        recommendedAction: 'continue_monitoring',
      };
    }

    return {
      eligible: false,
      reason: null,
      daysPastDue,
      recommendedAction: 'continue_monitoring',
    };
  }

  // ─── 2. Process charge-off ─────────────────────────────────────
  async processChargeOff(
    loanId: string,
    recoveryEstimate: number = 0,
  ): Promise<{
    writeOffAmount: number;
    recoveryEstimate: number;
    chargedOffAt: Date;
    loanNumber: string;
  }> {
    const loan = await this.loanRepo.findOne({ where: { id: loanId } });
    if (!loan) throw new NotFoundException(`Loan ${loanId} not found`);

    if (loan.status === ('charged_off' as any)) {
      throw new BadRequestException(`Loan ${loanId} is already charged off`);
    }

    const balance = Number(
      loan.currentPrincipalBalance ?? loan.originalBalance,
    );
    const accruedInterest = Number(loan.totalInterestPaid) * 0.1; // Stub estimate
    const writeOffAmount = Math.round((balance + accruedInterest) * 100) / 100;

    // Mark loan as charged off
    loan.status = 'charged_off' as any;
    loan.closedAt = new Date();
    loan.payoffAmountCurrent = Math.round(recoveryEstimate * 100) / 100;

    await this.loanRepo.save(loan);

    // Update all remaining schedules to reflect charge-off
    const pendingSchedules = await this.scheduleRepo.find({
      where: { loanId, paymentStatus: 'scheduled' as any },
    });

    for (const sched of pendingSchedules) {
      sched.paymentStatus = 'charged_off' as any;
      await this.scheduleRepo.save(sched);
    }

    console.log(
      `CHARGE-OFF EVENT: loan=${loanId}, amount=${writeOffAmount}, recovery_estimate=${recoveryEstimate}`,
    );

    return {
      writeOffAmount,
      recoveryEstimate,
      chargedOffAt: new Date(),
      loanNumber: loan.loanNumber,
    };
  }

  // ─── 3. Record partial recovery ────────────────────────────────
  async recordRecovery(
    loanId: string,
    amount: number,
    source: string = 'collection',
  ): Promise<{
    recoveredAmount: number;
    totalRecoveredToDate: number;
    remainingWriteOff: number;
  }> {
    const loan = await this.loanRepo.findOne({ where: { id: loanId } });
    if (!loan) throw new NotFoundException(`Loan ${loanId} not found`);

    if (loan.status !== ('charged_off' as any)) {
      throw new BadRequestException(`Loan ${loanId} is not charged off`);
    }

    const currentRecovery = Number(loan.payoffAmountCurrent ?? 0);
    const totalRecovered = Math.round((currentRecovery + amount) * 100) / 100;
    
    // Original balance before charge-off (need to track this separately in production)
    const originalWriteOff = Number(loan.currentPrincipalBalance ?? loan.originalBalance) * 1.1; // Stub
    const remainingWriteOff = Math.round((originalWriteOff - totalRecovered) * 100) / 100;

    loan.payoffAmountCurrent = totalRecovered;

    await this.loanRepo.save(loan);

    console.log(
      `Recovery recorded: loan=${loan.loanNumber}, amount=${amount}, total=${totalRecovered}`,
    );

    return {
      recoveredAmount: amount,
      totalRecoveredToDate: totalRecovered,
      remainingWriteOff,
    };
  }

  // ─── 4. Calculate provision allowance ──────────────────────────
  async calculateProvisionAllowance(): Promise<{
    totalOutstanding: number;
    estimatedLoss: number;
    provisionRequired: number;
    breakdown: Array<{
      bucket: string;
      count: number;
      totalBalance: number;
      lossRate: number;
      estimatedLoss: number;
    }>;
  }> {
    const allLoans = await this.loanRepo.find();

    const buckets = [
      { name: 'current', daysMin: 0, daysMax: 29, lossRate: 0.01 },
      { name: 'past_due_30_59', daysMin: 30, daysMax: 59, lossRate: 0.05 },
      { name: 'past_due_60_89', daysMin: 60, daysMax: 89, lossRate: 0.15 },
      { name: 'past_due_90_plus', daysMin: 90, daysMax: 999, lossRate: 0.40 },
      { name: 'charged_off', daysMin: 999, daysMax: 9999, lossRate: 1.0 },
    ];

    let totalOutstanding = 0;
    let totalEstimatedLoss = 0;
    const breakdown = [];

    for (const bucket of buckets) {
      const bucketLoans = allLoans.filter(loan => {
        const days = loan.daysPastDue;
        const isChargedOff = loan.status === 'charged_off';
        
        if (bucket.name === 'charged_off' && isChargedOff) return true;
        if (bucket.name === 'current' && days < bucket.daysMin) return true;
        if (days >= bucket.daysMin && days <= bucket.daysMax) return true;
        return false;
      });

      const totalBalance = bucketLoans.reduce(
        (sum, loan) =>
          sum + Number(loan.currentPrincipalBalance ?? loan.originalBalance),
        0,
      );

      const estimatedLoss = totalBalance * bucket.lossRate;

      totalOutstanding += totalBalance;
      totalEstimatedLoss += estimatedLoss;

      breakdown.push({
        bucket: bucket.name,
        count: bucketLoans.length,
        totalBalance: Math.round(totalBalance * 100) / 100,
        lossRate: bucket.lossRate,
        estimatedLoss: Math.round(estimatedLoss * 100) / 100,
      });
    }

    return {
      totalOutstanding: Math.round(totalOutstanding * 100) / 100,
      estimatedLoss: Math.round(totalEstimatedLoss * 100) / 100,
      provisionRequired: Math.round(totalEstimatedLoss * 100) / 100,
      breakdown,
    };
  }

  // ─── 5. Get charge-off portfolio report ────────────────────────
  async getChargeOffPortfolioReport(): Promise<{
    totalChargedOff: number;
    totalRecovered: number;
    recoveryRate: number;
    averageTimeToChargeOff: number;
    loansByAge: Array<{
      ageRange: string;
      count: number;
      totalWrittenOff: number;
      totalRecovered: number;
    }>;
  }> {
    const chargedOffLoans = await this.loanRepo.find({
      where: { status: 'charged_off' as any },
    });

    let totalWrittenOff = 0;
    let totalRecovered = 0;

    const loansByAgeMap = new Map<
      string,
      { count: number; writtenOff: number; recovered: number }
    >([
      ['0-90_days', { count: 0, writtenOff: 0, recovered: 0 }],
      ['90-180_days', { count: 0, writtenOff: 0, recovered: 0 }],
      ['180-365_days', { count: 0, writtenOff: 0, recovered: 0 }],
      ['1-2_years', { count: 0, writtenOff: 0, recovered: 0 }],
      ['2+_years', { count: 0, writtenOff: 0, recovered: 0 }],
    ]);

    const now = new Date();
    let totalTimeToChargeOff = 0;

    for (const loan of chargedOffLoans) {
      const balance = Number(
        loan.currentPrincipalBalance ?? loan.originalBalance,
      );
      const recovery = Number(loan.payoffAmountCurrent ?? 0);

      totalWrittenOff += balance;
      totalRecovered += recovery;

      // Age calculation
      const chargedOffDate = loan.closedAt ?? loan.updatedAt;
      const ageDays = Math.floor(
        (now.getTime() - new Date(chargedOffDate).getTime()) /
          (1000 * 60 * 60 * 24),
      );

      let ageRange: string;
      if (ageDays <= 90) ageRange = '0-90_days';
      else if (ageDays <= 180) ageRange = '90-180_days';
      else if (ageDays <= 365) ageRange = '180-365_days';
      else if (ageDays <= 730) ageRange = '1-2_years';
      else ageRange = '2+_years';

      const ageData = loansByAgeMap.get(ageRange)!;
      ageData.count++;
      ageData.writtenOff += balance;
      ageData.recovered += recovery;

      // Time to charge-off (from origination to charge-off)
      const originationDate = loan.disbursementDate;
      const timeToChargeOff = Math.floor(
        (new Date(chargedOffDate).getTime() -
          new Date(originationDate).getTime()) /
          (1000 * 60 * 60 * 24),
      );
      totalTimeToChargeOff += timeToChargeOff;
    }

    const loansByAge = Array.from(loansByAgeMap.entries()).map(
      ([range, data]) => ({
        ageRange: range,
        count: data.count,
        totalWrittenOff: Math.round(data.writtenOff * 100) / 100,
        totalRecovered: Math.round(data.recovered * 100) / 100,
      }),
    );

    const recoveryRate =
      totalWrittenOff > 0 ? (totalRecovered / totalWrittenOff) * 100 : 0;
    const avgTimeToChargeOff =
      chargedOffLoans.length > 0
        ? Math.round(totalTimeToChargeOff / chargedOffLoans.length)
        : 0;

    return {
      totalChargedOff: Math.round(totalWrittenOff * 100) / 100,
      totalRecovered: Math.round(totalRecovered * 100) / 100,
      recoveryRate: Math.round(recoveryRate * 100) / 100,
      averageTimeToChargeOff: avgTimeToChargeOff,
      loansByAge,
    };
  }
}
