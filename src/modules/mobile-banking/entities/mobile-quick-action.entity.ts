import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('mobile_quick_action')
export class MobileQuickAction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'varchar', length: 50, name: 'action_type' })
  actionType: string; // transfer / pay_bill / deposit / card_lock / p2p_send / statement_view / card_controls

  @Column({ type: 'varchar', length: 255 })
  label: string;

  @Column({ type: 'int', name: 'display_order' })
  displayOrder: number;

  @Column({ type: 'jsonb', nullable: true, name: 'action_params' })
  actionParams: Record<string, any>;

  @Column({ type: 'boolean', name: 'is_favorite', default: false })
  isFavorite: boolean;

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
