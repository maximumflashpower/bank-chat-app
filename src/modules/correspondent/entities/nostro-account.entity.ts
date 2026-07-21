import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('nostro_account')
export class NostroAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  nostroNumber: string;

  @Column({ type: 'uuid' })
  correspondentBankId: string;

  @Column({ type: 'varchar', length: 34, nullable: true })
  iban: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  accountNumberLocal: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  routingCodeSort: string;

  @Column({ type: 'varchar', length: 3 })
  currencyCode: string;

  @Column({ type: 'numeric', precision: 18, scale: 2, default: 0 })
  balanceAvailable: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, default: 0 })
  balanceLedger: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, default: 0 })
  balanceReserved: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: true })
  overdraftFacilityLimit: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, default: 0 })
  overdraftUtilized: number;

  @Column({ type: 'numeric', precision: 8, scale: 5, nullable: true })
  interestRateCredit: number;

  @Column({ type: 'numeric', precision: 8, scale: 5, nullable: true })
  interestRateDebit: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: true })
  minimumBalanceRequired: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: true })
  monthlyMaintenanceFee: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  statementFrequency: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  reconciliationMethod: string;

  @Column({ type: 'date', nullable: true })
  lastStatementDate: Date;

  @Column({ type: 'date', nullable: true })
  lastReconciliationDate: Date;

  @Column({ type: 'numeric', precision: 18, scale: 2, default: 0 })
  varianceLastClose: number;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
