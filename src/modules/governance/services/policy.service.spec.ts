import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PolicyService } from './policy.service';
import { GovPolicy } from '../entities/gov-policy.entity';
import { CreatePolicyDto } from '../dto/create-policy.dto';
import { UpdatePolicyDto } from '../dto/update-policy.dto';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('PolicyService', () => {
  let service: PolicyService;
  let repo: Repository<GovPolicy>;

  const mockRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    softRemove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PolicyService,
        { provide: getRepositoryToken(GovPolicy), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<PolicyService>(PolicyService);
    repo = module.get<Repository<GovPolicy>>(getRepositoryToken(GovPolicy));
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // === CREATE ===
  describe('create', () => {
    const dto: CreatePolicyDto = {
      name: 'Test Policy',
      domain: 'SECURITY' as any,
      codeContent: '{"conditions":[],"action":"deny"}',
    };

    it('should create a policy successfully', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      mockRepo.create.mockReturnValue({ ...dto, id: 'uuid-1', version: 1 });
      mockRepo.save.mockResolvedValue({ ...dto, id: 'uuid-1', version: 1 });

      const result = await service.create(dto, 'user-1');
      expect(result.id).toBe('uuid-1');
      expect(result.version).toBe(1);
      expect(mockRepo.findOne).toHaveBeenCalledWith({ where: { name: 'Test Policy' } });
    });

    it('should throw ConflictException if name already exists', async () => {
      mockRepo.findOne.mockResolvedValue({ id: 'existing', name: 'Test Policy' });
      await expect(service.create(dto, 'user-1')).rejects.toThrow(ConflictException);
    });
  });

  // === FIND ALL ===
  describe('findAll', () => {
    it('should return all policies without filters', async () => {
      const policies = [{ id: '1' }, { id: '2' }];
      mockRepo.find.mockResolvedValue(policies);
      const result = await service.findAll();
      expect(result).toEqual(policies);
      expect(mockRepo.find).toHaveBeenCalledWith({ where: {}, order: { createdAt: 'DESC' } });
    });

    it('should filter by domain and status', async () => {
      mockRepo.find.mockResolvedValue([{ id: '1' }]);
      await service.findAll({ domain: 'SECURITY', status: 'active' });
      expect(mockRepo.find).toHaveBeenCalledWith({
        where: { domain: 'SECURITY', status: 'active' },
        order: { createdAt: 'DESC' },
      });
    });
  });

  // === FIND ONE ===
  describe('findOne', () => {
    it('should return a policy by id', async () => {
      const policy = { id: '1', name: 'Test' };
      mockRepo.findOne.mockResolvedValue(policy);
      const result = await service.findOne('1');
      expect(result).toEqual(policy);
    });

    it('should throw NotFoundException if not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
    });
  });

  // === UPDATE ===
  describe('update', () => {
    it('should update a policy', async () => {
      const existing = { id: '1', name: 'Old', version: 1 };
      const dto: UpdatePolicyDto = { name: 'Updated' };
      mockRepo.findOne.mockResolvedValue(existing);
      mockRepo.save.mockResolvedValue({ ...existing, ...dto });
      const result = await service.update('1', dto);
      expect(result.name).toBe('Updated');
    });
  });

  // === REMOVE ===
  describe('remove', () => {
    it('should soft-delete a policy', async () => {
      const policy = { id: '1', name: 'Test' };
      mockRepo.findOne.mockResolvedValue(policy);
      mockRepo.softRemove.mockResolvedValue(undefined);
      const result = await service.remove('1');
      expect(result.deleted).toBe(true);
      expect(mockRepo.softRemove).toHaveBeenCalledWith(policy);
    });

    it('should throw NotFoundException if policy not found for removal', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.remove('999')).rejects.toThrow(NotFoundException);
    });
  });

  // === GET VERSIONS ===
  describe('getVersions', () => {
    it('should return version history', async () => {
      mockRepo.findOne.mockResolvedValue({ id: '1', name: 'Policy A' });
      const versions = [{ id: '1', version: 1 }, { id: '2', version: 2 }];
      mockRepo.find.mockResolvedValue(versions);
      const result = await service.getVersions('1');
      expect(result).toHaveLength(2);
      expect(mockRepo.find).toHaveBeenCalledWith({
        where: { name: 'Policy A' },
        order: { version: 'ASC' },
      });
    });
  });

  // === ROLLBACK ===
  describe('rollback', () => {
    it('should rollback to a previous version', async () => {
      const current = { id: '1', name: 'Policy A', version: 3 };
      const target = { id: 'old', name: 'Policy A', version: 1, codeContent: 'old' };
      mockRepo.findOne
        .mockResolvedValueOnce(current)
        .mockResolvedValueOnce(target);
      mockRepo.create.mockReturnValue({ ...target, id: undefined, version: 4 });
      mockRepo.save.mockResolvedValue({ id: 'new', name: 'Policy A', version: 4 });

      const result = await service.rollback('1', 1);
      expect(result.version).toBe(4);
    });

    it('should throw NotFoundException if target version not found', async () => {
      mockRepo.findOne
        .mockResolvedValueOnce({ id: '1', name: 'Policy A', version: 2 });
      mockRepo.findOne.mockResolvedValueOnce(null);
      await expect(service.rollback('1', 99)).rejects.toThrow(NotFoundException);
    });
  });

  // === DRY RUN TEST ===
  describe('dryRunTest', () => {
    it('should evaluate JSON rules and return result', async () => {
      const policy = {
        id: '1',
        name: 'Test',
        version: 1,
        codeContent: '{"conditions":[{"field":"amount","operator":">","value":1000}],"action":"deny"}',
      };
      mockRepo.findOne.mockResolvedValue(policy);
      const result = await service.dryRunTest('1', { amount: 5000 });
      expect(result.result).toBe('deny');
    });

    it('should permit when conditions not met', async () => {
      const policy = {
        id: '1',
        name: 'Test',
        version: 1,
        codeContent: '{"conditions":[{"field":"amount","operator":">","value":1000}],"action":"deny"}',
      };
      mockRepo.findOne.mockResolvedValue(policy);
      const result = await service.dryRunTest('1', { amount: 100 });
      expect(result.result).toBe('permit');
    });
  });

  // === ACTIVATE / DEACTIVATE ===
  describe('activate', () => {
    it('should activate a policy', async () => {
      const policy = { id: '1', status: 'DRAFT' };
      mockRepo.findOne.mockResolvedValue(policy);
      mockRepo.save.mockResolvedValue({ ...policy, status: 'ACTIVE' });
      const result = await service.activate('1');
      expect(result.status).toBe('ACTIVE');
    });

    it('should throw NotFoundException if not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.activate('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('deactivate', () => {
    it('should deactivate a policy', async () => {
      const policy = { id: '1', status: 'ACTIVE' };
      mockRepo.findOne.mockResolvedValue(policy);
      mockRepo.save.mockResolvedValue({ ...policy, status: 'INACTIVE' });
      const result = await service.deactivate('1');
      expect(result.status).toBe('INACTIVE');
    });
  });

  // === CANARY ROLLOUT ===
  describe('canaryRollout', () => {
    it('should configure canary rollout with valid percentage', async () => {
      const policy = { id: '1', enforcementMode: 'ENFORCE', applicableScope: {} };
      mockRepo.findOne.mockResolvedValue(policy);
      mockRepo.save.mockResolvedValue({ ...policy, enforcementMode: 'CANARY', applicableScope: { canaryPercent: 50 } });
      const result = await service.canaryRollout('1', 50);
      expect(result.canaryPercent).toBe(50);
      expect(result.status).toBe('canary_active');
    });

    it('should clamp percentage to 100', async () => {
      const policy = { id: '1', enforcementMode: 'ENFORCE', applicableScope: {} };
      mockRepo.findOne.mockResolvedValue(policy);
      mockRepo.save.mockResolvedValue({ ...policy, applicableScope: { canaryPercent: 100 } });
      const result = await service.canaryRollout('1', 150);
      expect(result.canaryPercent).toBe(100);
      expect(result.status).toBe('fully_activated');
    });

    it('should clamp percentage to 0 for negative values', async () => {
      const policy = { id: '1', enforcementMode: 'ENFORCE', applicableScope: {} };
      mockRepo.findOne.mockResolvedValue(policy);
      mockRepo.save.mockResolvedValue({ ...policy, applicableScope: { canaryPercent: 0 } });
      const result = await service.canaryRollout('1', -10);
      expect(result.canaryPercent).toBe(0);
    });

    it('should throw NotFoundException if policy not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.canaryRollout('999', 50)).rejects.toThrow(NotFoundException);
    });
  });

  // === EVALUATE JSON RULES ===
  describe('evaluateJsonRules', () => {
    it('should return undefined if JSON is invalid', () => {
      const result = service.evaluateJsonRules('not-json', {});
      expect(result.result).toBe('undefined');
    });

    it('should return undefined if no conditions array', () => {
      const result = service.evaluateJsonRules('{"action":"deny"}', {});
      expect(result.result).toBe('undefined');
    });

    it('should evaluate == operator', () => {
      const rules = '{"conditions":[{"field":"role","operator":"==","value":"admin"}],"action":"allow"}';
      expect(service.evaluateJsonRules(rules, { role: 'admin' }).result).toBe('allow');
      expect(service.evaluateJsonRules(rules, { role: 'user' }).result).toBe('permit');
    });

    it('should evaluate exists operator', () => {
      const rules = '{"conditions":[{"field":"email","operator":"exists","value":null}],"action":"deny"}';
      expect(service.evaluateJsonRules(rules, { email: 'test@test.com' }).result).toBe('deny');
      expect(service.evaluateJsonRules(rules, {}).result).toBe('permit');
    });

    it('should evaluate in operator', () => {
      const rules = '{"conditions":[{"field":"role","operator":"in","value":["admin","manager"]}],"action":"allow"}';
      expect(service.evaluateJsonRules(rules, { role: 'admin' }).result).toBe('allow');
      expect(service.evaluateJsonRules(rules, { role: 'guest' }).result).toBe('permit');
    });

    it('should evaluate contains operator', () => {
      const rules = '{"conditions":[{"field":"path","operator":"contains","value":"admin"}],"action":"deny"}';
      expect(service.evaluateJsonRules(rules, { path: '/admin/users' }).result).toBe('deny');
      expect(service.evaluateJsonRules(rules, { path: '/users' }).result).toBe('permit');
    });
  });

  // === GET ACTIVE POLICIES ===
  describe('getActivePolicies', () => {
    it('should return only active policies', async () => {
      const activePolicies = [{ id: '1', status: 'active' }];
      mockRepo.find.mockResolvedValue(activePolicies);
      const result = await service.getActivePolicies();
      expect(result).toEqual(activePolicies);
      expect(mockRepo.find).toHaveBeenCalledWith({ where: { status: 'active' } });
    });

    it('should filter by domain when provided', async () => {
      mockRepo.find.mockResolvedValue([]);
      await service.getActivePolicies('SECURITY');
      expect(mockRepo.find).toHaveBeenCalledWith({
        where: { status: 'active', domain: 'SECURITY' },
      });
    });
  });
});
