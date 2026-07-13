import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';
import { BaseEntity } from '../../../../common/base.entity';

@Entity('reg_export_licenses')
export class ExportControlLicense extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @Column({ type: 'varchar', length: 100 })
  licenseNumber: string;

  @Column({ type: 'varchar', length: 255 })
  exporterName: string;

  @Column({ type: 'varchar', length: 100 })
  exporterCountry: string;

  @Column({ type: 'varchar', length: 100 })
  destinationCountry: string;

  @Column({ type: 'varchar', length: 255 })
  itemDescription: string;

  @Column({ type: 'varchar', length: 50 })
  classification: string;

  @Column({ type: 'boolean', default: false })
  dualUseGoods: boolean;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: string;

  @Column({ type: 'timestamptz', nullable: true })
  approvalDate: Date;

  @Column({ type: 'timestamptz', nullable: true })
  expirationDate: Date;

  @Column({ type: 'text', nullable: true })
  denialReason: string;
}
