import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';

export enum SensitivityLabel {
  PUBLIC = 'public',
  INTERNAL = 'internal',
  CONFIDENTIAL = 'confidential',
  RESTRICTED = 'restricted',
}

export enum ClassificationMethod {
  AUTO = 'auto',
  MANUAL = 'manual',
  INHERIT = 'inherit',
}

export enum PIIType {
  EMAIL = 'email',
  PHONE = 'phone',
  SSN = 'ssn',
  CARD = 'card',
  MEDICAL = 'medical',
  ADDRESS = 'address',
  NONE = 'none',
}

@Entity('datagov_classification')
export class DatagovClassification extends BaseEntity {

  @Column({ name: 'entity_type', type: 'varchar', length: 50, nullable: false })
  entityType: string;

  @Column({ name: 'entity_identifier', type: 'varchar', length: 255, nullable: false })
  entityIdentifier: string;

  @Column({ name: 'sensitivity_label', type: 'varchar', length: 20, nullable: false })
  sensitivityLabel: SensitivityLabel;

  @Column({ name: 'classification_method', type: 'varchar', length: 20, nullable: false })
  classificationMethod: ClassificationMethod;

  @Column({ name: 'pii_type', type: 'varchar', length: 50, nullable: true })
  piiType: PIIType;

  @Column({ name: 'confidence_score', type: 'numeric', precision: 5, scale: 2, nullable: true })
  confidenceScore: number;

  @Column({ name: 'applies_masking', type: 'boolean', default: false })
  appliesMasking: boolean;

  @Column({ name: 'applies_encryption', type: 'boolean', default: false })
  appliesEncryption: boolean;

  @Column({ name: 'overrides_default', type: 'boolean', default: false })
  overridesDefault: boolean;

  @Column({ name: 'classified_by', type: 'uuid', nullable: true })
  classifiedBy: string | null;

  @CreateDateColumn({ name: 'classified_at', type: 'timestamptz' })
  classifiedAt: Date;

  @Column({ name: 'reevaluate_at', type: 'timestamptz', nullable: true })
  reevaluateAt: Date;
}
