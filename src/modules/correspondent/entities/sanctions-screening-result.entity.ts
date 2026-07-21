import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('sanctions_screening_result')
export class SanctionsScreeningResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  correspondentBankId: string;

  @Column({ type: 'varchar', length: 255 })
  screenedEntityName: string;

  @Column({ type: 'varchar', length: 50 })
  screeningListSource: string; // OFAC, UN, EU, HMT, etc.

  @Column({ type: 'varchar', length: 11, nullable: true })
  screenedBic: string | null;

  @Column({ type: 'varchar', length: 2, nullable: true })
  screenedCountry: string | null;

  @Column({ type: 'numeric', precision: 5, scale: 2, default: 0 })
  matchScore: number; // 0-100%

  @Column({ type: 'varchar', length: 20, default: 'clear' })
  resultStatus: string; // clear / potential_match / confirmed_match / false_positive

  @Column({ type: 'varchar', length: 100, nullable: true })
  matchedListEntryId: string;

  @Column({ type: 'text', nullable: true })
  matchDetails: string;

  @Column({ type: 'boolean', default: false })
  escalated: boolean;

  @Column({ type: 'uuid', nullable: true })
  escalatedToUserId: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  resolutionAction: string; // cleared / blocked / reported_sar / exempted

  @Column({ type: 'text', nullable: true })
  resolutionNotes: string;

  @Column({ type: 'uuid', nullable: true })
  resolvedByUserId: string;

  @Column({ type: 'timestamptz', nullable: true })
  resolvedAt: Date;

  @Column({ type: 'boolean', default: false })
  sarFiled: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
