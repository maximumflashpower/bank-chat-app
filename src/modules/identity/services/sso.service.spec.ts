import { SsoService } from './sso.service';
import { SsoProviderType } from '../entities/sso-provider-type.enum';

describe('SsoService', () => {
  let service: SsoService;
  let repo: any;

  beforeEach(() => {
    repo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };
    service = new SsoService(repo);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ═══════════════════════════════════════════════════
  // initiateSaml
  // ═══════════════════════════════════════════════════
  describe('initiateSaml', () => {
    it('should return redirect URL with relayState', async () => {
      repo.findOne.mockResolvedValue({
        id: 'sso1',
        metadataUrl: 'https://idp.example.com/saml',
        providerType: SsoProviderType.SAML,
        isActive: true,
      });

      const result = await service.initiateSaml({ relayState: '/dashboard' } as any);
      expect(result.redirectUrl).toContain('https://idp.example.com/saml');
      expect(result.redirectUrl).toContain('RelayState=/dashboard');
    });

    it('should throw when no active SAML provider found', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.initiateSaml({ relayState: '/' } as any))
        .rejects.toThrow('No active SAML provider configured');
    });
  });

  // ═══════════════════════════════════════════════════
  // initiateOidc
  // ═══════════════════════════════════════════════════
  describe('initiateOidc', () => {
    it('should return redirect URL and state', async () => {
      repo.findOne.mockResolvedValue({
        id: 'sso2',
        clientId: 'client-123',
        scopes: ['openid', 'profile'],
        providerType: SsoProviderType.OIDC,
        isActive: true,
      });

      const result = await service.initiateOidc({} as any);
      expect(result.redirectUrl).toContain('client_id=client-123');
      expect(result.redirectUrl).toContain('login.microsoftonline.com');
      expect(result.state).toEqual(expect.any(String));
    });

    it('should use scopeOverride when provided', async () => {
      repo.findOne.mockResolvedValue({
        id: 'sso2',
        clientId: 'client-123',
        scopes: ['openid', 'profile'],
        providerType: SsoProviderType.OIDC,
        isActive: true,
      });

      const result = await service.initiateOidc({ scopeOverride: 'openid email' } as any);
      expect(result.redirectUrl).toContain('scope=openid email');
    });

    it('should use config scopes joined by space when no override', async () => {
      repo.findOne.mockResolvedValue({
        id: 'sso2',
        clientId: 'client-123',
        scopes: ['openid', 'profile', 'email'],
        providerType: SsoProviderType.OIDC,
        isActive: true,
      });

      const result = await service.initiateOidc({} as any);
      expect(result.redirectUrl).toContain('scope=openid profile email');
    });

    it('should throw when no active OIDC provider found', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.initiateOidc({} as any))
        .rejects.toThrow('No active OIDC provider configured');
    });
  });

  // ═══════════════════════════════════════════════════
  // handleSsoCallback
  // ═══════════════════════════════════════════════════
  describe('handleSsoCallback', () => {
    it('should handle callback with code', async () => {
      const result = await service.handleSsoCallback({ code: 'auth-code-123' } as any);
      expect(result).toHaveProperty('userId');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should handle callback with assertion', async () => {
      const result = await service.handleSsoCallback({ assertion: 'saml-assertion' } as any);
      expect(result).toHaveProperty('userId');
    });

    it('should handle callback with neither code nor assertion', async () => {
      const result = await service.handleSsoCallback({} as any);
      expect(result).toHaveProperty('userId');
    });
  });

  // ═══════════════════════════════════════════════════
  // createSsoConfig
  // ═══════════════════════════════════════════════════
  describe('createSsoConfig', () => {
    it('should create and save SSO config', async () => {
      repo.create.mockImplementation((data: any) => ({ ...data }));
      repo.save.mockImplementation((input: any) => Promise.resolve(input));

      const result = await service.createSsoConfig('org-1', SsoProviderType.OIDC, {
        clientId: 'client-1',
        scopes: ['openid'],
      });
      expect(result.orgId).toBe('org-1');
      expect(result.providerType).toBe(SsoProviderType.OIDC);
      expect(result.clientId).toBe('client-1');
    });
  });

  // ═══════════════════════════════════════════════════
  // listSsoConfigs
  // ═══════════════════════════════════════════════════
  describe('listSsoConfigs', () => {
    it('should return configs for an org', async () => {
      const mockConfigs = [
        { id: 'sso1', orgId: 'org-1' },
        { id: 'sso2', orgId: 'org-1' },
      ];
      repo.find.mockResolvedValue(mockConfigs);

      const result = await service.listSsoConfigs('org-1');
      expect(result).toHaveLength(2);
      expect(repo.find).toHaveBeenCalledWith({ where: { orgId: 'org-1' } });
    });
  });

  // ═══════════════════════════════════════════════════
  // toggleSsoConfig
  // ═══════════════════════════════════════════════════
  describe('toggleSsoConfig', () => {
    it('should update isActive flag', async () => {
      await service.toggleSsoConfig('sso1', false);
      expect(repo.update).toHaveBeenCalledWith('sso1', { isActive: false });
    });

    it('should activate config', async () => {
      await service.toggleSsoConfig('sso1', true);
      expect(repo.update).toHaveBeenCalledWith('sso1', { isActive: true });
    });
  });
});
