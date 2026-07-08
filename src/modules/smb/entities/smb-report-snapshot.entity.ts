import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';

@Entity('smb_report_snapshot')
export class SmbReportSnapshot extends BaseEntity {
  @Column({ type: 'varchar', name: 'report_type' })
  reportType: string; // 'inventory_valuation', 'stock_movement_history', 'inventory_aging', 'ias2', etc.

  @Column({ type: 'uuid', name: 'company_profile_id' })
  companyProfileId: string;

  @Column({ type: 'uuid', nullable: true, name: 'warehouse_id' })
  warehouseId?: string;

  @Column({ type: 'jsonb', name: 'report_data' })
  reportData: Record<string, unknown>; // Datos completos del reporte en JSON

  @Column({ type: 'varchar', nullable: true, name: 'generated_by_user_id' })
  generatedByUserId?: string;

  @Column({ type: 'varchar', nullable: true, name: 'jurisdiction_code' })
  jurisdictionCode?: string;

  @Column({ type: 'date', name: 'report_date' })
  reportDate: string; // Fecha de corte del reporte (YYYY-MM-DD)

  @Column({ type: 'timestamp', nullable: true, name: 'expires_at' })
  expiresAt?: Date; // Opcional: caducidad del snapshot

  @Column({ type: 'boolean', default: true, name: 'is_valid' })
  isValid: boolean; // Flag para invalidar snapshots manualmente

  @CreateDateColumn({ name: 'generated_at' })
  generatedAt: Date;
}
