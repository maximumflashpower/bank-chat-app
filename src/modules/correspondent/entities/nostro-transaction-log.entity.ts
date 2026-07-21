import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('nostro_transaction_log')
export class NostroTransactionLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  nostroAccountId: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  transactionReferenceExt: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  transactionReferenceInt: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  gpiUtrid: string;

  @Column({ type: 'varchar', length: 30 })
  transactionType: string;

  @Column({ type: 'char', length: 1 })
  debitCreditIndicator: string;

  @Column({ type: 'numeric', precision: 18, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 3 })
  currencyIso: string;

  @Column({ type: 'date' })
  effectiveValueDate: Date;

  @Column({ type: 'date' })
  bookingDate: Date;

  @Column({ type: 'varchar', length: 11, nullable: true })
  counterpartyBankBic: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  counterpartyAccountNumber: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  counterpartyName: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  paymentPurposeCode: string;

  @Column({ type: 'char', length: 3, nullable: true })
  chargesBorneBy: string;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: true })
  ourChargesAmount: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: true })
  intermediaryChargesDeducted: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: true })
  beneficiaryReceivedAmount: number;

  @Column({ type: 'varchar', length: 10, nullable: true })
  swiftMessageMt: string;

  @Column({ type: 'uuid', nullable: true })
  swiftMessageXmlRef: string;

  @Column({ type: 'uuid', nullable: true })
  settlementBatchId: string;

  @Column({ type: 'uuid', nullable: true })
  internalLedgerEntryId: string;

  @Column({ type: 'varchar', length: 20, default: 'unmatched' })
  reconciliationStatus: string;

  @Column({ type: 'uuid', nullable: true })
  investigationCaseId: string;

  @Column({ type: 'timestamptz' })
  postedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
