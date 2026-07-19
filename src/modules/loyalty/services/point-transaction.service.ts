import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoyaltyPointTransaction, PointTransactionType } from '../entities/loyalty-point-transaction.entity';
import { CustomerLoyaltyEnrollment } from '../entities/customer-loyalty-enrollment.entity';

@Injectable()
export class PointTransactionService {
  constructor(
    @InjectRepository(LoyaltyPointTransaction)
    private repo: Repository<LoyaltyPointTransaction>,
    @InjectRepository(CustomerLoyaltyEnrollment)
    private enrollmentRepo: Repository<CustomerLoyaltyEnrollment>,
  ) {}

  async earn(dto: {
    enrollmentId: string;
    programId: string;
    customerId: string;
    points: number;
    multiplier?: number;
    sourceTransactionId?: string;
    description?: string;
  }): Promise<LoyaltyPointTransaction> {
    const enrollment = await this.enrollmentRepo.findOne({ where: { id: dto.enrollmentId } });
    if (!enrollment) throw new BadRequestException('Enrollment not found');

    const actualPoints = dto.points * (dto.multiplier || 1);

    const transaction = this.repo.create({
      enrollmentId: dto.enrollmentId,
      programId: dto.programId,
      customerId: dto.customerId,
      pointTransactionType: PointTransactionType.EARN,
      pointsEarned: actualPoints,
      netPoints: actualPoints,
      multiplierApplied: dto.multiplier || 1,
      sourceTransactionId: dto.sourceTransactionId || null,
      description: dto.description || null,
    });

    const saved = await this.repo.save(transaction);

    enrollment.availablePointsBalance = Number(enrollment.availablePointsBalance) + actualPoints;
    enrollment.totalPointsEarnedLifetime = Number(enrollment.totalPointsEarnedLifetime) + actualPoints;
    await this.enrollmentRepo.save(enrollment);

    return saved;
  }

  async redeem(dto: {
    enrollmentId: string;
    programId: string;
    customerId: string;
    points: number;
    redemptionReferenceId?: string;
  }): Promise<LoyaltyPointTransaction> {
    const enrollment = await this.enrollmentRepo.findOne({ where: { id: dto.enrollmentId } });
    if (!enrollment) throw new BadRequestException('Enrollment not found');

    if (Number(enrollment.availablePointsBalance) < dto.points) {
      throw new BadRequestException('Insufficient points');
    }

    const transaction = this.repo.create({
      enrollmentId: dto.enrollmentId,
      programId: dto.programId,
      customerId: dto.customerId,
      pointTransactionType: PointTransactionType.REDEEM,
      pointsRedeemed: dto.points,
      netPoints: -dto.points,
      redemptionReferenceId: dto.redemptionReferenceId || null,
    });

    const saved = await this.repo.save(transaction);

    enrollment.availablePointsBalance = Number(enrollment.availablePointsBalance) - dto.points;
    enrollment.totalPointsRedeemedLifetime = Number(enrollment.totalPointsRedeemedLifetime) + dto.points;
    await this.enrollmentRepo.save(enrollment);

    return saved;
  }

  async findByEnrollment(enrollmentId: string): Promise<LoyaltyPointTransaction[]> {
    return this.repo.find({
      where: { enrollmentId },
      order: { transactionDate: 'DESC' },
    });
  }
}
