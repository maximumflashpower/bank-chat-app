import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaxDeclarationPeriod } from '../entities/tax-declaration-period.entity';
import { GenerateDeclarationDto } from '../dto/generate-declaration.dto';

@Injectable()
export class TaxDeclarationService {
  constructor(
    @InjectRepository(TaxDeclarationPeriod)
    private repo: Repository<TaxDeclarationPeriod>,
  ) {}

  async generate(dto: GenerateDeclarationDto): Promise<TaxDeclarationPeriod> {
    const declaration = this.repo.create({
      ...dto,
      status: 'computed',
    });
    return this.repo.save(declaration);
  }

  async findAll(countryCode?: string, fiscalYear?: number): Promise<TaxDeclarationPeriod[]> {
    const qb = this.repo.createQueryBuilder('decl');
    
    if (countryCode) {
      qb.where('decl.countryCode = :country', { country: countryCode });
    }
    if (fiscalYear) {
      qb.andWhere('decl.fiscalYear = :year', { year: fiscalYear });
    }

    return qb.orderBy('decl.fiscalYear', 'DESC').addOrderBy('decl.periodNumber', 'DESC').getMany();
  }

  async findById(id: string): Promise<TaxDeclarationPeriod | null> {
    return this.repo.findOne({ where: { id } });
  }

  async file(id: string, submittedBy: string, filingReference: string): Promise<void> {
    await this.repo.update(id, {
      status: 'submitted',
      filedAt: new Date(),
      filingReference,
      reviewedBy: submittedBy,
    });
  }
}
