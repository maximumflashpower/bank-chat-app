import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoyaltyPromotion, PromotionStatus } from '../entities/loyalty-promotion.entity';
import { CreatePromotionDto } from '../dto/create-promotion.dto';

@Injectable()
export class PromotionService {
  constructor(
    @InjectRepository(LoyaltyPromotion)
    private repo: Repository<LoyaltyPromotion>,
  ) {}

  async create(dto: CreatePromotionDto): Promise<LoyaltyPromotion> {
    const promotion = this.repo.create(dto);
    return this.repo.save(promotion);
  }

  async findAll(activeOnly?: boolean): Promise<LoyaltyPromotion[]> {
    if (activeOnly) {
      return this.repo.find({
        where: { status: PromotionStatus.ACTIVE },
        order: { startDate: 'ASC' },
      });
    }
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async findById(id: string): Promise<LoyaltyPromotion> {
    const promotion = await this.repo.findOne({ where: { id } });
    if (!promotion) throw new NotFoundException('Promotion not found');
    return promotion;
  }

  async activate(id: string): Promise<LoyaltyPromotion> {
    const promotion = await this.findById(id);
    promotion.status = PromotionStatus.ACTIVE;
    promotion.activatedAt = new Date();
    return this.repo.save(promotion);
  }

  async pause(id: string): Promise<LoyaltyPromotion> {
    const promotion = await this.findById(id);
    promotion.status = PromotionStatus.PAUSED;
    promotion.pausedAt = new Date();
    return this.repo.save(promotion);
  }

  async cancel(id: string): Promise<LoyaltyPromotion> {
    const promotion = await this.findById(id);
    promotion.status = PromotionStatus.CANCELLED;
    return this.repo.save(promotion);
  }

  async checkEligibility(promotionId: string, customerId: string, tier?: string): Promise<{
    eligible: boolean;
    reason?: string;
  }> {
    const promotion = await this.findById(promotionId);
    
    if (promotion.status !== PromotionStatus.ACTIVE) {
      return { eligible: false, reason: 'Promoción no activa' };
    }

    const now = new Date();
    if (now < promotion.startDate || now > promotion.endDate) {
      return { eligible: false, reason: 'Fuera del período promocional' };
    }

    if (promotion.eligibleTiers && promotion.eligibleTiers.length > 0 && tier) {
      if (!promotion.eligibleTiers.includes(tier)) {
        return { eligible: false, reason: 'Tier no elegible' };
      }
    }

    if (promotion.maxBonusPerCustomer && promotion.pointsAwardedSoFar >= promotion.totalBudgetPoints!) {
      return { eligible: false, reason: 'Presupuesto agotado' };
    }

    return { eligible: true };
  }
}
