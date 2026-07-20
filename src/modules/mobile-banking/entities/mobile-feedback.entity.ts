import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('mobile_feedback')
export class MobileFeedback {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'int' })
  rating: number; // 1-5 stars

  @Column({ type: 'varchar', length: 100, name: 'feedback_type' })
  feedbackType: string; // bug_report / feature_request / general / complaint / praise

  @Column({ type: 'text', nullable: true })
  comment: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'screen_context' })
  screenContext: string;

  @Column({ type: 'jsonb', nullable: true, name: 'device_info' })
  deviceInfo: Record<string, any>;

  @Column({ type: 'varchar', length: 20, name: 'status', default: 'open' })
  status: string; // open / reviewed / resolved / dismissed

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
