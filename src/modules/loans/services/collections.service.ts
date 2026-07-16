// src/modules/loans/services/collections.service.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoanDelinquencyEvent } from '../entities/loan-delinquency-event.entity.js';
import { LoanMaster } from '../entities/loan-master.entity.js';
import { DelinquencyStatus, LoanStatus, DelinquencyEventType } from '../entities/loans.enums.js';

@Injectable()
export class CollectionsService {
  constructor(
    @InjectRepository(LoanDelinquencyEvent)
    private readonly eventRepo: Repository<LoanDelinquencyEvent>,
    @InjectRepository(LoanMaster)
    private readonly loanRepo: Repository<LoanMaster>,
  ) {}

  async logDelinquencyEvent(
    loanId: string,
    daysPastDue: number,
    eventType: string,
    amountPastDue?: number,
  ): Promise<LoanDelinquencyEvent> {
    const event = this.eventRepo.create({
      loanId,
      eventType: eventType as DelinquencyEventType,
      daysPastDueAtEvent: daysPastDue,
      amountPastDue: amountPastDue || 0,
      eventTimestamp: new Date(),
    });
    await this.eventRepo.save(event);
    
    const loan = await this.loanRepo.findOne({ where: { id: loanId } });
    if (loan) {
      loan.daysPastDue = daysPastDue;
      loan.delinquencyStatus = this.mapDelinquencyStatus(daysPastDue) as DelinquencyStatus;
      await this.loanRepo.save(loan);
    }
    
    return event;
  }

  private mapDelinquencyStatus(days: number): string {
    if (days <= 30) return DelinquencyStatus.DAYS_1_30;
    if (days <= 60) return DelinquencyStatus.DAYS_31_60;
    if (days <= 90) return DelinquencyStatus.DAYS_61_90;
    return DelinquencyStatus.DAYS_90_PLUS;
  }

  async escalateCollection(loanId: string, action: string, channels: string[]): Promise<LoanDelinquencyEvent> {
    const loan = await this.loanRepo.findOne({ where: { id: loanId } });
    if (!loan) throw new Error('Loan not found');
    
    return this.logDelinquencyEvent(loanId, loan.daysPastDue, 'escalated', 0);
  }

  async processChargeOff(loanId: string, chargeOffAmount: number): Promise<void> {
    const loan = await this.loanRepo.findOne({ where: { id: loanId } });
    if (!loan) throw new Error('Loan not found');
    
    loan.status = LoanStatus.CHARGED_OFF;
    loan.currentPrincipalBalance = 0;
    await this.loanRepo.save(loan);
    
    await this.eventRepo.save({
      loanId,
      eventType: DelinquencyEventType.CHARGE_OFF,
      chargeOffAmount,
      eventTimestamp: new Date(),
    } as any);
  }

  async processRecovery(loanId: string, recoveryAmount: number): Promise<void> {
    const events = await this.eventRepo.find({ where: { loanId } });
    const chargeOffEvent = events.find(e => e.eventType === DelinquencyEventType.CHARGE_OFF);
    if (chargeOffEvent) {
      chargeOffEvent.recoveryAmount = (chargeOffEvent.recoveryAmount || 0) + recoveryAmount;
      await this.eventRepo.save(chargeOffEvent);
    }
  }

  async enrollHardship(loanId: string, program: string): Promise<void> {
    await this.eventRepo.save({
      loanId,
      eventType: DelinquencyEventType.ENTERED_DELINQUENCY,
      hardshipRequestFlag: true,
      hardshipProgramEnrolled: program,
      eventTimestamp: new Date(),
    } as any);
  }
}
