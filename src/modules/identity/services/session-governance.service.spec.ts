import { SessionGovernanceService } from './session-governance.service';

describe('SessionGovernanceService', () => {
  let service: SessionGovernanceService;
  let repo: any;

  beforeEach(() => {
    repo = {
      create: jest.fn(),
      save: jest.fn(),
    };
    service = new SessionGovernanceService(repo);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ═══════════════════════════════════════════════════
  // logSessionAction
  // ═══════════════════════════════════════════════════
  describe('logSessionAction', () => {
    it('should create and save a session audit log', async () => {
      repo.create.mockImplementation((data: any) => ({ ...data }));
      repo.save.mockImplementation((input: any) => Promise.resolve(input));

      const result = await service.logSessionAction('LOGIN', 'u1', 'u1', '127.0.0.1', 'Manual login');
      expect(result.action).toBe('LOGIN');
      expect(result.userId).toBe('u1');
      expect(result.actorId).toBe('u1');
      expect(result.ipAddress).toBe('127.0.0.1');
      expect(result.reason).toBe('Manual login');
      expect(result.sessionId).toBeNull();
      expect(result.actedAt).toBeInstanceOf(Date);
    });

    it('should set reason to null when not provided', async () => {
      repo.create.mockImplementation((data: any) => ({ ...data }));
      repo.save.mockImplementation((input: any) => Promise.resolve(input));

      const result = await service.logSessionAction('LOGOUT', 'u1', 'u1', '10.0.0.1');
      expect(result.reason).toBeNull();
    });
  });

  // ═══════════════════════════════════════════════════
  // kickSessions
  // ═══════════════════════════════════════════════════
  describe('kickSessions', () => {
    it('should return 1 when kicking a specific user', async () => {
      repo.create.mockImplementation((data: any) => ({ ...data }));
      repo.save.mockImplementation((input: any) => Promise.resolve(input));

      const result = await service.kickSessions({ targetUserId: 'u2' } as any, 'admin-1');
      expect(result).toBe(1);
    });

    it('should return 10 when kicking all users', async () => {
      repo.create.mockImplementation((data: any) => ({ ...data }));
      repo.save.mockImplementation((input: any) => Promise.resolve(input));

      const result = await service.kickSessions({} as any, 'admin-1');
      expect(result).toBe(10);
    });

    it('should log a KICK_ALL action with keepSessionId in reason', async () => {
      repo.create.mockImplementation((data: any) => ({ ...data }));
      repo.save.mockImplementation((input: any) => Promise.resolve(input));

      await service.kickSessions({ keepSessionId: 'sess-123' } as any, 'admin-1');
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'KICK_ALL',
          reason: expect.stringContaining('sess-123'),
        }),
      );
    });

    it('should log KICK_ALL with "current" when no keepSessionId provided', async () => {
      repo.create.mockImplementation((data: any) => ({ ...data }));
      repo.save.mockImplementation((input: any) => Promise.resolve(input));

      await service.kickSessions({} as any, 'admin-1');
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          reason: expect.stringContaining('current'),
        }),
      );
    });
  });

  // ═══════════════════════════════════════════════════
  // getGlobalSessionInventory
  // ═══════════════════════════════════════════════════
  describe('getGlobalSessionInventory', () => {
    it('should return empty array (placeholder)', async () => {
      const result = await service.getGlobalSessionInventory();
      expect(result).toEqual([]);
    });
  });

  // ═══════════════════════════════════════════════════
  // enforceReAuth
  // ═══════════════════════════════════════════════════
  describe('enforceReAuth', () => {
    it('should log RE_AUTH_REQUIRED action with sensitive action in reason', async () => {
      repo.create.mockImplementation((data: any) => ({ ...data }));
      repo.save.mockImplementation((input: any) => Promise.resolve(input));

      await service.enforceReAuth('u1', 'TRANSFER_MONEY');
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'RE_AUTH_REQUIRED',
          userId: 'u1',
          reason: expect.stringContaining('TRANSFER_MONEY'),
        }),
      );
      expect(repo.save).toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════════
  // expireInactiveSessions
  // ═══════════════════════════════════════════════════
  describe('expireInactiveSessions', () => {
    it('should return 0 (placeholder)', async () => {
      const result = await service.expireInactiveSessions(30);
      expect(result).toBe(0);
    });

    it('should accept different threshold values', async () => {
      const result = await service.expireInactiveSessions(120);
      expect(result).toBe(0);
    });
  });
});
