import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('mobile_appointment')
export class MobileAppointment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid', name: 'customer_id' })
  customerId: string;

  @Column({ type: 'uuid', name: 'branch_id' })
  branchId: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'advisor_name' })
  advisorName: string;

  @Column({ type: 'varchar', length: 100, name: 'appointment_type' })
  appointmentType: string; // account_opening / loan_consultation / investment_advisory / card_services / general

  @Column({ type: 'timestamptz', name: 'scheduled_at' })
  scheduledAt: Date;

  @Column({ type: 'int', nullable: true, name: 'duration_minutes' })
  durationMinutes: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'varchar', length: 20, name: 'status', default: 'scheduled' })
  status: string; // scheduled / confirmed / cancelled / completed / no_show

  @Column({ type: 'timestamptz', nullable: true, name: 'cancelled_at' })
  cancelledAt: Date;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'cancel_reason' })
  cancelReason: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
