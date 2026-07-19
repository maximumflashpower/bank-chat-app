import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerLoyaltyEnrollment, EnrollmentStatus } from '../entities/customer-loyalty-enrollment.entity';
import { LoyaltyProgram } from '../entities/loyalty-program.entity';
import { EnrollDto } from '../dto/enroll.dto';

@Injectable()
export class EnrollmentService {
  constructor(
    @InjectRepository(CustomerLoyaltyEnrollment)
    private enrollmentRepo: Repository<CustomerLoyaltyEnrollment>,
    @InjectRepository(LoyaltyProgram)
    private programRepo: Repository<LoyaltyProgram>,
  ) {}

  async enroll(dto: EnrollDto): Promise<CustomerLoyaltyEnrollment> {
    const program = await this.programRepo.findOne({ where: { id: dto.programId } });
    if (!program) throw new NotFoundException('Program not found');

    const existing = await this.enrollmentRepo.findOne({
      where: { customerId: dto.customerId, loyaltyProgramId: dto.programId },
    });

    if (existing && existing.status !== EnrollmentStatus.TERMINATED) {
      throw new BadRequestException('Customer already enrolled');
    }

    const enrollment = this.enrollmentRepo.create({
      loyaltyProgramId: dto.programId,
      customerId: dto.customerId,
      accountId: dto.accountId,
      currentTierLevel: 'silver',
      availablePointsBalance: 0,
      totalPointsEarnedLifetime: 0,
      totalPointsRedeemedLifetime: 0,
      status: EnrollmentStatus.ENROLLED,
      enrolledSource: dto.enrolledSource || 'api',
    });

    return this.enrollmentRepo.save(enrollment);
  }

  async findByCustomerId(customerId: string): Promise<CustomerLoyaltyEnrollment[]> {
    return this.enrollmentRepo.find({
      where: { customerId },
      order: { createdAt: 'DESC' },
    });
  }

  async getBalance(customerId: string, programId?: string): Promise<{
    totalAvailable: number;
    totalExpiringSoon: number;
    lifetimeEarned: number;
    lifetimeRedeemed: number;
  }> {
    const enrollments = programId
      ? [await this.getActiveEnrollment(customerId, programId)]
      : await this.findByCustomerId(customerId);

    let totalAvailable = 0;
    let totalExpiringSoon = 0;
    let lifetimeEarned = 0;
    let lifetimeRedeemed = 0;

    for (const e of enrollments) {
      totalAvailable += Number(e.availablePointsBalance);
      totalExpiringSoon += Number(e.expiringPointsSoon);
      lifetimeEarned += Number(e.totalPointsEarnedLifetime);
      lifetimeRedeemed += Number(e.totalPointsRedeemedLifetime);
    }

    return { totalAvailable, totalExpiringSoon, lifetimeEarned, lifetimeRedeemed };
  }

  async getActiveEnrollment(customerId: string, programId: string): Promise<CustomerLoyaltyEnrollment> {
    const enrollment = await this.enrollmentRepo.findOne({
      where: { customerId, loyaltyProgramId: programId },
    });
    if (!enrollment) throw new NotFoundException('Enrollment not found');
    return enrollment;
  }
}
