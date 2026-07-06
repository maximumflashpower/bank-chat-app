import { Entity, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/base.entity';

@Entity({ name: 'gov_mfa_policy' })
export class MfaPolicy extends BaseEntity {
  @ApiProperty({ example: 'default-risk-policy' })
  @Column({ name: 'name', type: 'varchar', length: 255, unique: true })
  name: string;

  @ApiProperty({ example: 2.0 })
  @Column({ name: 'risk_threshold_low', type: 'numeric', precision: 3, scale: 1, default: 2.0 })
  riskThresholdLow: number;

  @ApiProperty({ example: 5.0 })
  @Column({ name: 'risk_threshold_high', type: 'numeric', precision: 3, scale: 1, default: 5.0 })
  riskThresholdHigh: number;

  @ApiProperty({ type: () => Boolean, default: true })
  @Column({ name: 'enforce_new_device', type: 'boolean', default: true })
  enforceNewDevice: boolean;

  @ApiProperty({ type: () => Boolean, default: true })
  @Column({ name: 'enforce_unusual_location', type: 'boolean', default: true })
  enforceUnusualLocation: boolean;

  @ApiProperty({ type: () => Boolean, default: false })
  @Column({ name: 'enforce_after_hour_access', type: 'boolean', default: false })
  enforceAfterHourAccess: boolean;

  @ApiProperty({ type: () => Boolean, default: true })
  @Column({ name: 'allow_trusted_network_bypass', type: 'boolean', default: true })
  allowTrustedNetworkBypass: boolean;

  @ApiProperty({ example: 8 })
  @Column({ name: 'session_duration_hours', type: 'int', default: 8 })
  sessionDurationHours: number;

  @ApiProperty({ type: () => String })
  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;
}
