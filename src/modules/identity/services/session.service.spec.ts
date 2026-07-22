import { SessionService } from './session.service';
import { BadRequestException } from '@nestjs/common';

describe('SessionService', () => {
  let service: SessionService;
  let redis: any;
  let config: any;
  let jwtService: any;

  beforeEach(() => {
    redis = {
      hset: jest.fn().mockResolvedValue('OK'),
      sadd: jest.fn().mockResolvedValue(1),
      expire: jest.fn().mockResolvedValue(1),
      smembers: jest.fn().mockResolvedValue([]),
      hgetall: jest.fn().mockResolvedValue({}),
      hget: jest.fn(),
      del: jest.fn().mockResolvedValue(1),
      srem: jest.fn().mockResolvedValue(1),
      pipeline: jest.fn().mockReturnValue({
        del: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      }),
    };
    config = {
      get: jest.fn().mockReturnValue('7d'),
    };
    jwtService = {
      decode: jest.fn(),
      sign: jest.fn().mockReturnValue('new-refresh-token'),
    };
    service = new SessionService(redis, config, jwtService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ═══════════════════════════════════════════════════
  // recordSessionStart
  // ═══════════════════════════════════════════════════
  describe('recordSessionStart', () => {
    it('should record session start and return session ID', async () => {
      const result = await service.recordSessionStart('u1', 'd1', 'Mozilla', '127.0.0.1');
      expect(result).toEqual(expect.any(String));
      expect(redis.hset).toHaveBeenCalledWith(
        expect.stringMatching(/^session:/),
        expect.objectContaining({
          userId: 'u1',
          deviceId: 'd1',
          userAgent: 'Mozilla',
          ipAddress: '127.0.0.1',
        }),
      );
      expect(redis.sadd).toHaveBeenCalledWith(expect.stringMatching(/^user:sessions:/), expect.any(String));
      expect(redis.expire).toHaveBeenCalledWith(expect.stringMatching(/^session:/), 7 * 24 * 3600);
    });
  });

  // ═══════════════════════════════════════════════════
  // listUserSessions
  // ═══════════════════════════════════════════════════
  describe('listUserSessions', () => {
    it('should return empty array when no sessions exist', async () => {
      redis.smembers.mockResolvedValue([]);
      const result = await service.listUserSessions('u1');
      expect(result).toEqual([]);
    });

    it('should return sessions sorted by lastActivityAt desc', async () => {
      redis.smembers.mockResolvedValue(['s1', 's2']);
      redis.hgetall
        .mockResolvedValueOnce({
          deviceId: 'd1',
          userAgent: 'A',
          ipAddress: '1.1.1.1',
          startedAt: '2026-01-01T00:00:00Z',
          lastActivityAt: '2026-07-01T00:00:00Z',
        })
        .mockResolvedValueOnce({
          deviceId: 'd2',
          userAgent: 'B',
          ipAddress: '2.2.2.2',
          startedAt: '2026-01-01T00:00:00Z',
          lastActivityAt: '2026-07-02T00:00:00Z',
        });

      const result = await service.listUserSessions('u1');
      expect(result).toHaveLength(2);
      expect(result[0].deviceId).toBe('d2'); // s2 has later lastActivityAt
      expect(result[1].deviceId).toBe('d1');
    });
  });

  // ═══════════════════════════════════════════════════
  // revokeSession
  // ═══════════════════════════════════════════════════
  describe('revokeSession', () => {
    it('should revoke session when userId matches', async () => {
      redis.hget.mockResolvedValue('u1');
      await service.revokeSession('s1', 'u1');
      expect(redis.del).toHaveBeenCalledWith('session:s1');
      expect(redis.srem).toHaveBeenCalledWith('user:sessions:u1', 's1');
    });

    it('should throw BadRequestException when session belongs to different user', async () => {
      redis.hget.mockResolvedValue('u2');
      await expect(service.revokeSession('s1', 'u1')).rejects.toThrow(BadRequestException);
    });
  });

  // ═══════════════════════════════════════════════════
  // markSessionActive
  // ═══════════════════════════════════════════════════
  describe('markSessionActive', () => {
    it('should update lastActivityAt', async () => {
      await service.markSessionActive('s1');
      expect(redis.hset).toHaveBeenCalledWith(
        'session:s1',
        'lastActivityAt',
        expect.any(String),
      );
    });
  });

  // ═══════════════════════════════════════════════════
  // enforceMaxConcurrentSessions
  // ═══════════════════════════════════════════════════
  describe('enforceMaxConcurrentSessions', () => {
    it('should return empty array when under limit', async () => {
      redis.smembers.mockResolvedValue(['s1', 's2']);
      const result = await service.enforceMaxConcurrentSessions('u1', 5);
      expect(result).toEqual([]);
    });

    it('should revoke excess sessions when over limit', async () => {
      redis.smembers.mockResolvedValue(['s1', 's2', 's3']);
      redis.hget.mockResolvedValue('u1'); // For revokeSession calls

      const result = await service.enforceMaxConcurrentSessions('u1', 2);
      expect(result).toHaveLength(1);
      expect(redis.del).toHaveBeenCalledTimes(1);
    });

    it('should use default max of 5 when not specified', async () => {
      redis.smembers.mockResolvedValue(['s1', 's2', 's3']);
      const result = await service.enforceMaxConcurrentSessions('u1');
      expect(result).toEqual([]);
    });

    it('should revoke when exceeding default of 5', async () => {
      redis.smembers.mockResolvedValue(['s1', 's2', 's3', 's4', 's5', 's6', 's7']);
      redis.hget.mockResolvedValue('u1');

      const result = await service.enforceMaxConcurrentSessions('u1');
      expect(result).toHaveLength(2);
    });
  });

  // ═══════════════════════════════════════════════════
  // invalidateAllUserSessions
  // ═══════════════════════════════════════════════════
  describe('invalidateAllUserSessions', () => {
    it('should return 0 when no sessions exist', async () => {
      redis.smembers.mockResolvedValue([]);
      const result = await service.invalidateAllUserSessions('u1');
      expect(result).toBe(0);
    });

    it('should invalidate all sessions and return count', async () => {
      redis.smembers.mockResolvedValue(['s1', 's2', 's3']);
      const result = await service.invalidateAllUserSessions('u1');
      expect(result).toBe(3);
      expect(redis.pipeline).toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════════
  // rotateRefreshToken
  // ═══════════════════════════════════════════════════
  describe('rotateRefreshToken', () => {
    it('should rotate token successfully', async () => {
      jwtService.decode.mockReturnValue({ sub: 'u1' });
      redis.smembers.mockResolvedValue(['s1']);

      const result = await service.rotateRefreshToken('old-token', 'u1');
      expect(result).toBe('new-refresh-token');
      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({ sub: 'u1' }),
        expect.objectContaining({ expiresIn: '7d' }),
      );
    });

    it('should throw BadRequestException when token sub does not match userId', async () => {
      jwtService.decode.mockReturnValue({ sub: 'u2' });
      await expect(service.rotateRefreshToken('old-token', 'u1'))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when decode throws', async () => {
      jwtService.decode.mockImplementation(() => {
        throw new Error('decode error');
      });
      await expect(service.rotateRefreshToken('bad-token', 'u1'))
        .rejects.toThrow(BadRequestException);
    });
  });
});
