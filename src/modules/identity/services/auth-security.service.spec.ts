// Auto-mock entity modules to break circular import chains
jest.mock('../entities/identity-session.entity');
jest.mock('../entities/role.entity');

import { AuthSecurityService } from './auth-security.service';

describe('AuthSecurityService', () => {
  let service: AuthSecurityService;
  let sessionRepo: any;
  let roleRepo: any;

  const mockSessionRepo = {
    count: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };

  const mockRoleRepo = {
    find: jest.fn(),
  };

  beforeEach(() => {
    sessionRepo = { ...mockSessionRepo };
    roleRepo = { ...mockRoleRepo };
    service = new AuthSecurityService(sessionRepo, roleRepo);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ========================================
  // Brute Force Protection
  // ========================================

  describe('recordFailedAttempt', () => {
    it('should record a failed attempt and return remaining attempts', async () => {
      const result = await service.recordFailedAttempt('user@example.com');
      expect(result).toBeDefined();
      expect(result.lockedOut).toBe(false);
      expect(result.remainingAttempts).toBe(4);
    });
  });

  describe('isLockedOut', () => {
    it('should return false for identifier not locked out', async () => {
      const result = await service.isLockedOut('user@example.com');
      expect(result).toBe(false);
    });
  });

  describe('updateBruteForceConfig', () => {
    it('should update brute force configuration', async () => {
      await service.updateBruteForceConfig({
        maxAttempts: 3,
        lockoutDurationSeconds: 600,
        resetWindowSeconds: 120,
      });
      const current = service.getBruteForceConfig();
      expect(current.maxAttempts).toBe(3);
      expect(current.lockoutDurationSeconds).toBe(600);
      expect(current.resetWindowSeconds).toBe(120);
    });
  });

  describe('getBruteForceConfig', () => {
    it('should return default brute force configuration', () => {
      const config = service.getBruteForceConfig();
      expect(config.maxAttempts).toBe(5);
      expect(config.lockoutDurationSeconds).toBe(900);
      expect(config.resetWindowSeconds).toBe(300);
    });
  });

  // ========================================
  // Concurrent Session Limit
  // ========================================

  describe('enforceConcurrentSessionLimit', () => {
    const userId = 'user-uuid-123';

    it('should return 0 when under the concurrent session limit', async () => {
      sessionRepo.count.mockResolvedValue(1);
      const result = await service.enforceConcurrentSessionLimit(userId);
      expect(result).toBe(0);
      expect(sessionRepo.count).toHaveBeenCalledWith({ where: { userId, isActive: true } });
      expect(sessionRepo.findOne).not.toHaveBeenCalled();
      expect(sessionRepo.save).not.toHaveBeenCalled();
    });

    it('should revoke the oldest session when at max concurrent sessions', async () => {
      const oldestSession: any = {
        id: 'session-old',
        userId,
        isActive: true,
        issuedAt: new Date('2026-01-01'),
        lastUsedAt: new Date('2026-01-02'),
      };
      sessionRepo.count.mockResolvedValue(3);
      sessionRepo.findOne.mockResolvedValue(oldestSession);
      sessionRepo.save.mockResolvedValue(oldestSession);
      const result = await service.enforceConcurrentSessionLimit(userId);
      expect(result).toBe(1);
      expect(sessionRepo.findOne).toHaveBeenCalledWith({
        where: { userId, isActive: true },
        order: { issuedAt: 'ASC' },
      });
      expect(oldestSession.isActive).toBe(false);
      expect(oldestSession.revokedAt).toBeDefined();
      expect(sessionRepo.save).toHaveBeenCalledWith(oldestSession);
    });

    it('should return 1 when at limit but no oldest session found (null result)', async () => {
      sessionRepo.count.mockResolvedValue(3);
      sessionRepo.findOne.mockResolvedValue(null);
      const result = await service.enforceConcurrentSessionLimit(userId);
      expect(result).toBe(1);
    });
  });

  // ========================================
  // Session Timeout Enforcement
  // ========================================

  describe('enforceSessionTimeout', () => {
    it('should deactivate timed-out sessions and return affected count', async () => {
      sessionRepo.update.mockResolvedValue({ affected: 5, raw: {}, generatedMaps: [] });
      const result = await service.enforceSessionTimeout();
      expect(result).toBe(5);
      expect(sessionRepo.update).toHaveBeenCalledWith(
        expect.objectContaining({ isActive: true }),
        expect.objectContaining({ isActive: false }),
      );
    });

    it('should return 0 when no sessions to timeout', async () => {
      sessionRepo.update.mockResolvedValue({ affected: 0, raw: {}, generatedMaps: [] });
      const result = await service.enforceSessionTimeout();
      expect(result).toBe(0);
    });

    it('should handle null affected result gracefully', async () => {
      sessionRepo.update.mockResolvedValue({ affected: null, raw: {}, generatedMaps: [] });
      const result = await service.enforceSessionTimeout();
      expect(result).toBe(0);
    });
  });

  // ========================================
  // Session Configuration
  // ========================================

  describe('updateSessionConfig', () => {
    it('should update session configuration', async () => {
      await service.updateSessionConfig({
        maxConcurrentSessions: 5,
        sessionTimeoutSeconds: 7200,
      });
      const current = service.getSessionConfig();
      expect(current.maxConcurrentSessions).toBe(5);
      expect(current.sessionTimeoutSeconds).toBe(7200);
    });
  });

  describe('getSessionConfig', () => {
    it('should return default session configuration', () => {
      const config = service.getSessionConfig();
      expect(config.maxConcurrentSessions).toBe(3);
      expect(config.sessionTimeoutSeconds).toBe(3600);
    });
  });

  // ========================================
  // Permission Resolution
  // ========================================

  describe('getEffectivePermissions', () => {
    const userId = 'user-uuid-perm-test';

    it('should return flattened permissions from assigned roles', async () => {
      roleRepo.find.mockResolvedValue([
        { id: 'role-1', permissions: ['read:accounts', 'write:transfers'], parentRoleId: null },
        { id: 'role-2', permissions: ['read:reports'], parentRoleId: null },
      ]);
      const result = await service.getEffectivePermissions(userId, ['role-1', 'role-2']);
      expect(result).toEqual(expect.arrayContaining(['read:accounts', 'write:transfers', 'read:reports']));
      expect(result).toHaveLength(3);
    });

    it('should inherit permissions from parent role recursively', async () => {
      roleRepo.find.mockResolvedValue([
        { id: 'child', permissions: ['child:perm'], parentRoleId: 'parent' },
        { id: 'parent', permissions: ['parent:perm'], parentRoleId: null },
      ]);
      const result = await service.getEffectivePermissions(userId, ['child']);
      expect(result).toEqual(expect.arrayContaining(['child:perm', 'parent:perm']));
      expect(result).toHaveLength(2);
    });

    it('should deduplicate permissions from overlapping roles', async () => {
      roleRepo.find.mockResolvedValue([
        { id: 'role-1', permissions: ['read:accounts', 'write:transfers'], parentRoleId: null },
        { id: 'role-2', permissions: ['read:accounts', 'read:reports'], parentRoleId: null },
      ]);
      const result = await service.getEffectivePermissions(userId, ['role-1', 'role-2']);
      const dupes = result.filter((p: string) => p === 'read:accounts').length;
      expect(dupes).toBe(1);
      expect(result).toHaveLength(3);
    });

    it('should handle circular parent role references without infinite loop', async () => {
      roleRepo.find.mockResolvedValue([
        { id: 'role-a', permissions: ['perm:a'], parentRoleId: 'role-b' },
        { id: 'role-b', permissions: ['perm:b'], parentRoleId: 'role-a' },
      ]);
      const result = await service.getEffectivePermissions(userId, ['role-a']);
      expect(result).toEqual(expect.arrayContaining(['perm:a', 'perm:b']));
    });

    it('should return empty array when no roles provided', async () => {
      roleRepo.find.mockResolvedValue([]);
      const result = await service.getEffectivePermissions(userId, []);
      expect(result).toEqual([]);
    });

    it('should handle role not found in fetched roles', async () => {
      roleRepo.find.mockResolvedValue([]);
      const result = await service.getEffectivePermissions(userId, ['nonexistent-role']);
      expect(result).toEqual([]);
    });
  });

  describe('isPermissionGranted', () => {
    it('should return true when user has the required permission', () => {
      expect(service.isPermissionGranted(['read:accounts', 'write:transfers'], 'read:accounts')).toBe(true);
    });

    it('should return false when user lacks the required permission', () => {
      expect(service.isPermissionGranted(['read:accounts'], 'write:transfers')).toBe(false);
    });

    it('should return true when wildcard permission (*) is present', () => {
      expect(service.isPermissionGranted(['*'], 'admin:delete:everything')).toBe(true);
    });

    it('should return false when user has no permissions', () => {
      expect(service.isPermissionGranted([], 'read:accounts')).toBe(false);
    });
  });
});
