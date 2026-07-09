import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { AlertType } from './alert-type.enum';
import { AlertStatus } from './alert-status.enum';
import { AlertPriority } from './alert-priority.enum';

@Entity('aml_alerts')
export class AmlAlert {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'alert_type', type: 'varchar', length: 50 })
  alertType: AlertType;

  @Column({ name: 'transaction_ids', type: 'uuid', array: true })
  transactionIds: string[];

  @Column({ name: 'rule_id', type: 'varchar', length: 100, nullable: true })
  ruleId: string;

  @Column({ name: 'risk_score', type: 'numeric', precision: 4, scale: 2 })
  riskScore: number;

  @Column({ type: 'varchar', length: 20, default: AlertStatus.OPEN })
  status: AlertStatus;

  @Column({ name: 'assigned_to', type: 'uuid', nullable: true })
  assignedTo: string;

  @Column({ type: 'varchar', length: 10, default: AlertPriority.MEDIUM })
  priority: AlertPriority;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'false_positive', type: 'boolean', default: false })
  falsePositive: boolean;

  @Column({ name: 'resolved_at', type: 'timestamptz', nullable: true })
  resolvedAt: Date;

  @Column({ name: 'resolution_notes', type: 'text', nullable: true })
  resolutionNotes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
