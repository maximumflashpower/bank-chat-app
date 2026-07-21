import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CardRewards, RewardType } from '../entities/card-rewards.entity';

@Injectable()
export class RewardsService {
  private readonly logger = new Logger(RewardsService.name);

  constructor(
    @InjectRepository(CardRewards)
    private readonly repo: Repository<CardRewards>,
  ) {}

  async initializeForCard(cardId: string, rewardType: RewardType = RewardType.POINTS): Promise<CardRewards> {
    const existing = await this.repo.findOne({ where: { cardId } });
    if (existing) return existing;

    const rewards = this.repo.create({
      cardId,
      rewardType,
      balance: 0,
      pendingBalance: 0,
      lifetimeEarnings: 0,
      lifetimeRedemptions: 0,
      tierLevel: 'standard',
      multiplierBonus: 1,
    });

    return this.repo.save(rewards);
  }

  async findByCard(cardId: string): Promise<CardRewards> {
    const rewards = await this.repo.findOne({ where: { cardId } });
    if (!rewards) throw new NotFoundException(`Rewards for card ${cardId} not found`);
    return rewards;
  }

  async earnPoints(cardId: string, transactionAmount: number, multiplier: number = 1): Promise<CardRewards> {
    const rewards = await this.findByCard(cardId);
    
    const pointsEarned = Math.floor(transactionAmount * multiplier);
    rewards.pendingBalance += pointsEarned;
    rewards.lifetimeEarnings += pointsEarned;
    rewards.lastEarningAt = new Date();

    const saved = await this.repo.save(rewards);
    this.logger.log(`Points earned: card=${cardId}, amount=${transactionAmount}, points=${pointsEarned}`);
    return saved;
  }

  async confirmPending(cardId: string): Promise<CardRewards> {
    const rewards = await this.findByCard(cardId);
    rewards.balance += rewards.pendingBalance;
    rewards.pendingBalance = 0;
    return this.repo.save(rewards);
  }

  async redeemPoints(cardId: string, points: number, redemptionValue: number): Promise<CardRewards> {
    const rewards = await this.findByCard(cardId);

    if (points > rewards.balance) {
      throw new BadRequestException(`Insufficient points: balance=${rewards.balance}, requested=${points}`);
    }

    rewards.balance -= points;
    rewards.lifetimeRedemptions += redemptionValue;
    rewards.lastRedemptionAt = new Date();

    return this.repo.save(rewards);
  }

  async upgradeTier(cardId: string, newTier: string): Promise<CardRewards> {
    const rewards = await this.findByCard(cardId);
    rewards.tierLevel = newTier;
    rewards.multiplierBonus = this.getMultiplierForTier(newTier);
    return this.repo.save(rewards);
  }

  async expireOldPoints(cardId: string): Promise<number> {
    const rewards = await this.findByCard(cardId);

    if (!rewards.expirationDate) return 0;

    const now = new Date();
    if (now < rewards.expirationDate) return 0;

    const expired = rewards.balance;
    rewards.balance = 0;
    await this.repo.save(rewards);

    this.logger.log(`Points expired: card=${cardId}, amount=${expired}`);
    return expired;
  }

  async calculateCashback(cardId: string, percentage: number = 1.5): Promise<CardRewards> {
    const rewards = await this.findByCard(cardId);

    const cashback = (rewards.balance / 100) * (percentage / 100);
    rewards.pendingBalance += cashback;
    rewards.lastEarningAt = new Date();

    return this.repo.save(rewards);
  }

  async resetLifetimeStats(cardId: string): Promise<CardRewards> {
    const rewards = await this.findByCard(cardId);
    rewards.lifetimeEarnings = 0;
    rewards.lifetimeRedemptions = 0;
    return this.repo.save(rewards);
  }

  private getMultiplierForTier(tier: string): number {
    const multipliers: Record<string, number> = {
      standard: 1,
      silver: 1.25,
      gold: 1.5,
      platinum: 2,
      diamond: 3,
    };
    return multipliers[tier] || 1;
  }
}
