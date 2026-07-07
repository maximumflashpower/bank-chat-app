import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CashflowClassificationLog } from '../entities/cashflow-classification-log.entity';
import { CashflowProjectionDto } from '../dto/cashflow-projection.dto';

@Injectable()
export class CashflowClassificationService {
  constructor(
    @InjectRepository(CashflowClassificationLog)
    private repo: Repository<CashflowClassificationLog>,
  ) {}

  async classify(transactionId: string, description: string, amount: number): Promise<CashflowClassificationLog> {
    const category = this.predictCategory(description, amount);
    const confidence = this.calculateConfidence(description);

    const log = this.repo.create({
      transactionId,
      counterpartyName: description,
      amountOriginal: amount,
      currencyOriginal: 'USD',
      classifiedCategory: category,
      mlPredictionConfidence: confidence,
      classificationMethod: 'AUTO_ML',
    });

    return this.repo.save(log);
  }

  private predictCategory(description: string, amount: number): string {
    const lower = description.toLowerCase();
    if (lower.includes('salary') || lower.includes('rent') || lower.includes('utilities')) return 'operating';
    if (lower.includes('equipment') || lower.includes('asset') || lower.includes('property')) return 'investing';
    if (lower.includes('loan') || lower.includes('dividend') || lower.includes('interest')) return 'financing';
    return 'operating';
  }

  private calculateConfidence(description: string): number {
    return description.length > 10 ? 88.5 : 72.0;
  }

  async project(dto: CashflowProjectionDto): Promise<{
    projectedBalance: number;
    inflow: number;
    outflow: number;
    period: string;
  }> {
    const months = dto.projectedPeriodMonths ?? 3;
    const avgMonthlyFlow = dto.currentBalance * 0.1;

    return {
      projectedBalance: dto.currentBalance + avgMonthlyFlow * months,
      inflow: avgMonthlyFlow * months * 0.6,
      outflow: avgMonthlyFlow * months * 0.4,
      period: `${months}M`,
    };
  }

  async listByCategory(category: string): Promise<CashflowClassificationLog[]> {
    return this.repo.find({ where: { classifiedCategory: category } });
  }
}
