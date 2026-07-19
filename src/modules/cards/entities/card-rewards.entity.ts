import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';

export enum RewardType {
  POINTS = 'points',
  CASHBACK = 'cashback',
  MILES = 'miles',
}

@Entity('card_rewards')
export class CardRewards extends BaseEntity {
  @Column({ name: 'card_id', type: 'uuid', unique: true, nullable: false })
  cardId: string;

  @Column({ name: 'reward_type', type: 'varchar', length: 20, nullable: false })
  rewardType: RewardType;

  @Column({ name: 'balance', type: 'numeric', precision: 18, scale: 2, default: 0 })
  balance: number;

  @Column({ name: 'pending_balance', type: 'numeric', precision: 18, scale: 2, default: 0 })
  pendingBalance: number;

  @Column({ name: 'lifetime_earnings', type: 'numeric', precision: 18, scale: 2, default: 0 })
  lifetimeEarnings: number;

  @Column({ name: 'lifetime_redemptions', type: 'numeric', precision: 18, scale: 2, default: 0 })
  lifetimeRedemptions: number;

  @Column({ name: 'expiration_date', type: 'timestamptz', nullable: true })
  expirationDate: Date | null;

  @Column({ name: 'tier_level', type: 'varchar', length: 20, default: 'standard' })
  tierLevel: string;

  @Column({ name: 'multiplier_bonus', type: 'numeric', precision: 3, scale: 2, default: 1 })
  multiplierBonus: number;

  @Column({ name: 'last_earning_at', type: 'timestamptz', nullable: true })
  lastEarningAt: Date | null;

  @Column({ name: 'last_redemption_at', type: 'timestamptz', nullable: true })
  lastRedemptionAt: Date | null;
}
