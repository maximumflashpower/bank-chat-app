import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('remittance_instruction')
export class RemittanceInstruction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  remittanceNumber: string;

  @Column({ type: 'uuid' })
  originatingCustomerId: string;

  @Column({ type: 'uuid' })
  originatingAccountId: string;

  @Column({ type: 'varchar', length: 11, nullable: true })
  correspondentBankId: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  beneficiaryName: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  beneficiaryAccountNumber: string;

  @Column({ type: 'varchar', length: 11, nullable: true })
  beneficiaryBankBic: string;

  @Column({ type: 'varchar', length: 2, nullable: true })
  beneficiaryCountry: string;

  @Column({ type: 'numeric', precision: 18, scale: 2 })
  amountOriginal: number;

  @Column({ type: 'varchar', length: 3 })
  currencyOriginal: string;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: true })
  fxAmountSettled: number;

  @Column({ type: 'numeric', precision: 8, scale: 6, nullable: true })
  fxRateUsed: number;

  @Column({ type: 'varchar', length: 3, nullable: true })
  settledCurrency: string;

  @Column({ type: 'varchar', length: 20, default: 'normal' })
  urgency: string;

  @Column({ type: 'varchar', length: 30 })
  paymentChannel: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  gpiTrackingId: string;

  @Column({ type: 'char', length: 3, nullable: true })
  chargesBorneBy: string;

  @Column({ type: 'numeric', precision: 18, scale: 2, default: 0 })
  totalFeesAmount: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: true })
  totalLandedCost: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  purposeCode: string;

  @Column({ type: 'text', nullable: true })
  remitterNotes: string;

  @Column({ type: 'varchar', length: 20, default: 'initiated' })
  status: string;

  @Column({ type: 'jsonb', nullable: true })
  routeOptimization: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  feeBreakdown: Record<string, any>;

  @Column({ type: 'varchar', length: 50, nullable: true })
  selectedRoute: string;

  @Column({ type: 'timestamptz', nullable: true })
  executedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  confirmedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  beneficiaryCreditedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
