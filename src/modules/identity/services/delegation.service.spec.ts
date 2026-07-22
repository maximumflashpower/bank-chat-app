import { DelegationService } from './delegation.service';
import { DelegationStatus } from '../entities/delegation-status.enum';

describe('DelegationService', () => {
  let service: DelegationService;
  let repo: any;

  beforeEach(() => {
    repo = {
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      findOneOrFail: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    service = new DelegationService(repo);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ═══════════════════════════════════════════════════
  // createDelegation
  // ═══════════════════════════════════════════════════
  describe('createDelegation', () => {
    it('should create a delegation with PENDING status', async () => {
      repo.create.mockImplementation((data: any) => ({ ...data }));
      repo.save.mockImplementation((input: any) => Promise.resolve(input));

      const dto = {
        approverId: 'admin-1',
        scope: 'transfer:approve',
        durationHours: 24,
      } as any;

      const result = await service.createDelegation('u1', dto);
      expect(result.requesterId).toBe('u1');
      expect(result.status).toBe(DelegationStatus.PENDING);
      expect(result.approvedAt).toBeNull();
      expect(result.expiredAt).toBeNull();
      expect(result.approverId).toBe('admin-1');
    });
  });

  // ═══════════════════════════════════════════════════
  // approveDelegation
  // ═══════════════════════════════════════════════════
  describe('approveDelegation', () => {
    it('should approve delegation and set approvedAt', async () => {
      const approved = { id: 'del-1', status: DelegationStatus.APPROVED };
      repo.findOneOrFail.mockResolvedValue(approved);

      const result = await service.approveDelegation({ delegationId: 'del-1', approved: true } as any);
      expect(repo.update).toHaveBeenCalledWith('del-1', {
        status: DelegationStatus.APPROVED,
        approvedAt: expect.any(Date),
      });
      expect(result.status).toBe(DelegationStatus.APPROVED);
    });

    it('should reject delegation and set approvedAt to null', async () => {
      const rejected = { id: 'del-1', status: DelegationStatus.REJECTED };
      repo.findOneOrFail.mockResolvedValue(rejected);

      const result = await service.approveDelegation({ delegationId: 'del-1', approved: false } as any);
      expect(repo.update).toHaveBeenCalledWith('del-1', {
        status: DelegationStatus.REJECTED,
        approvedAt: null,
      });
      expect(result.status).toBe(DelegationStatus.REJECTED);
    });

    it('should return the updated delegation from findOneOrFail', async () => {
      const updated = { id: 'del-1', status: DelegationStatus.APPROVED, approvedAt: new Date() };
      repo.findOneOrFail.mockResolvedValue(updated);

      const result = await service.approveDelegation({ delegationId: 'del-1', approved: true } as any);
      expect(result).toBe(updated);
      expect(repo.findOneOrFail).toHaveBeenCalledWith({ where: { id: 'del-1' } });
    });
  });

  // ═══════════════════════════════════════════════════
  // getPendingForApprovers
  // ═══════════════════════════════════════════════════
  describe('getPendingForApprovers', () => {
    it('should query delegations by approverId or escalationPath', async () => {
      const qb: any = {
        where: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([{ id: 'del-1' }]),
      };
      repo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getPendingForApprovers('admin-1');
      expect(result).toHaveLength(1);
      expect(qb.where).toHaveBeenCalledWith('d.approverId = :approverId', { approverId: 'admin-1' });
      expect(qb.orWhere).toHaveBeenCalledWith(':approverId = ANY(d.escalationPath)', { approverId: 'admin-1' });
    });

    it('should return empty array when no pending delegations', async () => {
      const qb: any = {
        where: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      repo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getPendingForApprovers('admin-1');
      expect(result).toEqual([]);
    });
  });

  // ═══════════════════════════════════════════════════
  // escalateDelegation
  // ═══════════════════════════════════════════════════
  describe('escalateDelegation', () => {
    it('should update approverId to next approver', async () => {
      await service.escalateDelegation('del-1', 'admin-2');
      expect(repo.update).toHaveBeenCalledWith('del-1', { approverId: 'admin-2' });
    });
  });

  // ═══════════════════════════════════════════════════
  // expireOldDelegations
  // ═══════════════════════════════════════════════════
  describe('expireOldDelegations', () => {
    it('should update expired delegations and return affected count', async () => {
      const qb: any = {
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 3 }),
      };
      repo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.expireOldDelegations();
      expect(result).toBe(3);
      expect(qb.set).toHaveBeenCalledWith({ status: DelegationStatus.EXPIRED });
      expect(qb.where).toHaveBeenCalledWith(
        'status = :status AND expired_at < NOW()',
        { status: DelegationStatus.APPROVED },
      );
    });

    it('should return 0 when no delegations expired', async () => {
      const qb: any = {
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 0 }),
      };
      repo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.expireOldDelegations();
      expect(result).toBe(0);
    });
  });
});
