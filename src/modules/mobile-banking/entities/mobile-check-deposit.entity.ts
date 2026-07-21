import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('mobile_check_deposit')
export class MobileCheckDeposit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'varchar', length: 50, name: 'deposit_reference' })
  depositReference: string;

  @Index()
  @Column({ type: 'uuid', name: 'customer_id' })
  customerId: string;

  @Column({ type: 'uuid', name: 'account_id' })
  accountId: string;

  @Column({ type: 'numeric', precision: 18, scale: 2, name: 'check_amount' })
  checkAmount: number;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'check_number' })
  checkNumber: string;

  @Column({ type: 'date', nullable: true, name: 'check_date' })
  checkDate: Date;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'payer_name' })
  payerName: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'payer_account_number' })
  payerAccountNumber: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'payer_routing_number' })
  payerRoutingNumber: string;

  @Column({ type: 'text', name: 'front_image_url' })
  frontImageUrl: string;

  @Column({ type: 'text', name: 'back_image_url' })
  backImageUrl: string;

  @Column({ type: 'jsonb', nullable: true, name: 'ocr_extraction_json' })
  ocrExtractionJson: Record<string, any>;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true, name: 'ocr_confidence_score' })
  ocrConfidenceScore: number;

  @Column({ type: 'boolean', name: 'customer_confirmed_amount', default: false })
  customerConfirmedAmount: boolean;

  @Column({ type: 'varchar', length: 20, name: 'deposit_status', default: 'submitted' })
  depositStatus: string; // submitted / processing / accepted / rejected / funds_available

  @Column({ type: 'varchar', length: 200, nullable: true, name: 'rejection_reason' })
  rejectionReason: string;

  @Column({ type: 'date', nullable: true, name: 'hold_until_date' })
  holdUntilDate: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'funds_available_at' })
  fundsAvailableAt: Date;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: true, name: 'daily_limit_remaining' })
  dailyLimitRemaining: number;

  @CreateDateColumn({ name: 'submitted_at' })
  submittedAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
