import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaxJurisdictionRule } from '../entities/tax-jurisdiction-rule.entity';

interface RegulatoryChange {
  countryCode: string;
  effectiveDate: Date;
  oldRate: number;
  newRate: number;
  lawReference: string;
  impactAssessment?: string;
}

const regulatoryChanges: RegulatoryChange[] = [];

@Injectable()
export class TaxRegulatoryService {
  constructor(
    @InjectRepository(TaxJurisdictionRule)
    private repo: Repository<TaxJurisdictionRule>,
  ) {}

  async recordRegulatoryChange(change: RegulatoryChange): Promise<void> {
    regulatoryChanges.push(change);
  }

  async getHistoricalChanges(countryCode: string): Promise<RegulatoryChange[]> {
    return regulatoryChanges.filter(c => c.countryCode === countryCode);
  }

  async getCurrentRate(countryCode: string, ruleType: string): Promise<number> {
    const today = new Date();
    const rules = await this.repo.find({
      where: {
        countryCode,
        ruleType,
        active: true,
      },
      order: { effectiveDate: 'DESC' },
    });

    for (const rule of rules) {
      if (rule.effectiveDate <= today && (!rule.expirationDate || rule.expirationDate >= today)) {
        return rule.rateStandard;
      }
    }
    return 0;
  }

  async assessImpact(oldRate: number, newRate: number, taxableBase: number): Promise<{
    deltaTax: number;
    percentageIncrease: number;
  }> {
    const oldTax = taxableBase * oldRate;
    const newTax = taxableBase * newRate;
    const deltaTax = newTax - oldTax;
    const percentageIncrease = oldRate > 0 ? ((newRate - oldRate) / oldRate) * 100 : 0;
    return { deltaTax, percentageIncrease };
  }
}
