// Mock entities and external deps
jest.mock('../entities/role.entity');
jest.mock('../entities/user-role.entity');
jest.mock('../../audit/services/audit.service');

import { RbacService } from './rbac.service';
import { BadRequestException } from '@nestjs/common';

describe('RbacService', () => {
  let service: RbacService;
  let roleRepo: any;
  let userRoleRepo: any;
  let auditService: any;

  beforeEach(() => {
    roleRepo = {
      findOneBy: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
    };
    userRoleRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    auditService = { log: jest.fn().mockResolvedValue(undefined) };

    service = new RbacService(roleRepo, userRoleRepo, auditService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ===========================
  // createRole()
  // ===========================

  describe('createRole', () => {
    it('should create and return a new role', async () => {
      roleRepo.findOneBy.mockResolvedValue(null);
      const mockRole = { id: 'role-1', name: 'ADMIN', permissions: ['read', 'write'] };
      roleRepo.create.mockReturnValue(mockRole);
      roleRepo.save.mockResolvedValue(undefined);

      const result = await service.createRole('ADMIN', ['read', 'write']);

      expect(result).toBe(mockRole);
      expect(roleRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'ADMIN',
          permissions: ['read', 'write'],
          isSystemRole: false,
          parentRoleId: null,
        }),
      );
    });

    it('should set isSystemRole to true when provided', async () => {
      roleRepo.findOneBy.mockResolvedValue(null);
      roleRepo.create.mockReturnValue({ id: 'r1' });
      roleRepo.save.mockResolvedValue(undefined);

      await service.createRole('ROOT', ['*'], true);

      expect(roleRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ isSystemRole: true }),
      );
    });

    it('should throw BadRequestException when role already exists', async () => {
      roleRepo.findOneBy.mockResolvedValue({ id: 'existing' });

      await expect(service.createRole('ADMIN', ['read']))
        .rejects.toThrow(BadRequestException);
    });
  });

  // ===========================
  // updateRole()
  // ===========================

  describe('updateRole', () => {
    it('should update role name and permissions', async () => {
      const mockRole = { id: 'r1', name: 'OLD', permissions: ['old'], description: null };
      roleRepo.findOneBy.mockResolvedValue(mockRole);
      roleRepo.save.mockResolvedValue(undefined);

      const result = await service.updateRole('r1', {
        name: 'NEW',
        permissions: ['new'],
        description: 'Updated desc',
      });

      expect(result.name).toBe('NEW');
      expect(result.permissions).toEqual(['new']);
      expect(result.description).toBe('Updated desc');
      expect(roleRepo.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException when role not found', async () => {
      roleRepo.findOneBy.mockResolvedValue(null);

      await expect(service.updateRole('nonexistent', { name: 'X' }))
        .rejects.toThrow(BadRequestException);
    });

    it('should not modify fields not provided in updates', async () => {
      const mockRole = { id: 'r1', name: 'KEEP', permissions: ['keep'], description: 'keep-desc' };
      roleRepo.findOneBy.mockResolvedValue(mockRole);
      roleRepo.save.mockResolvedValue(undefined);

      await service.updateRole('r1', {});

      expect(mockRole.name).toBe('KEEP');
      expect(mockRole.permissions).toEqual(['keep']);
    });

    it('should allow setting description to null', async () => {
      const mockRole = { id: 'r1', name: 'R', permissions: [], description: 'old' };
      roleRepo.findOneBy.mockResolvedValue(mockRole);
      roleRepo.save.mockResolvedValue(undefined);

      await service.updateRole('r1', { description: null });

      expect(mockRole.description).toBeNull();
    });
  });

  // ===========================
  // getAllRoles()
  // ===========================

  describe('getAllRoles', () => {
    it('should return all roles ordered by createdAt', async () => {
      const mockRoles = [{ id: 'r1' }, { id: 'r2' }];
      roleRepo.find.mockResolvedValue(mockRoles);

      const result = await service.getAllRoles();

      expect(result).toBe(mockRoles);
      expect(roleRepo.find).toHaveBeenCalledWith({ order: { createdAt: 'ASC' } });
    });

    it('should return empty array when no roles', async () => {
      roleRepo.find.mockResolvedValue([]);

      expect(await service.getAllRoles()).toEqual([]);
    });
  });

  // ===========================
  // assignRoleToUser()
  // ===========================

  describe('assignRoleToUser', () => {
    it('should assign role to user', async () => {
      userRoleRepo.findOne.mockResolvedValue(null);
      roleRepo.findOneBy.mockResolvedValue({ id: 'r1', name: 'ADMIN' });
      userRoleRepo.create.mockReturnValue({ userId: 'u1', roleId: 'r1', isActive: true });
      userRoleRepo.save.mockResolvedValue(undefined);

      await service.assignRoleToUser('u1', 'r1');

      expect(userRoleRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'u1', roleId: 'r1', isActive: true }),
      );
      expect(auditService.log).toHaveBeenCalled();
    });

    it('should accept optional orgId', async () => {
      userRoleRepo.findOne.mockResolvedValue(null);
      roleRepo.findOneBy.mockResolvedValue({ id: 'r1', name: 'ADMIN' });
      userRoleRepo.create.mockReturnValue({});
      userRoleRepo.save.mockResolvedValue(undefined);

      await service.assignRoleToUser('u1', 'r1', 'org-1');

      expect(userRoleRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ orgId: 'org-1' }),
      );
    });

    it('should default orgId to null when not provided', async () => {
      userRoleRepo.findOne.mockResolvedValue(null);
      roleRepo.findOneBy.mockResolvedValue({ id: 'r1', name: 'ADMIN' });
      userRoleRepo.create.mockReturnValue({});
      userRoleRepo.save.mockResolvedValue(undefined);

      await service.assignRoleToUser('u1', 'r1');

      expect(userRoleRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ orgId: null }),
      );
    });

    it('should skip if role already assigned and active', async () => {
      userRoleRepo.findOne.mockResolvedValue({ isActive: true });
      roleRepo.findOneBy.mockResolvedValue({ id: 'r1', name: 'ADMIN' });

      await service.assignRoleToUser('u1', 'r1');

      expect(userRoleRepo.create).not.toHaveBeenCalled();
      expect(userRoleRepo.save).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when role does not exist', async () => {
      userRoleRepo.findOne.mockResolvedValue(null);
      roleRepo.findOneBy.mockResolvedValue(null);

      await expect(service.assignRoleToUser('u1', 'nonexistent'))
        .rejects.toThrow(BadRequestException);
    });
  });

  // ===========================
  // revokeRoleFromUser()
  // ===========================

  describe('revokeRoleFromUser', () => {
    it('should deactivate user role', async () => {
      const mockUR = { userId: 'u1', roleId: 'r1', isActive: true };
      userRoleRepo.findOne.mockResolvedValue(mockUR);
      userRoleRepo.save.mockResolvedValue(undefined);

      await service.revokeRoleFromUser('u1', 'r1');

      expect(mockUR.isActive).toBe(false);
      expect(userRoleRepo.save).toHaveBeenCalled();
    });

    it('should silently return when no assignment found', async () => {
      userRoleRepo.findOne.mockResolvedValue(null);

      await service.revokeRoleFromUser('u1', 'r1');

      expect(userRoleRepo.save).not.toHaveBeenCalled();
    });
  });

  // ===========================
  // getUserRoles()
  // ===========================

  describe('getUserRoles', () => {
    it('should return array of role names for active assignments', async () => {
      const mockQB = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          { role: { name: 'ADMIN' } },
          { role: { name: 'AUDITOR' } },
        ]),
      };
      userRoleRepo.createQueryBuilder.mockReturnValue(mockQB);

      const result = await service.getUserRoles('u1');

      expect(result).toEqual(['ADMIN', 'AUDITOR']);
      expect(mockQB.leftJoin).toHaveBeenCalledWith('ur.role', 'r');
      expect(mockQB.where).toHaveBeenCalledWith(
        'ur.userId = :userId AND ur.isActive = :isActive',
        { userId: 'u1', isActive: true },
      );
    });

    it('should return empty array when user has no roles', async () => {
      const mockQB = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      userRoleRepo.createQueryBuilder.mockReturnValue(mockQB);

      expect(await service.getUserRoles('u1')).toEqual([]);
    });
  });

  // ===========================
  // hasPermission()
  // ===========================

  describe('hasPermission', () => {
    it('should return true when user has required permission', async () => {
      jest.spyOn(service, 'getUserRoles').mockResolvedValue(['ADMIN']);
      roleRepo.findOneBy.mockResolvedValue({ name: 'ADMIN', permissions: ['read:all', 'write:all'] });

      const result = await service.hasPermission('u1', 'read:all');

      expect(result).toBe(true);
    });

    it('should return false when user lacks permission', async () => {
      jest.spyOn(service, 'getUserRoles').mockResolvedValue(['VIEWER']);
      roleRepo.findOneBy.mockResolvedValue({ name: 'VIEWER', permissions: ['read:all'] });

      expect(await service.hasPermission('u1', 'delete:all')).toBe(false);
    });

    it('should return false when user has no roles', async () => {
      jest.spyOn(service, 'getUserRoles').mockResolvedValue([]);

      expect(await service.hasPermission('u1', 'read:all')).toBe(false);
    });

    it('should return false when role not found in roleRepo', async () => {
      jest.spyOn(service, 'getUserRoles').mockResolvedValue(['GHOST']);
      roleRepo.findOneBy.mockResolvedValue(null);

      expect(await service.hasPermission('u1', 'read:all')).toBe(false);
    });

    it('should return true on first matching role with permission', async () => {
      jest.spyOn(service, 'getUserRoles').mockResolvedValue(['VIEWER', 'ADMIN']);
      roleRepo.findOneBy
        .mockResolvedValueOnce({ name: 'VIEWER', permissions: ['read:limited'] })
        .mockResolvedValueOnce({ name: 'ADMIN', permissions: ['read:all', 'write:all'] });

      expect(await service.hasPermission('u1', 'write:all')).toBe(true);
    });
  });
});
