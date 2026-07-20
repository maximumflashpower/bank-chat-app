import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('mobile_p2p_transfer')
export class MobileP2pTransfer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'varchar', length: 50, name: 'transfer_reference' })
  transferReference: string;

  @Index()
  @Column({ type: 'uuid', name: 'sender_id' })
  senderId: string;

  @Column({ type: 'uuid', name: 'sender_account_id' })
  senderAccountId: string;

  @Column({ type: 'varchar', length: 255, name: 'recipient_identifier' })
  recipientIdentifier: string; // phone or email

  @Column({ type: 'boolean', name: 'recipient_registered', default: false })
  recipientRegistered: boolean;

  @Column({ type: 'uuid', nullable: true, name: 'recipient_user_id' })
  recipientUserId: string;

  @Column({ type: 'uuid', nullable: true, name: 'recipient_account_id' })
  recipientAccountId: string;

  @Column({ type: 'numeric', precision: 18, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 3, default: 'USD' })
  currency: string;

  @Column({ type: 'text', nullable: true, name: 'sender_note' })
  senderNote: string;

  @Column({ type: 'varchar', length: 20, name: 'transfer_type' })
  transferType: string; // instant_internal / instant_external / invite_pending

  @Column({ type: 'boolean', name: 'invitation_sms_sent', default: false })
  invitationSmsSent: boolean;

  @Column({ type: 'boolean', name: 'invitation_email_sent', default: false })
  invitationEmailSent: boolean;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'invitation_link_token' })
  invitationLinkToken: string;

  @Column({ type: 'timestamptz', nullable: true, name: 'invitation_expires_at' })
  invitationExpiresAt: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'claimed_at' })
  claimedAt: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'returned_at' })
  returnedAt: Date;

  @Column({ type: 'varchar', length: 20, name: 'status', default: 'pending' })
  status: string; // pending / claimed / returned / expired / failed

  @Column({ type: 'uuid', nullable: true, name: 'ledger_journal_entry_id' })
  ledgerJournalEntryId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
