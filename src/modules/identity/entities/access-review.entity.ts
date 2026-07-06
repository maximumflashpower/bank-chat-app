import { Entity, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/base.entity';
import { AccessReviewStatus } from './access-review-status.enum';

@Entity({ name: 'gov_access_review' })
export class AccessReview extends BaseEntity {
  @ApiProperty({ type: () => String })
  @Column({ name: 'reviewer_id', type: 'uuid' })
  reviewerId: string;

  @ApiProperty({ type: () => [String] })
  @Column({ name: 'target_user_ids', type: 'uuid', array: true })
  targetUserIds: string[];

  @ApiProperty({ example: 'quarterly_q3_2026' })
  @Column({ name: 'campaign_name', type: 'varchar', length: 100 })
  campaignName: string;

  @ApiProperty({ enum: AccessReviewStatus, default: AccessReviewStatus.PENDING })
  @Column({ name: 'status', type: 'varchar', length: 20, default: AccessReviewStatus.PENDING })
  status: AccessReviewStatus;

  @ApiProperty({ example: 'Quarterly access review for department ABC' })
  @Column({ name: 'justification', type: 'text', nullable: true })
  justification: string | null;

  @ApiProperty({ type: () => Date })
  @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
  startedAt: Date | null;

  @ApiProperty({ type: () => Date })
  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @ApiProperty({ type: () => Date })
  @Column({ name: 'due_date', type: 'timestamptz' })
  dueDate: Date;

  @ApiProperty({ type: () => Date })
  @Column({ name: 'remediated_at', type: 'timestamptz', nullable: true })
  remediatedAt: Date | null;
}
