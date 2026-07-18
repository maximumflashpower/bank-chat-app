import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ConsolidationCurrencyTranslation,
  TranslationMethod,
  TranslationType,
} from '../entities/consolidation-currency-translation.entity';

@Injectable()
export class CurrencyTranslationService {
  private readonly logger = new Logger(CurrencyTranslationService.name);

  private readonly rateStore: Map<string, number> = new Map();

  constructor(
    @InjectRepository(ConsolidationCurrencyTranslation)
    private readonly repo: Repository<ConsolidationCurrencyTranslation>,
  ) {}

  async translate(
    runId: string,
    entityId: string,
    type: TranslationType,
    sourceCurrency: string,
    targetCurrency: string,
    method: TranslationMethod,
    originalAmount: number,
    exchangeRate?: number,
  ): Promise<ConsolidationCurrencyTranslation> {
    if (sourceCurrency === targetCurrency) {
      exchangeRate = 1;
    }

    if (!exchangeRate) {
      exchangeRate = this.getRate(sourceCurrency, targetCurrency, method);
      if (!exchangeRate) {
        throw new BadRequestException(
          `No exchange rate available for ${sourceCurrency}/${targetCurrency} (${method})`,
        );
      }
    }

    const translatedAmount = Math.round(originalAmount * exchangeRate * 100) / 100;

    const entry = this.repo.create({
      runId,
      entityId,
      translationType: type,
      sourceCurrency,
      targetCurrency,
      translationMethod: method,
      exchangeRate,
      originalAmount,
      translatedAmount,
      cumulativeTranslationAdj: 0,
      fxGainLoss: Math.round((translatedAmount - originalAmount) * 100) / 100,
      rateSource: 'internal',
      rateTimestamp: new Date(),
    });

    const saved = await this.repo.save(entry);
    this.logger.log(
      `Translation: ${sourceCurrency}→${targetCurrency}, amount=${originalAmount}→${translatedAmount}, rate=${exchangeRate}`,
    );
    return saved;
  }

  private getRate(from: string, to: string, method: TranslationMethod): number {
    if (from === to) return 1;
    const key = `${from}_${to}_${method}`;
    const rate = this.rateStore.get(key);
    if (rate) return rate;

    // Fallback: same rate for all methods (en producción: consumir API externa)
    const fallbackKey = `${from}_${to}`;
    return this.rateStore.get(fallbackKey) || 0;
  }

  setRate(from: string, to: string, rate: number, method?: TranslationMethod): void {
    if (method) {
      this.rateStore.set(`${from}_${to}_${method}`, rate);
    }
    this.rateStore.set(`${from}_${to}`, rate);
  }

  async findByRun(runId: string): Promise<ConsolidationCurrencyTranslation[]> {
    return this.repo.find({ where: { runId }, order: { createdAt: 'ASC' } });
  }

  async findByEntity(entityId: string): Promise<ConsolidationCurrencyTranslation[]> {
    return this.repo.find({ where: { entityId }, order: { createdAt: 'DESC' } });
  }

  async calculateCTA(runId: string): Promise<number> {
    const translations = await this.findByRun(runId);
    const cta = translations.reduce((sum, t) => sum + Number(t.cumulativeTranslationAdj || 0), 0);
    return Math.round(cta * 100) / 100;
  }

  async calculateFxGainLoss(runId: string): Promise<number> {
    const translations = await this.findByRun(runId);
    const total = translations.reduce((sum, t) => sum + Number(t.fxGainLoss || 0), 0);
    return Math.round(total * 100) / 100;
  }

  async bulkTranslate(
    runId: string,
    entityId: string,
    entries: Array<{
      type: TranslationType;
      sourceCurrency: string;
      targetCurrency: string;
      method: TranslationMethod;
      amount: number;
      exchangeRate?: number;
    }>,
  ): Promise<ConsolidationCurrencyTranslation[]> {
    const results: ConsolidationCurrencyTranslation[] = [];
    for (const entry of entries) {
      const result = await this.translate(
        runId,
        entityId,
        entry.type,
        entry.sourceCurrency,
        entry.targetCurrency,
        entry.method,
        entry.amount,
        entry.exchangeRate,
      );
      results.push(result);
    }
    this.logger.log(`Bulk translation completed: ${results.length} entries for entity ${entityId}`);
    return results;
  }
}
