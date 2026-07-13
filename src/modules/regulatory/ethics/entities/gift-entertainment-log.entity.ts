import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from '../../../../common/base.entity';

@Entity('reg_gift_logs')
export class GiftEntertainmentLog extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @Column({ type: 'uuid' })
  employeeId: string;

  @Column({ type: 'varchar', length: 30 })
  giftType: string;

  @Column({ type: 'text' })
  giftDescription: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  giftValue: number;

  @Column({ type: 'varchar', length: 255 })
  recipientName: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  recipientCompany: string;

  @Column({ type: 'text' })
  businessPurpose: string;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  approvalStatus: string;

  @Column({ type: 'uuid', nullable: true })
  approvedBy: string;

  @Column({ type: 'date', nullable: true })
  eventDate: Date;

  @Column({ type: 'boolean', default: false })
  politicalContribution: boolean;
}
