import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaxJurisdictionRule } from '../entities/tax-jurisdiction-rule.entity';
import { CreateTaxRateDto } from '../dto/create-tax-rate.dto';

@Injectable()
export class TaxJurisdictionService {
  constructor(
    @InjectRepository(TaxJurisdictionRule)
    private repo: Repository<TaxJurisdictionRule>,
  ) {}

  async create(dto: CreateTaxRateDto): Promise<TaxJurisdictionRule> {
    const rule = this.repo.create({
      ...dto,
      effectiveDate: new Date(dto.effectiveDate),
      expirationDate: dto.expirationDate ? new Date(dto.expirationDate) : undefined,
    });
    return this.repo.save(rule);
  }

  async findByCountry(countryCode: string): Promise<TaxJurisdictionRule[]> {
    return this.repo.find({ where: { countryCode }, order: { effectiveDate: 'DESC' } });
  }

  async findActiveForLocation(params: {
    countryCode: string;
    regionState?: string;
    cityMunicipality?: string;
    zipPostalCode?: string;
  }): Promise<TaxJurisdictionRule | null> {
    const today = new Date();
    const qb = this.repo.createQueryBuilder('rule');
    
    qb.where('rule.countryCode = :country', { country: params.countryCode })
      .andWhere('rule.active = :active', { active: true })
      .andWhere('rule.effectiveDate <= :today', { today })
      .orderBy('CASE WHEN rule.regionState IS NULL THEN 1 ELSE 0 END', 'ASC')
      .limit(1);

    if (params.regionState) {
      qb.andWhere('(rule.regionState = :region OR rule.regionState IS NULL)', { region: params.regionState });
    }

    return qb.getOne();
  }

  async update(rateId: string, dto: Partial<CreateTaxRateDto>): Promise<TaxJurisdictionRule | null> {
    await this.repo.update(rateId, dto);
    return this.repo.findOne({ where: { id: rateId } });
  }
}
