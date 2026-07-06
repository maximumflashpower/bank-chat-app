import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IdentitySsoConfig } from '../entities/identity-sso-config.entity';
import { SsoProviderType } from '../entities/sso-provider-type.enum';
import { SamlInitiateDto } from '../dto/saml-initiate.dto';
import { OidcInitiateDto } from '../dto/oidc-initiate.dto';
import { SsoCallbackDto } from '../dto/sso-callback.dto';

@Injectable()
export class SsoService {
  private readonly logger = new Logger(SsoService.name);

  constructor(
    @InjectRepository(IdentitySsoConfig)
    private readonly repo: Repository<IdentitySsoConfig>,
  ) {}

  async initiateSaml(dto: SamlInitiateDto): Promise<{ redirectUrl: string }> {
    const config = await this.repo.findOne({ where: { providerType: SsoProviderType.SAML, isActive: true } });
    if (!config) throw new Error('No active SAML provider configured');
    // Placeholder: generate SAML AuthnRequest redirect
    return { redirectUrl: `${config.metadataUrl}?RelayState=${dto.relayState}` };
  }

  async initiateOidc(dto: OidcInitiateDto): Promise<{ redirectUrl: string, state: string }> {
    const config = await this.repo.findOne({ where: { providerType: SsoProviderType.OIDC, isActive: true } });
    if (!config) throw new Error('No active OIDC provider configured');
    const state = crypto.randomUUID();
    const scopes = dto.scopeOverride ?? config.scopes.join(' ');
    // Placeholder: build authorization URL
    return { redirectUrl: `https://login.microsoftonline.com/authorize?client_id=${config.clientId}&scope=${scopes}&state=${state}`, state };
  }

  async handleSsoCallback(callback: SsoCallbackDto): Promise<{ userId: string; accessToken: string; refreshToken: string }> {
    // Placeholder: exchange code/assertion for tokens, map attributes to local user
    this.logger.log(`SSO callback received: ${callback.code ?? callback.assertion ?? 'no-token'}`);
    return { userId: '', accessToken: '', refreshToken: '' };
  }

  async createSsoConfig(orgId: string, providerType: SsoProviderType, config: Partial<IdentitySsoConfig>): Promise<IdentitySsoConfig> {
    const entity = this.repo.create({ orgId, providerType, ...config });
    return this.repo.save(entity);
  }

  async listSsoConfigs(orgId: string): Promise<IdentitySsoConfig[]> {
    return this.repo.find({ where: { orgId } });
  }

  async toggleSsoConfig(id: string, isActive: boolean): Promise<void> {
    await this.repo.update(id, { isActive });
  }
}
