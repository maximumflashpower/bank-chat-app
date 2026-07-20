import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('mobile_widget_config')
export class MobileWidgetConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'varchar', length: 50, name: 'widget_type' })
  widgetType: string; // account_summary / card_summary / loan_summary / loyalty_points / spending_chart / budget_tracker / quick_actions / recent_transactions / credit_score / savings_goal

  @Column({ type: 'int', name: 'display_order' })
  displayOrder: number;

  @Column({ type: 'boolean', name: 'is_visible', default: true })
  isVisible: boolean;

  @Column({ type: 'varchar', length: 20, name: 'size_preference', default: 'medium' })
  sizePreference: string; // small / medium / large / full_width

  @Column({ type: 'jsonb', nullable: true, name: 'configuration_json' })
  configurationJson: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true, name: 'data_cache_json' })
  dataCacheJson: Record<string, any>;

  @Column({ type: 'timestamptz', nullable: true, name: 'last_refreshed_at' })
  lastRefreshedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
