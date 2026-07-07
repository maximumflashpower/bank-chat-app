import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaxProductMapping } from '../entities/tax-product-mapping.entity';

@Injectable()
export class TaxProductMappingService {
  constructor(
    @InjectRepository(TaxProductMapping)
    private repo: Repository<TaxProductMapping>,
  ) {}

  async findBySku(productSku: string): Promise<TaxProductMapping | null> {
    return this.repo.findOne({ where: { productSku } });
  }

  async findByCountry(countryCode: string): Promise<TaxProductMapping[]> {
    const all = await this.repo.find();
    return all.filter(m =>
      !m.countryCodes || m.countryCodes.length === 0 || m.countryCodes.includes(countryCode)
    );
  }

  async create(data: Partial<TaxProductMapping>): Promise<TaxProductMapping> {
    const mapping = this.repo.create(data);
    return this.repo.save(mapping);
  }

  async update(id: string, data: Partial<TaxProductMapping>): Promise<TaxProductMapping | null> {
    await this.repo.update(id, data);
    return this.repo.findOne({ where: { id } });
  }
}
