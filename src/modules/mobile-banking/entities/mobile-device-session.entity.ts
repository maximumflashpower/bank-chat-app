import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('mobile_device_session')
export class MobileDeviceSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'varchar', length: 255, name: 'device_id' })
  deviceId: string;

  @Column({ type: 'varchar', length: 20, name: 'device_platform' })
  devicePlatform: string; // ios / android

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'device_model' })
  deviceModel: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'os_version' })
  osVersion: string;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'app_version' })
  appVersion: string;

  @Column({ type: 'boolean', name: 'biometric_enrolled', default: false })
  biometricEnrolled: boolean;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'biometric_type' })
  biometricType: string; // face_id / touch_id / fingerprint

  @Column({ type: 'text', nullable: true, name: 'push_token' })
  pushToken: string;

  @Column({ type: 'text', nullable: true, name: 'session_jwt' })
  sessionJwt: string;

  @Column({ type: 'text', nullable: true, name: 'refresh_token' })
  refreshToken: string;

  @Column({ type: 'timestamptz', nullable: true, name: 'jwt_expires_at' })
  jwtExpiresAt: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'last_login_at' })
  lastLoginAt: Date;

  @Column({ type: 'varchar', length: 45, nullable: true, name: 'last_login_ip' })
  lastLoginIp: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'last_login_location' })
  lastLoginLocation: string;

  @Column({ type: 'boolean', name: 'jailbreak_detected', default: false })
  jailbreakDetected: boolean;

  @Column({ type: 'jsonb', nullable: true, name: 'security_flags' })
  securityFlags: Record<string, any>;

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'revoked_at' })
  revokedAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
