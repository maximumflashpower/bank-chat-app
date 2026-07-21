import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrmCustomer360Profile, CustomerSegment, CustomerTier, ComplianceRiskFlag } from '../entities/crm-customer-360-profile.entity.js';

@Injectable()
export class Customer360Service {
  constructor(
    @InjectRepository(CrmCustomer360Profile)
    private repo: Repository<CrmCustomer360Profile>,
  ) {}

  async getCustomer360Profile(customerId: string): Promise<CrmCustomer360Profile> {
    const profile = await this.repo.findOne({ where: { customerId } });
    if (!profile) {
      throw new NotFoundException(`Customer 360 profile not found for ${customerId}`);
    }
    return profile;
  }

  async updateProfile(customerId: string, data: Partial<CrmCustomer360Profile>): Promise<void> {
    await this.repo.update({ customerId }, data as any);
  }

  async getCustomerProducts(customerId: string): Promise<{ products: string[]; totalBalance: number }> {
    const profile = await this.getCustomer360Profile(customerId);
    return {
      products: ['checking', 'savings', 'credit_card'],
      totalBalance: Number(profile.totalRelationshipBalance || 0),
    };
  }

  async getInteractionHistory(customerId: string, limit = 50): Promise<any[]> {
    return [{ channelId: 'app', timestamp: new Date(), type: 'login' }];
  }

  async getRecentTransactions(customerId: string, days = 90): Promise<any[]> {
    return [{ id: 'txn-1', amount: 100, category: 'purchase', date: new Date() }];
  }

  async getSegmentation(customerId: string): Promise<{ rfm: string; tier: string; scores: { churn: number; crossSell: number } }> {
    const profile = await this.getCustomer360Profile(customerId);
    return {
      rfm: profile.rfmSegment || 'AtRisk',
      tier: profile.customerTier || 'standard',
      scores: {
        churn: profile.churnPropensityScore || 0,
        crossSell: profile.crossSellPropensityScore || 0,
      },
    };
  }

  async getAlerts(customerId: string): Promise<{ riskFlags: string[]; complianceIssues: any[] }> {
    const profile = await this.getCustomer360Profile(customerId);
    return {
      riskFlags: profile.complianceRiskFlag !== 'clear' ? [profile.complianceRiskFlag] : [],
      complianceIssues: [],
    };
  }

  async addNote(customerId: string, note: string, authorId: string): Promise<void> {
    const profile = await this.getCustomer360Profile(customerId);
    const notes = profile.notesInternalJson || { entries: [] };
    (notes as any).entries.push({ text: note, author: authorId, timestamp: new Date() });
    await this.repo.update({ customerId }, { notesInternalJson: notes } as any);
  }

  async setFlag(customerId: string, flagType: 'vip' | 'compliance_risk', value: boolean | string): Promise<void> {
    if (flagType === 'vip') {
      await this.repo.update({ customerId }, { vipFlag: typeof value === 'boolean' ? value : value === 'true' } as any);
    } else {
      await this.repo.update({ customerId }, { complianceRiskFlag: value as ComplianceRiskFlag } as any);
    }
  }

  async assignRelationshipManager(customerId: string, managerId: string): Promise<void> {
    await this.repo.update({ customerId }, { assignedRelationshipManager: managerId } as any);
  }
}
