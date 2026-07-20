import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('mobile_atm_locator')
export class MobileAtmLocator {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20, name: 'location_type' })
  locationType: string; // atm / branch / shared_branch

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 500, name: 'address_line' })
  addressLine: string;

  @Column({ type: 'varchar', length: 255 })
  city: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'state_province' })
  stateProvince: string;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'postal_code' })
  postalCode: string;

  @Column({ type: 'varchar', length: 2, name: 'country_code' })
  countryCode: string;

  @Column({ type: 'numeric', precision: 10, scale: 7 })
  latitude: number;

  @Column({ type: 'numeric', precision: 10, scale: 7 })
  longitude: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true, name: 'distance_from_user_km' })
  distanceFromUserKm: number;

  @Column({ type: 'text', array: true, nullable: true, name: 'services_available' })
  servicesAvailable: string[]; // cash_withdrawal / deposit / currency_exchange / cardless / blind_accessible

  @Column({ type: 'jsonb', nullable: true, name: 'hours_operation' })
  hoursOperation: Record<string, any>;

  @Column({ type: 'boolean', name: 'is_24_hours', default: false })
  is24Hours: boolean;

  @Column({ type: 'boolean', name: 'wheelchair_accessible', default: true })
  wheelchairAccessible: boolean;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'branch_phone' })
  branchPhone: string;

  @Column({ type: 'varchar', length: 20, name: 'status', default: 'active' })
  status: string; // active / maintenance / closed

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
