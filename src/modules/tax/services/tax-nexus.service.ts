import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaxJurisdictionRule } from '../entities/tax-jurisdiction-rule.entity';
import { RegisterNexusDto } from '../dto/register-nexus.dto';

@Injectable()
export class TaxNexusService {
  constructor(
    @InjectRepository(TaxJurisdictionRule)
    private repo: Repository<TaxJurisdictionRule>,
  ) {}

  async registerNexus(dto: RegisterNexusDto): Promise<TaxJurisdictionRule> {
    const nexus = this.repo.create({
      countryCode: dto.countryCode,
      regionState: dto.regionState,
      ruleType: 'Nexus',
      rateStandard: 0,
      rateReduced: 0,
      rateSuperReduced: 0,
      effectiveDate: dto.registrationDate ? new Date(dto.registrationDate) : new Date(),
      sourceLawReference: `Nexus: ${dto.nexusType}${dto.thresholdAmount ? `, Threshold: ${dto.thresholdAmount}` : ''}`,
      active: dto.active ?? true,
    });
    return this.repo.save(nexus);
  }

  async findNexusByCountry(countryCode: string): Promise<TaxJurisdictionRule[]> {
    return this.repo.find({ where: { countryCode, ruleType: 'Nexus' } });
  }

  async checkNexusObligation(countryCode: string, salesVolume: number): Promise<{ hasNexus: boolean; threshold?: number }> {
    const nexusRules = await this.findNexusByCountry(countryCode);
    if (nexusRules.length === 0) {
      return { hasNexus: false };
    }
    const thresholdMatch = nexusRules[0].sourceLawReference?.match(/Threshold:\s*([\d.]+)/);
    const threshold = thresholdMatch ? parseFloat(thresholdMatch[1]) : 0;
    return { hasNexus: salesVolume >= threshold, threshold };
  }
}
