import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrmOpportunity, OpportunityType, OpportunityStage, PreviousOfferResult } from '../entities/crm-opportunity.entity.js';

@Injectable()
export class NbaOpportunityService {
  constructor(
    @InjectRepository(CrmOpportunity)
    private repo: Repository<CrmOpportunity>,
  ) {}

  async getNextBestAction(customerId: string): Promise<any> {
    return {
      suggestedProduct: 'premium_credit_card',
      reason: 'High transaction volume and good payment history indicate readiness for upgrade',
      probabilityAcceptance: 0.78,
      customerHasProducts: ['checking', 'debit_card'],
    };
  }

  async createOpportunity(data: {
    customerId: string;
    productSuggested: string;
    opportunityType: OpportunityType;
    advisorId: string;
    estimatedValue?: number;
  }): Promise<CrmOpportunity> {
    const opp = new CrmOpportunity();
    opp.opportunityNumber = `OPP-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(Math.random()*100000)}`;
    opp.customerId = data.customerId;
    opp.productSuggested = data.productSuggested;
    opp.opportunityType = data.opportunityType;
    opp.advisorId = data.advisorId;
    opp.estimatedValue = data.estimatedValue || 0;
    opp.stage = OpportunityStage.IDENTIFIED;
    opp.previouslyOffered = false;
    return this.repo.save(opp);
  }

  async getPipeline(advisorId?: string): Promise<any[]> {
    return [{ stage: 'qualified', count: 12, estimatedValue: 45000 }];
  }

  async advanceStage(opportunityId: string, stage: OpportunityStage): Promise<void> {
    await this.repo.update({ id: opportunityId }, { stage } as any);
  }

  async setResult(opportunityId: string, result: 'accepted' | 'rejected' | 'pending'): Promise<void> {
    await this.repo.update({ id: opportunityId }, { 
      previousOfferResult: result === 'accepted' ? PreviousOfferResult.ACCEPTED : result === 'rejected' ? PreviousOfferResult.DECLINED : PreviousOfferResult.PENDING,
      stage: result === 'accepted' ? OpportunityStage.CLOSED_WON : OpportunityStage.CLOSED_LOST,
      closedAt: new Date(),
    } as any);
  }

  async getProductOverlap(customerId: string, suggestedProduct: string): Promise<{ overlap: boolean; existingProducts: string[] }> {
    return { overlap: false, existingProducts: [] };
  }

  async learnFromOutcome(opportunityId: string, outcome: 'accepted' | 'declined', feedback: string): Promise<void> {
    await this.repo.update({ id: opportunityId }, { closureReason: feedback } as any);
  }

  async checkPreviousOffers(customerId: string, product: string): Promise<{ offered: boolean; result?: PreviousOfferResult }> {
    return { offered: false };
  }
}
