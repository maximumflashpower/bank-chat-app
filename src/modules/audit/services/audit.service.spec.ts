import { AuditService } from './audit.service';
import { AuditSeverity } from '../entities/audit-severity.enum';

jest.mock('../entities/audit-log.entity');

describe('AuditService', () => {
  let service: AuditService;
  let mockRepo: any;

  beforeEach(() => {
    mockRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue({
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn(),
      }),
    };
    service = new AuditService(mockRepo);
  });

  describe('log', () => {
    it('should create and save audit log entry', async () => {
      const entry = { id: 'log-1' };
      mockRepo.create.mockReturnValue(entry);
      mockRepo.save.mockResolvedValue(entry);

      await service.log({ eventType: 'login' as any, description: 'User logged in' } as any);

      expect(mockRepo.create).toHaveBeenCalled();
      expect(mockRepo.save).toHaveBeenCalledWith(entry);
    });

    it('should default severity to INFO when not provided', async () => {
      mockRepo.create.mockReturnValue({});
      mockRepo.save.mockResolvedValue({});

      await service.log({ eventType: 'login' as any, description: 'Test' } as any);

      expect(mockRepo.create.mock.calls[0][0].severity).toBe(AuditSeverity.INFO);
    });

    it('should use provided severity', async () => {
      mockRepo.create.mockReturnValue({});
      mockRepo.save.mockResolvedValue({});

      await service.log({ eventType: 'login' as any, severity: AuditSeverity.CRITICAL, description: 'Critical' } as any);

      expect(mockRepo.create.mock.calls[0][0].severity).toBe(AuditSeverity.CRITICAL);
    });

    it('should null out optional fields when not provided', async () => {
      mockRepo.create.mockReturnValue({});
      mockRepo.save.mockResolvedValue({});

      await service.log({ eventType: 'login' as any, description: 'Test' } as any);

      const arg = mockRepo.create.mock.calls[0][0];
      expect(arg.userId).toBeNull();
      expect(arg.ipAddress).toBeNull();
      expect(arg.userAgent).toBeNull();
      expect(arg.metadata).toBeNull();
      expect(arg.httpMethod).toBeNull();
      expect(arg.httpPath).toBeNull();
      expect(arg.httpStatus).toBeNull();
    });

    it('should use provided optional fields', async () => {
      mockRepo.create.mockReturnValue({});
      mockRepo.save.mockResolvedValue({});

      await service.log({
        eventType: 'login' as any, description: 'Test',
        userId: 'user-1', ipAddress: '192.168.1.1',
        httpMethod: 'POST', httpPath: '/api/auth/login', httpStatus: 200,
      } as any);

      const arg = mockRepo.create.mock.calls[0][0];
      expect(arg.userId).toBe('user-1');
      expect(arg.ipAddress).toBe('192.168.1.1');
      expect(arg.httpMethod).toBe('POST');
      expect(arg.httpPath).toBe('/api/auth/login');
      expect(arg.httpStatus).toBe(200);
    });

    it('should swallow errors and not throw', async () => {
      mockRepo.create.mockImplementation(() => { throw new Error('DB down'); });

      await expect(service.log({ eventType: 'login' as any, description: 'Test' } as any))
        .resolves.toBeUndefined();
    });
  });

  describe('query', () => {
    it('should apply eventType filter when provided', async () => {
      mockRepo.createQueryBuilder().getManyAndCount.mockResolvedValue([[], 0]);
      await service.query({ eventType: 'login' } as any);
      expect(mockRepo.createQueryBuilder().andWhere).toHaveBeenCalledWith('audit.event_type = :eventType', { eventType: 'login' });
    });

    it('should apply severity filter when provided', async () => {
      mockRepo.createQueryBuilder().getManyAndCount.mockResolvedValue([[], 0]);
      await service.query({ severity: 'critical' } as any);
      expect(mockRepo.createQueryBuilder().andWhere).toHaveBeenCalledWith('audit.severity = :severity', { severity: 'critical' });
    });

    it('should apply userId filter when provided', async () => {
      mockRepo.createQueryBuilder().getManyAndCount.mockResolvedValue([[], 0]);
      await service.query({ userId: 'user-1' } as any);
      expect(mockRepo.createQueryBuilder().andWhere).toHaveBeenCalledWith('audit.user_id = :userId', { userId: 'user-1' });
    });

    it('should not apply filters when none provided', async () => {
      mockRepo.createQueryBuilder().getManyAndCount.mockResolvedValue([[], 0]);
      await service.query({} as any);
      expect(mockRepo.createQueryBuilder().andWhere).not.toHaveBeenCalled();
    });

    it('should order by created_at DESC', async () => {
      mockRepo.createQueryBuilder().getManyAndCount.mockResolvedValue([[], 0]);
      await service.query({} as any);
      expect(mockRepo.createQueryBuilder().orderBy).toHaveBeenCalledWith('audit.created_at', 'DESC');
    });

    it('should use default limit of 50 when not provided', async () => {
      mockRepo.createQueryBuilder().getManyAndCount.mockResolvedValue([[], 0]);
      await service.query({} as any);
      expect(mockRepo.createQueryBuilder().limit).toHaveBeenCalledWith(50);
    });

    it('should use provided limit', async () => {
      mockRepo.createQueryBuilder().getManyAndCount.mockResolvedValue([[], 0]);
      await service.query({ limit: 100 } as any);
      expect(mockRepo.createQueryBuilder().limit).toHaveBeenCalledWith(100);
    });

    it('should return data and total count', async () => {
      const data = [{ id: 'log-1' }];
      mockRepo.createQueryBuilder().getManyAndCount.mockResolvedValue([data, 1]);
      const result = await service.query({} as any);
      expect(result.data).toEqual(data);
      expect(result.total).toBe(1);
    });
  });

  describe('getByUserId', () => {
    it('should return logs ordered by createdAt DESC with default limit', async () => {
      const logs = [{ id: 'log-1' }];
      mockRepo.find.mockResolvedValue(logs);
      const result = await service.getByUserId('user-1');
      expect(result).toEqual(logs);
      expect(mockRepo.find).toHaveBeenCalledWith({ where: { userId: 'user-1' }, order: { createdAt: 'DESC' }, take: 50 });
    });

    it('should use custom limit', async () => {
      mockRepo.find.mockResolvedValue([]);
      await service.getByUserId('user-1', 10);
      expect(mockRepo.find).toHaveBeenCalledWith({ where: { userId: 'user-1' }, order: { createdAt: 'DESC' }, take: 10 });
    });

    it('should return empty array when no logs', async () => {
      mockRepo.find.mockResolvedValue([]);
      const result = await service.getByUserId('user-none');
      expect(result).toEqual([]);
    });
  });
});
