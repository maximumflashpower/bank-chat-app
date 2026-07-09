// Mock entities and external deps
jest.mock('../entities/passkey.entity');
jest.mock('../../audit/services/audit.service');

import { PasskeyService } from './passkey.service';
import { BadRequestException } from '@nestjs/common';

describe('PasskeyService', () => {
  let service: PasskeyService;
  let passkeyRepo: any;
  let config: any;
  let auditService: any;

  beforeEach(() => {
    passkeyRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    config = { get: jest.fn() };
    auditService = { log: jest.fn().mockResolvedValue(undefined) };

    service = new PasskeyService(passkeyRepo, config, auditService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ===========================
  // generateRegistrationChallenge()
  // ===========================

  describe('generateRegistrationChallenge', () => {
    it('should return challenge and userId', async () => {
      const result = await service.generateRegistrationChallenge('user-123');

      expect(result.userId).toBe('user-123');
      expect(result.challenge).toBeDefined();
      expect(typeof result.challenge).toBe('string');
    });

    it('should generate hex challenge of 64 chars (32 bytes)', async () => {
      const result = await service.generateRegistrationChallenge('user-123');

      expect(result.challenge).toMatch(/^[a-f0-9]+$/);
      expect(result.challenge.length).toBe(64);
    });

    it('should generate unique challenges each call', async () => {
      const r1 = await service.generateRegistrationChallenge('user-123');
      const r2 = await service.generateRegistrationChallenge('user-123');

      expect(r1.challenge).not.toBe(r2.challenge);
    });
  });

  // ===========================
  // verifyRegistration()
  // ===========================

  describe('verifyRegistration', () => {
    it('should create and save passkey, return ID', async () => {
      const mockPasskey = { id: 'passkey-uuid-123' };
      passkeyRepo.create.mockReturnValue(mockPasskey);
      passkeyRepo.save.mockResolvedValue(undefined);

      const result = await service.verifyRegistration(
        'user-123',
        Buffer.from('credential-id'),
        Buffer.from('public-key'),
        ['usb', 'nfc'],
        'platform',
      );

      expect(result).toBe('passkey-uuid-123');
      expect(passkeyRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          credentialId: expect.any(Buffer),
          publicKey: expect.any(Buffer),
          signCount: 0,
          deviceType: 'platform',
          transports: ['usb', 'nfc'],
        }),
      );
    });

    it('should default transports and deviceType to empty/null', async () => {
      passkeyRepo.create.mockReturnValue({ id: 'pk-1' });
      passkeyRepo.save.mockResolvedValue(undefined);

      await service.verifyRegistration('user-123', Buffer.from('cred'), Buffer.from('key'));

      expect(passkeyRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          deviceType: null,
          transports: [],
        }),
      );
    });
  });

  // ===========================
  // generateLoginChallenge()
  // ===========================

  describe('generateLoginChallenge', () => {
    it('should return a challenge string', async () => {
      const result = await service.generateLoginChallenge();

      expect(result.challenge).toBeDefined();
      expect(typeof result.challenge).toBe('string');
    });

    it('should generate unique login challenges', async () => {
      const r1 = await service.generateLoginChallenge();
      const r2 = await service.generateLoginChallenge();

      expect(r1.challenge).not.toBe(r2.challenge);
    });
  });

  // ===========================
  // authenticateWithPasskey()
  // ===========================

  describe('authenticateWithPasskey', () => {
    const credId = Buffer.from('cred-123');
    const signature = Buffer.from('sig');
    const clientDataJSON = '{"challenge":"abc"}';
    const authData = Buffer.from('auth-data');

    it('should return true and update signCount for valid passkey', async () => {
      const mockPasskey = {
        id: 'pk-1', userId: 'user-123', credentialId: credId,
        signCount: 5, nickname: 'My Device', lastUsedAt: null,
      };
      passkeyRepo.findOne.mockResolvedValue(mockPasskey);
      passkeyRepo.save.mockResolvedValue(undefined);

      const result = await service.authenticateWithPasskey('user-123', credId, signature, clientDataJSON, authData);

      expect(result).toBe(true);
      expect(mockPasskey.signCount).toBe(6);
      expect(mockPasskey.lastUsedAt).toBeDefined();
      expect(passkeyRepo.save).toHaveBeenCalled();
    });

    it('should return false when passkey not found', async () => {
      passkeyRepo.findOne.mockResolvedValue(null);

      const result = await service.authenticateWithPasskey('user-123', credId, signature, clientDataJSON, authData);

      expect(result).toBe(false);
      expect(passkeyRepo.save).not.toHaveBeenCalled();
    });
  });

  // ===========================
  // listPasskeys()
  // ===========================

  describe('listPasskeys', () => {
    it('should return mapped passkey list', async () => {
      const mockQB = {
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          { id: 'pk-1', nickname: 'Phone', deviceType: 'platform', lastUsedAt: new Date() },
          { id: 'pk-2', nickname: null, deviceType: null, lastUsedAt: null },
        ]),
      };
      passkeyRepo.createQueryBuilder.mockReturnValue(mockQB);

      const result = await service.listPasskeys('user-123');

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ id: 'pk-1', nickname: 'Phone', deviceType: 'platform', lastUsedAt: expect.any(Date) });
      expect(result[1]).toEqual({ id: 'pk-2', nickname: null, deviceType: null, lastUsedAt: null });
      expect(mockQB.where).toHaveBeenCalledWith('pk.userId = :userId', { userId: 'user-123' });
    });

    it('should return empty array when no passkeys', async () => {
      const mockQB = {
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      passkeyRepo.createQueryBuilder.mockReturnValue(mockQB);

      const result = await service.listPasskeys('user-123');

      expect(result).toEqual([]);
    });
  });

  // ===========================
  // revokePasskey()
  // ===========================

  describe('revokePasskey', () => {
    it('should remove passkey when found', async () => {
      const mockPasskey = { id: 'pk-1', userId: 'user-123' };
      passkeyRepo.findOne.mockResolvedValue(mockPasskey);
      passkeyRepo.remove.mockResolvedValue(undefined);

      await service.revokePasskey('pk-1', 'user-123');

      expect(passkeyRepo.remove).toHaveBeenCalledWith(mockPasskey);
    });

    it('should throw BadRequestException when passkey not found', async () => {
      passkeyRepo.findOne.mockResolvedValue(null);

      await expect(service.revokePasskey('nonexistent', 'user-123'))
        .rejects.toThrow(BadRequestException);
    });
  });

  // ===========================
  // renamePasskey()
  // ===========================

  describe('renamePasskey', () => {
    it('should update nickname and return result', async () => {
      const mockPasskey = { id: 'pk-1', userId: 'user-123', nickname: 'Old Name' };
      passkeyRepo.findOne.mockResolvedValue(mockPasskey);
      passkeyRepo.save.mockResolvedValue(undefined);

      const result = await service.renamePasskey('pk-1', 'user-123', 'New Name');

      expect(result).toEqual({ id: 'pk-1', nickname: 'New Name' });
      expect(mockPasskey.nickname).toBe('New Name');
      expect(passkeyRepo.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException when passkey not found', async () => {
      passkeyRepo.findOne.mockResolvedValue(null);

      await expect(service.renamePasskey('nonexistent', 'user-123', 'Name'))
        .rejects.toThrow(BadRequestException);
    });
  });
});
