import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaxCalculationResult } from '../entities/tax-calculation-result.entity';
import { CalculateTaxDto } from '../dto/calculate-tax.dto';

@Injectable()
export class TaxCalculationService {
  constructor(
    @InjectRepository(TaxCalculationResult)
    private repo: Repository<TaxCalculationResult>,
  ) {}

  async calculate(dto: CalculateTaxDto): Promise<TaxCalculationResult> {
    const rate = await this.determineApplicableRate(dto);
    const taxAmount = dto.taxableAmount * rate;
    const totalAmount = dto.taxableAmount + taxAmount;

    const result = this.repo.create({
      ...dto,
      taxAmount,
      totalAmount,
      appliedRate: rate,
    });

    return this.repo.save(result);
  }

  async determineApplicableRate(dto: CalculateTaxDto): Promise<number> {
    const baseRate = 0.16;
    return dto.calculationMethod === 'included'
      ? dto.taxableAmount / (1 + baseRate) * baseRate / dto.taxableAmount
      : baseRate;
  }

  async findById(id: string): Promise<TaxCalculationResult | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findByTransaction(transactionId: string): Promise<TaxCalculationResult[]> {
    return this.repo.find({ where: { transactionId } });
  }
}
