import { Entity, Column, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/base.entity';
import { SsoProviderType } from './sso-provider-type.enum';

@Entity({ name: 'identity_sso_configs' })
export class IdentitySsoConfig extends BaseEntity {
  @ApiProperty({ type: () => String })
  @Index()
  @Column({ name: 'org_id', type: 'uuid' })
  orgId: string;

  @ApiProperty({ enum: SsoProviderType, example: 'saml' })
  @Column({ name: 'provider_type', type: 'enum', enum: SsoProviderType })
  providerType: SsoProviderType;

  @ApiProperty({ example: 'https://sts.windows.net/tenant/' })
  @Column({ name: 'entity_id', type: 'text', nullable: true })
  entityId: string | null;

  @ApiProperty({ example: 'https://login.microsoftonline.com/tenant/federationmetadata.xml' })
  @Column({ name: 'metadata_url', type: 'text', nullable: true })
  metadataUrl: string | null;

  @ApiProperty({ example: 'bank-chat-prod-client-id' })
  @Column({ name: 'client_id', type: 'varchar', length: 255, nullable: true })
  clientId: string | null;

  @ApiProperty({ example: 'encrypted-vault-secret-xxx' })
  @Column({ name: 'client_secret_encrypted', type: 'text', nullable: true })
  clientSecretEncrypted: string | null;

  @ApiProperty({ type: () => [String], example: ['openid', 'profile', 'email'] })
  @Column({ name: 'scopes', type: 'text', array: true, default: '{}' })
  scopes: string[];

  @ApiProperty({ example: { email: 'mail', groups: 'groups' } })
  @Column({ name: 'attribute_mapping', type: 'jsonb', nullable: true })
  attributeMapping: Record<string, unknown> | null;

  @ApiProperty({ type: () => Boolean, default: true })
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @ApiProperty({ example: 'Azure AD Production' })
  @Column({ name: 'display_name', type: 'varchar', length: 255, nullable: true })
  displayName: string | null;
}
