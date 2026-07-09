jest.mock('../entities/policy-version.entity');

import { PolicyVersionService } from './policy-version.service';
import { PolicyVersionStatus } from '../entities/policy-version-status.enum';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('PolicyVersionService', () => {
  let service: PolicyVersionService;
  let repo: any;

  beforeEach(() => {
    repo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    service = new PolicyVersionService(repo);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createVersion', () => {
    it('should create version with DRAFT status', async () => {
      repo.findOne.mockResolvedValue(null);
      const mockCreated = { id: 'v1', version: '1.0', status: PolicyVersionStatus.DRAFT };
      repo.create.mockReturnValue(mockCreated);
      repo.save.mockResolvedValue(mockCreated);

      const dto = { version: '1.0', content: 'Privacy policy text' };
      const result = await service.createVersion(dto);
      expect(result).toBe(mockCreated);
      expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({
        version: '1.0',
        status: PolicyVersionStatus.DRAFT,
        requiresReconsent: false,
        checksum: null,
        publishedAt: null,
        publishedBy: null,
        acceptanceCount: 0,
      }));
    });

    it('should set requiresReconsent true when provided', async () => {
      repo.findOne.mockResolvedValue(null);
      repo.create.mockReturnValue({ id: 'v1' });
      repo.save.mockResolvedValue({ id: 'v1' });
      await service.createVersion({ version: '2.0', content: 'text', requiresReconsent: true });
      expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({
        requiresReconsent: true,
      }));
    });

    it('should throw BadRequestException when version already exists', async () => {
      repo.findOne.mockResolvedValue({ id: 'existing', version: '1.0' });
      await expect(service.createVersion({ version: '1.0', content: 'text' }))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('listVersions', () => {
    it('should return all versions ordered DESC', async () => {
      const mockVersions = [{ id: 'v1' }, { id: 'v2' }];
      repo.find.mockResolvedValue(mockVersions);
      const result = await service.listVersions();
      expect(result).toBe(mockVersions);
      expect(repo.find).toHaveBeenCalledWith({ order: { createdAt: 'DESC' } });
    });
  });

  describe('getVersion', () => {
    it('should return version by id', async () => {
      const mockVersion = { id: 'v1', version: '1.0' };
      repo.findOne.mockResolvedValue(mockVersion);
      const result = await service.getVersion('v1');
      expect(result).toBe(mockVersion);
    });

    it('should throw NotFoundException when not found', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.getVersion('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getCurrentPublished', () => {
    it('should return latest published version', async () => {
      const mockVersion = { id: 'v2', status: PolicyVersionStatus.PUBLISHED, version: '2.0' };
      repo.findOne.mockResolvedValue(mockVersion);
      const result = await service.getCurrentPublished();
      expect(result).toBe(mockVersion);
      expect(repo.findOne).toHaveBeenCalledWith({
        where: { status: PolicyVersionStatus.PUBLISHED },
        order: { publishedAt: 'DESC' },
      });
    });

    it('should throw NotFoundException when no published version exists', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.getCurrentPublished()).rejects.toThrow(NotFoundException);
    });
  });

  describe('publishVersion', () => {
    it('should publish DRAFT version and set fields', async () => {
      const version = { id: 'v1', version: '1.0', status: PolicyVersionStatus.DRAFT, content: 'text' };
      repo.findOne.mockResolvedValueOnce(version); // getVersion's findOne
      repo.findOne.mockResolvedValueOnce(null); // check for existing PUBLISHED
      repo.save.mockImplementation((e: any) => Promise.resolve(e));

      const result = await service.publishVersion('v1', 'admin');
      expect(result.status).toBe(PolicyVersionStatus.PUBLISHED);
      expect(result.publishedAt).toBeInstanceOf(Date);
      expect(result.publishedBy).toBe('admin');
      expect(result.checksum).toHaveLength(64); // SHA-256 hex
    });

    it('should supersede previously published version', async () => {
      const version = { id: 'v1', status: PolicyVersionStatus.DRAFT, content: 'text' };
      const oldPublished = { id: 'v0', status: PolicyVersionStatus.PUBLISHED };
      repo.findOne.mockResolvedValueOnce(version); // getVersion
      repo.findOne.mockResolvedValueOnce(oldPublished); // existing PUBLISHED
      repo.save.mockImplementation((e: any) => Promise.resolve(e));

      await service.publishVersion('v1', 'admin');
      expect(oldPublished.status).toBe(PolicyVersionStatus.SUPERSEDED);
      expect(repo.save).toHaveBeenCalledWith(oldPublished);
    });

    it('should throw BadRequestException when version is not DRAFT', async () => {
      repo.findOne.mockResolvedValue({ id: 'v1', status: PolicyVersionStatus.PUBLISHED });
      await expect(service.publishVersion('v1', 'admin')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when version not found', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.publishVersion('nonexistent', 'admin')).rejects.toThrow(NotFoundException);
    });
  });

  describe('incrementAcceptance', () => {
    it('should increment acceptanceCount', async () => {
      const version = { id: 'v1', acceptanceCount: 5 };
      repo.findOne.mockResolvedValue(version);
      repo.save.mockResolvedValue(version);
      await service.incrementAcceptance('v1');
      expect(version.acceptanceCount).toBe(6);
      expect(repo.save).toHaveBeenCalledWith(version);
    });

    it('should throw NotFoundException when not found', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.incrementAcceptance('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('checkReconsentRequired', () => {
    it('should return true when current published version requires reconsent', async () => {
      const version = { id: 'v1', requiresReconsent: true, status: PolicyVersionStatus.PUBLISHED };
      repo.findOne.mockResolvedValue(version);
      const result = await service.checkReconsentRequired('u1');
      expect(result.requiresReconsent).toBe(true);
      expect(result.version).toBe(version);
    });

    it('should return false when no published version exists', async () => {
      repo.findOne.mockResolvedValue(null);
      const result = await service.checkReconsentRequired('u1');
      expect(result.requiresReconsent).toBe(false);
      expect(result.version).toBeNull();
    });

    it('should return false when published version does not require reconsent', async () => {
      const version = { id: 'v1', requiresReconsent: false };
      repo.findOne.mockResolvedValue(version);
      const result = await service.checkReconsentRequired('u1');
      expect(result.requiresReconsent).toBe(false);
      expect(result.version).toBeNull();
    });
  });
});
