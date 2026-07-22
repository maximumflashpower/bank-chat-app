import { PasskeySyncService } from './passkey-sync.service';

describe('PasskeySyncService', () => {
  let service: PasskeySyncService;
  let repo: any;

  beforeEach(() => {
    repo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      delete: jest.fn(),
      findOne: jest.fn(),
    };
    service = new PasskeySyncService(repo);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ═══════════════════════════════════════════════════
  // syncPasskey
  // ═══════════════════════════════════════════════════
  describe('syncPasskey', () => {
    it('should create and save sync metadata', async () => {
      repo.create.mockImplementation((data: any) => ({ ...data }));
      repo.save.mockImplementation((input: any) => Promise.resolve(input));

      const result = await service.syncPasskey('u1', 'pk-1', 'device-1', true);
      expect(result.userId).toBe('u1');
      expect(result.passkeyId).toBe('pk-1');
      expect(result.deviceId).toBe('device-1');
      expect(result.isPrimary).toBe(true);
      expect(result.syncedAt).toBeInstanceOf(Date);
    });

    it('should set isPrimary to false when not provided', async () => {
      repo.create.mockImplementation((data: any) => ({ ...data }));
      repo.save.mockImplementation((input: any) => Promise.resolve(input));

      const result = await service.syncPasskey('u1', 'pk-1', 'device-1');
      expect(result.isPrimary).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════
  // listUserPasskeys
  // ═══════════════════════════════════════════════════
  describe('listUserPasskeys', () => {
    it('should return passkeys sorted by syncedAt DESC', async () => {
      const passkeys = [
        { id: 'pm-2', userId: 'u1', syncedAt: new Date('2026-07-02') },
        { id: 'pm-1', userId: 'u1', syncedAt: new Date('2026-07-01') },
      ];
      repo.find.mockResolvedValue(passkeys);

      const result = await service.listUserPasskeys('u1');
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('pm-2'); // Most recent first
    });

    it('should return empty array when no passkeys exist', async () => {
      repo.find.mockResolvedValue([]);
      const result = await service.listUserPasskeys('u1');
      expect(result).toEqual([]);
    });
  });

  // ═══════════════════════════════════════════════════
  // revokePasskeyOnDevice
  // ═══════════════════════════════════════════════════
  describe('revokePasskeyOnDevice', () => {
    it('should delete passkey sync by userId, passkeyId, and deviceId', async () => {
      await service.revokePasskeyOnDevice('u1', 'pk-1', 'device-1');
      expect(repo.delete).toHaveBeenCalledWith({
        userId: 'u1',
        passkeyId: 'pk-1',
        deviceId: 'device-1',
      });
    });
  });

  // ═══════════════════════════════════════════════════
  // getLastUsedRemote
  // ═══════════════════════════════════════════════════
  describe('getLastUsedRemote', () => {
    it('should return lastUsedRemote from record', async () => {
      const expectedDate = new Date('2026-07-01');
      repo.findOne.mockResolvedValue({
        lastUsedRemote: expectedDate,
      });

      const result = await service.getLastUsedRemote('u1', 'pk-1');
      expect(result).toBe(expectedDate);
    });

    it('should return null when record not found', async () => {
      repo.findOne.mockResolvedValue(null);
      const result = await service.getLastUsedRemote('u1', 'pk-1');
      expect(result).toBeNull();
    });

    it('should return null when record exists but lastUsedRemote is undefined', async () => {
      repo.findOne.mockResolvedValue({ lastUsedRemote: undefined });
      const result = await service.getLastUsedRemote('u1', 'pk-1');
      expect(result).toBeNull();
    });
  });
});
