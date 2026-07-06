import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccessReview } from '../entities/access-review.entity';
import { AccessReviewStatus } from '../entities/access-review-status.enum';
import { AccessReviewDto } from '../dto/access-review.dto';
import { AccessReviewSubmitDto } from '../dto/access-review-submit.dto';

@Injectable()
export class AccessReviewService {
  constructor(
    @InjectRepository(AccessReview)
    private readonly repo: Repository<AccessReview>,
  ) {}

  async createReview(dto: AccessReviewDto): Promise<AccessReview> {
    const review = this.repo.create({
      campaignName: dto.campaignName,
      targetUserIds: dto.targetUserIds,
      dueDate: new Date(dto.dueDate),
      justification: dto.justification ?? null,
      status: AccessReviewStatus.PENDING,
      reviewerId: '', // Will be set by controller context
      startedAt: new Date(),
      completedAt: null,
      remediatedAt: null,
    });
    return this.repo.save(review);
  }

  async submitReview(dto: AccessReviewSubmitDto): Promise<AccessReview> {
    await this.repo.update(dto.reviewId, {
      status: AccessReviewStatus.COMPLETED,
      completedAt: new Date(),
    });
    return this.repo.findOneOrFail({ where: { id: dto.reviewId } });
  }

  async getPendingReviews(): Promise<AccessReview[]> {
    return this.repo.find({
      where: { status: AccessReviewStatus.PENDING },
      order: { dueDate: 'ASC' },
    });
  }

  async detectPrivilegeCreep(userId: string): Promise<boolean> {
    // Placeholder: check role history for unusual additions
    return false;
  }

  async remediateExcessPermissions(reviewId: string): Promise<void> {
    const review = await this.repo.findOneOrFail({ where: { id: reviewId } });
    await this.repo.update(reviewId, {
      status: AccessReviewStatus.REMEDIATED,
      remediatedAt: new Date(),
    });
  }
}
