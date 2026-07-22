import { GovAuditService } from './gov-audit.service';

describe('GovAuditService', () => {
  let service: GovAuditService;
  let repo: any;

  beforeEach(() => {
    repo = {
      create: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    service = new GovAuditService(repo);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ═══════════════════════════════════════════════════
  // logEvent
  // ═══════════════════════════════════════════════════
  describe('logEvent', () => {
    it('should create and save an audit log entry', async () => {
      repo.create.mockImplementation((data: any) => ({ ...data }));
      repo.save.mockImplementation((input: any) => Promise.resolve(input));

      const result = await service.logEvent('u1', 'LOGIN', 'target-123', { ip: '127.0.0.1' });
      expect(result.actorId).toBe('u1');
      expect(result.actionType).toBe('LOGIN');
      expect(result.targetEntityId).toBe('target-123');
      expect(result.details).toEqual({ ip: '127.0.0.1' });
      expect(result.complianceTags).toEqual(['SOX']);
      expect(result.actedAt).toBeInstanceOf(Date);
    });

    it('should set details to null when not provided', async () => {
      repo.create.mockImplementation((data: any) => ({ ...data }));
      repo.save.mockImplementation((input: any) => Promise.resolve(input));

      const result = await service.logEvent('u1', 'LOGOUT', 'target-456');
      expect(result.details).toBeNull();
    });

    it('should set ipAddress and userAgent to null', async () => {
      repo.create.mockImplementation((data: any) => ({ ...data }));
      repo.save.mockImplementation((input: any) => Promise.resolve(input));

      const result = await service.logEvent('u1', 'CREATE', null);
      expect(result.ipAddress).toBeNull();
      expect(result.userAgent).toBeNull();
    });

    it('should handle null targetEntityId', async () => {
      repo.create.mockImplementation((data: any) => ({ ...data }));
      repo.save.mockImplementation((input: any) => Promise.resolve(input));

      const result = await service.logEvent('u1', 'SYSTEM_ACTION', null);
      expect(result.targetEntityId).toBeNull();
      expect(result.targetEntityType).toBeNull();
    });
  });

  // ═══════════════════════════════════════════════════
  // searchAudits
  // ═══════════════════════════════════════════════════
  describe('searchAudits', () => {
    let qb: any;

    beforeEach(() => {
      qb = {
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      repo.createQueryBuilder.mockReturnValue(qb);
    });

    it('should return all audits when no filters provided', async () => {
      const result = await service.searchAudits({} as any);
      expect(result).toEqual([]);
      expect(qb.andWhere).not.toHaveBeenCalled();
      expect(qb.orderBy).toHaveBeenCalledWith('ga.actedAt', 'DESC');
      expect(qb.getMany).toHaveBeenCalled();
    });

    it('should filter by actionType with LIKE', async () => {
      await service.searchAudits({ actionType: 'LOGIN' } as any);
      expect(qb.andWhere).toHaveBeenCalledWith(
        'ga.actionType LIKE :actionType',
        { actionType: '%LOGIN%' },
      );
    });

    it('should filter by userId matching actorId or targetEntityId', async () => {
      await service.searchAudits({ userId: 'u1' } as any);
      expect(qb.andWhere).toHaveBeenCalledWith(
        'ga.actorId = :userId OR ga.targetEntityId = :userId',
        { userId: 'u1' },
      );
    });

    it('should filter by startDate', async () => {
      await service.searchAudits({ startDate: '2026-01-01' } as any);
      expect(qb.andWhere).toHaveBeenCalledWith(
        'ga.actedAt >= :startDate',
        { startDate: new Date('2026-01-01') },
      );
    });

    it('should filter by endDate', async () => {
      await service.searchAudits({ endDate: '2026-12-31' } as any);
      expect(qb.andWhere).toHaveBeenCalledWith(
        'ga.actedAt <= :endDate',
        { endDate: new Date('2026-12-31') },
      );
    });

    it('should filter by complianceTags', async () => {
      await service.searchAudits({ complianceTags: ['GDPR'] } as any);
      expect(qb.andWhere).toHaveBeenCalledWith(
        ':tag = ANY(ga.complianceTags)',
        { tag: 'GDPR' },
      );
    });

    it('should apply multiple filters simultaneously', async () => {
      await service.searchAudits({
        actionType: 'LOGIN',
        userId: 'u1',
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        complianceTags: ['SOX'],
      } as any);
      expect(qb.andWhere).toHaveBeenCalledTimes(5);
    });
  });

  // ═══════════════════════════════════════════════════
  // generateComplianceReport
  // ═══════════════════════════════════════════════════
  describe('generateComplianceReport', () => {
    it('should return report with period, totalEvents, violations, and remediations', async () => {
      const start = new Date('2026-01-01');
      const end = new Date('2026-12-31');

      const result = await service.generateComplianceReport(start, end, ['SOX']);
      expect(result.period.start).toBe(start.toISOString());
      expect(result.period.end).toBe(end.toISOString());
      expect(result.totalEvents).toBe(0);
      expect(result.violations).toEqual([]);
      expect(result.remediations).toEqual([]);
    });

    it('should accept multiple regulations', async () => {
      const start = new Date('2026-01-01');
      const end = new Date('2026-06-30');

      const result = await service.generateComplianceReport(start, end, ['SOX', 'GDPR', 'PCI']);
      expect(result.period.start).toBe(start.toISOString());
      expect(result.period.end).toBe(end.toISOString());
    });
  });
});
