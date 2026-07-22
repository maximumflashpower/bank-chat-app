import { DeviceTrustService } from './device-trust.service';
import { DeviceTrustLevel } from '../entities/device-trust-level.enum';
import { TrustAction, DeviceTrustLabelDto } from '../dto/device-trust-label.dto';

describe('DeviceTrustService', () => {
  let service: DeviceTrustService;
  let repo: any;

  beforeEach(() => {
    repo = {
      findOne: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      findOneOrFail: jest.fn(),
    };
    service = new DeviceTrustService(repo);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ═══════════════════════════════════════════════════
  // trackDevice
  // ═══════════════════════════════════════════════════
  describe('trackDevice', () => {
    it('should create new device record when not exists', async () => {
      repo.findOne.mockResolvedValue(null);
      repo.create.mockImplementation((data: any) => ({ ...data }));
      repo.save.mockImplementation((input: any) => Promise.resolve(input));

      const result = await service.trackDevice('u1', 'd1', 'fp-abc');
      expect(result.userId).toBe('u1');
      expect(result.deviceId).toBe('d1');
      expect(result.trustLevel).toBe(DeviceTrustLevel.TRUSTED);
      expect(result.reputationScore).toBe(100);
      expect(result.deviceFingerprint).toBe('fp-abc');
      expect(result.deviceTypeLabel).toBeNull();
      expect(result.revokedAt).toBeNull();
    });

    it('should set fingerprint to null when not provided', async () => {
      repo.findOne.mockResolvedValue(null);
      repo.create.mockImplementation((data: any) => ({ ...data }));
      repo.save.mockImplementation((input: any) => Promise.resolve(input));

      const result = await service.trackDevice('u1', 'd1');
      expect(result.deviceFingerprint).toBeNull();
    });

    it('should update existing device lastActivity when already tracked', async () => {
      const existing = {
        id: 'dt1',
        userId: 'u1',
        deviceId: 'd1',
        trustLevel: DeviceTrustLevel.TRUSTED,
        lastActivity: new Date('2026-01-01'),
      } as any;

      repo.findOne.mockResolvedValue(existing);
      repo.save.mockImplementation((input: any) => Promise.resolve(input));

      await service.trackDevice('u1', 'd1');
      expect(existing.lastActivity).toBeInstanceOf(Date);
      expect(repo.save).toHaveBeenCalledWith(existing);
    });
  });

  // ═══════════════════════════════════════════════════
  // updateTrustLabel
  // ═══════════════════════════════════════════════════
  describe('updateTrustLabel', () => {
    it('should mark device as TRUSTED', async () => {
      const record = {
        id: 'dt1',
        userId: 'u1',
        deviceId: 'd1',
        trustLevel: DeviceTrustLevel.UNTRUSTED,
      } as any;

      repo.findOneOrFail.mockResolvedValue(record);
      repo.save.mockImplementation((input: any) => Promise.resolve(input));

      const result = await service.updateTrustLabel('u1', 'd1', {
        action: TrustAction.MARK_TRUSTED,
      } as DeviceTrustLabelDto);
      
      expect(result.trustLevel).toBe(DeviceTrustLevel.TRUSTED);
    });

    it('should mark device as UNTRUSTED', async () => {
      const record = {
        id: 'dt1',
        userId: 'u1',
        deviceId: 'd1',
        trustLevel: DeviceTrustLevel.TRUSTED,
      } as any;

      repo.findOneOrFail.mockResolvedValue(record);
      repo.save.mockImplementation((input: any) => Promise.resolve(input));

      const result = await service.updateTrustLabel('u1', 'd1', {
        action: TrustAction.MARK_UNTRUSTED,
      } as DeviceTrustLabelDto);
      
      expect(result.trustLevel).toBe(DeviceTrustLevel.UNTRUSTED);
    });

    it('should revoke device and set revocation reason', async () => {
      const record = {
        id: 'dt1',
        userId: 'u1',
        deviceId: 'd1',
        trustLevel: DeviceTrustLevel.TRUSTED,
      } as any;

      repo.findOneOrFail.mockResolvedValue(record);
      repo.save.mockImplementation((input: any) => Promise.resolve(input));

      const before = new Date();
      const result = await service.updateTrustLabel('u1', 'd1', {
        action: TrustAction.REVOKE,
        reason: 'Suspicious activity detected',
      } as DeviceTrustLabelDto);
      const after = new Date();

      expect(result.trustLevel).toBe(DeviceTrustLevel.REVOKED);
      expect(result.revokedAt).toBeInstanceOf(Date);
      expect(result.revokedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(result.revokedAt.getTime()).toBeLessThanOrEqual(after.getTime());
      expect(result.revocationReason).toBe('Suspicious activity detected');
    });

    it('should revoke device without reason when not provided', async () => {
      const record = {
        id: 'dt1',
        userId: 'u1',
        deviceId: 'd1',
      } as any;

      repo.findOneOrFail.mockResolvedValue(record);
      repo.save.mockImplementation((input: any) => Promise.resolve(input));

      const result = await service.updateTrustLabel('u1', 'd1', {
        action: TrustAction.REVOKE,
      } as DeviceTrustLabelDto);

      expect(result.revocationReason).toBeNull();
    });

    it('should update deviceTypeLabel when provided', async () => {
      const record = {
        id: 'dt1',
        userId: 'u1',
        deviceId: 'd1',
        deviceTypeLabel: null,
      } as any;

      repo.findOneOrFail.mockResolvedValue(record);
      repo.save.mockImplementation((input: any) => Promise.resolve(input));

      const result = await service.updateTrustLabel('u1', 'd1', {
        action: TrustAction.MARK_TRUSTED,
        deviceTypeLabel: 'iPhone 15 Pro',
      } as DeviceTrustLabelDto);

      expect(result.deviceTypeLabel).toBe('iPhone 15 Pro');
    });

    it('should not modify deviceTypeLabel when not provided', async () => {
      const record = {
        id: 'dt1',
        userId: 'u1',
        deviceId: 'd1',
        deviceTypeLabel: 'Android Pixel',
      } as any;

      repo.findOneOrFail.mockResolvedValue(record);
      repo.save.mockImplementation((input: any) => Promise.resolve(input));

      await service.updateTrustLabel('u1', 'd1', {
        action: TrustAction.MARK_UNTRUSTED,
      } as DeviceTrustLabelDto);

      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ deviceTypeLabel: 'Android Pixel' }),
      );
    });

    it('should throw when device record not found', async () => {
      repo.findOneOrFail.mockRejectedValue(new Error('EntityNotFound'));

      await expect(
        service.updateTrustLabel('u1', 'nonexistent-device', {
          action: TrustAction.MARK_TRUSTED,
        } as DeviceTrustLabelDto)
      ).rejects.toThrow('EntityNotFound');
    });
  });

  // ═══════════════════════════════════════════════════
  // revokeAllUserDevicesExceptOne
  // ═══════════════════════════════════════════════════
  describe('revokeAllUserDevicesExceptOne', () => {
    it('should revoke all devices except the one specified', async () => {
      const affected: any = { affected: 3 };
      repo.update.mockResolvedValue(affected);

      const result = await service.revokeAllUserDevicesExceptOne('u1', 'd1-safe');
      expect(result).toBe(3);
      expect(repo.update).toHaveBeenCalledWith(
        { userId: 'u1', deviceId: expect.any(Object) },
        {
          trustLevel: DeviceTrustLevel.REVOKED,
          revokedAt: expect.any(Date),
        },
      );
    });

    it('should return 0 when no devices affected', async () => {
      const affected: any = { affected: 0 };
      repo.update.mockResolvedValue(affected);

      const result = await service.revokeAllUserDevicesExceptOne('u1', 'd1-safe');
      expect(result).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════
  // getUserDevices
  // ═══════════════════════════════════════════════════
  describe('getUserDevices', () => {
    it('should return user devices sorted by lastActivity DESC', async () => {
      const devices = [
        { id: 'dt1', userId: 'u1', lastActivity: new Date('2026-07-02') },
        { id: 'dt2', userId: 'u1', lastActivity: new Date('2026-07-01') },
        { id: 'dt3', userId: 'u1', lastActivity: new Date('2026-06-30') },
      ];
      repo.find.mockResolvedValue(devices);

      const result = await service.getUserDevices('u1');
      expect(result).toHaveLength(3);
      expect(result[0].id).toBe('dt1'); // Most recent
      expect(result[2].id).toBe('dt3'); // Oldest
    });

    it('should return empty array when no devices exist', async () => {
      repo.find.mockResolvedValue([]);

      const result = await service.getUserDevices('u1');
      expect(result).toEqual([]);
    });
  });

  // ═══════════════════════════════════════════════════
  // calculateReputationScore
  // ═══════════════════════════════════════════════════
  describe('calculateReputationScore', () => {
    it('should return 100 when no negative events', async () => {
      const result = await service.calculateReputationScore('dt1', []);
      expect(result).toBe(100);
    });

    it('should deduct 5 points per event', async () => {
      const result = await service.calculateReputationScore('dt1', [1, 2, 3]);
      expect(result).toBe(85); // 100 - (3 * 5)
    });

    it('should not go below 0', async () => {
      const result = await service.calculateReputationScore('dt1', Array(25).fill(1));
      expect(result).toBe(0);
    });

    it('should calculate correctly with mixed event values', async () => {
      const events = [1, 5, 10, 20, 30];
      const result = await service.calculateReputationScore('dt1', events);
      expect(result).toBe(75); // 100 - (5 * 5)
    });
  });
});
