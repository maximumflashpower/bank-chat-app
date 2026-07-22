import { PasswordlessService } from './passwordless.service';

describe('PasswordlessService', () => {
  let service: PasswordlessService;

  beforeEach(() => {
    service = new PasswordlessService();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ═══════════════════════════════════════════════════
  // registerPushDevice
  // ═══════════════════════════════════════════════════
  describe('registerPushDevice', () => {
    it('should register push device and return deviceId', async () => {
      const result = await service.registerPushDevice('u1', {
        deviceName: 'iPhone 15',
        platform: 'ios',
        pushToken: 'expo-token-123',
      } as any);
      expect(result.deviceId).toEqual(expect.any(String));
      expect(result.enrolled).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════
  // sendPushChallenge
  // ═══════════════════════════════════════════════════
  describe('sendPushChallenge', () => {
    it('should return challengeId and expiresAt', async () => {
      const result = await service.sendPushChallenge('u1');
      expect(result.challengeId).toEqual(expect.any(String));
      expect(result.expiresAt).toBeInstanceOf(Date);
    });

    it('should set expiry to ~60 seconds from now', async () => {
      const before = Date.now();
      const result = await service.sendPushChallenge('u1');
      const diff = result.expiresAt.getTime() - before;
      expect(diff).toBeGreaterThanOrEqual(50_000);
      expect(diff).toBeLessThanOrEqual(70_000);
    });
  });

  // ═══════════════════════════════════════════════════
  // verifyPushChallenge
  // ═══════════════════════════════════════════════════
  describe('verifyPushChallenge', () => {
    it('should return true when approved', async () => {
      const result = await service.verifyPushChallenge('challenge-1', true);
      expect(result).toBe(true);
    });

    it('should return false when not approved', async () => {
      const result = await service.verifyPushChallenge('challenge-1', false);
      expect(result).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════
  // generateMagicLink
  // ═══════════════════════════════════════════════════
  describe('generateMagicLink', () => {
    it('should return magic link with token', async () => {
      const result = await service.generateMagicLink({ email: 'user@test.com' } as any);
      expect(result.magicLink).toContain('https://app.bankchat.com/auth/magic?token=');
      expect(result.expiresAt).toBeInstanceOf(Date);
    });

    it('should set expiry to ~10 minutes from now', async () => {
      const before = Date.now();
      const result = await service.generateMagicLink({ email: 'user@test.com' } as any);
      const diff = result.expiresAt.getTime() - before;
      expect(diff).toBeGreaterThanOrEqual(550_000);
      expect(diff).toBeLessThanOrEqual(650_000);
    });
  });

  // ═══════════════════════════════════════════════════
  // verifyMagicLink
  // ═══════════════════════════════════════════════════
  describe('verifyMagicLink', () => {
    it('should return null (placeholder implementation)', async () => {
      const result = await service.verifyMagicLink({
        email: 'user@test.com',
        token: 'some-token',
      } as any);
      expect(result).toBeNull();
    });
  });

  // ═══════════════════════════════════════════════════
  // registerDid
  // ═══════════════════════════════════════════════════
  describe('registerDid', () => {
    it('should register DID and return didId', async () => {
      const result = await service.registerDid('u1', {
        didDocumentId: 'did:web:example.com:user1',
      } as any);
      expect(result.didId).toEqual(expect.any(String));
      expect(result.registered).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════
  // authenticateWithDid
  // ═══════════════════════════════════════════════════
  describe('authenticateWithDid', () => {
    it('should return false (placeholder implementation)', async () => {
      const result = await service.authenticateWithDid(
        'did:web:example.com',
        'challenge-123',
        'signature-abc',
      );
      expect(result).toBe(false);
    });
  });
});
