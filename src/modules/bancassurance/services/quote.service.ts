import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InsuranceQuote, QuoteStatus } from '../entities/insurance-quote.entity';
import { InsuranceProduct } from '../entities/insurance-product.entity';
import { QuoteDto } from '../dto/quote.dto';

@Injectable()
export class QuoteService {
  constructor(
    @InjectRepository(InsuranceQuote)
    private quoteRepo: Repository<InsuranceQuote>,
    @InjectRepository(InsuranceProduct)
    private productRepo: Repository<InsuranceProduct>,
  ) {}

  async getProducts(): Promise<InsuranceProduct[]> {
    return this.productRepo.find({ where: { isActive: true } });
  }

  async getProduct(productId: number): Promise<InsuranceProduct> {
    const product = await this.productRepo.findOneBy({ id: productId as any });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async quote(dto: QuoteDto): Promise<InsuranceQuote> {
    const product = await this.getProduct(dto.productId);

    const riskScore = this.calculateRiskScore(dto.riskData);
    const dynamicPremium = this.applyDynamicPricing(product.basePremium, riskScore, dto.coverageLevel);

    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 30);

    const quote = this.quoteRepo.create({
      userId: dto.userId,
      productId: dto.productId,
      riskData: dto.riskData,
      coverageLevel: dto.coverageLevel,
      quotedPremium: dynamicPremium,
      currency: product.currency,
      deductible: dto.deductible || null,
      coverageLimits: product.coverageLevels[dto.coverageLevel] || null,
      validUntil,
      status: QuoteStatus.QUOTED,
    });

    return this.quoteRepo.save(quote);
  }

  async getQuoteById(id: string): Promise<InsuranceQuote> {
    const quote = await this.quoteRepo.findOne({ where: { id } });
    if (!quote) throw new NotFoundException('Quote not found');
    return quote;
  }

  async getQuotesByUser(userId: string): Promise<InsuranceQuote[]> {
    return this.quoteRepo.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }

  async markConverted(quoteId: string): Promise<void> {
    const quote = await this.getQuoteById(quoteId);
    quote.status = QuoteStatus.CONVERTED;
    await this.quoteRepo.save(quote);
  }

  private calculateRiskScore(riskData: Record<string, any>): number {
    let score = 50;
    if (riskData.age) {
      if (riskData.age < 25) score += 30;
      else if (riskData.age > 60) score += 20;
      else score -= 10;
    }
    if (riskData.claimHistory) score += riskData.claimHistory * 15;
    if (riskData.vehicleAge && riskData.vehicleAge > 10) score += 20;
    if (riskData.location === 'high_risk') score += 25;
    return Math.min(Math.max(score, 1), 100);
  }

  private applyDynamicPricing(basePremium: number, riskScore: number, coverageLevel: string): number {
    const riskMultiplier = 1 + (riskScore / 100);
    const coverageMultiplier = coverageLevel === 'premium' ? 1.5 : coverageLevel === 'plus' ? 1.25 : 1.0;
    const premium = Number(basePremium) * riskMultiplier * coverageMultiplier;
    return Math.round(premium * 100) / 100;
  }
}
