// Mock entities and external deps
jest.mock('../entities/mfa-factor.entity');
jest.mock('../../audit/services/audit.service');
jest.mock('otplib', () => ({
  authenticator: { options: null, checkToken: jest.fn() },
}));
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-value'),
  compare: jest.fn().mockResolvedValue(false),
}));

import { MfaService } from './mfa.service';
import { MfaType } from '../entities/mfa-type.enum';
import * as bcrypt from 'bcrypt';
const { authenticator } = require('otplib');

describe('MfaService', () => {
  let service: MfaService;
  let mfaRepo: any;
  let config: any;
  let auditService: any;
  let validEncryptedSecret: string;

  beforeEach(() => {
    mfaRepo = { create: jest.fn(), save: jest.fn(), findOne: jest.fn(), findOneBy: jest.fn(), find: jest.fn() };
    config = { get: jest.fn() };
    auditService = { log: jest.fn().mockResolvedValue(undefined) };
    (authenticator.checkToken as jest.Mock).mockReturnValue(false);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-value');
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);
    service = new MfaService(mfaRepo, config, auditService);
    // Generate a properly encrypted secret using the real encrypt()
    validEncryptedSecret = (service as any).encrypt('test-secret-key');
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => expect(service).toBeDefined());

  // generateTOTPSecret
  describe('generateTOTPSecret', () => {
    it('should generate encrypted TOTP secret and QR data', async () => {
      const result = await service.generateTOTPSecret();
      expect(result.secret).toBeDefined();
      expect(result.qrCodeData).toContain('otpauth://totp');
      expect(result.qrCodeData).toContain('issuer=BankChat');
    });
    it('should include encrypted secret in QR code data', async () => {
      const result = await service.generateTOTPSecret();
      expect(result.qrCodeData).toContain(encodeURIComponent(result.secret));
    });
  });

  // setupMfaFactor
  describe('setupMfaFactor', () => {
    it('should create MFA factor and return ID', async () => {
      mfaRepo.create.mockReturnValue({ id: 'factor-123' });
      mfaRepo.save.mockResolvedValue(undefined);
      const result = await service.setupMfaFactor('user-uuid', MfaType.TOTP, 'secret');
      expect(result).toBe('factor-123');
      expect(mfaRepo.create).toHaveBeenCalledWith(expect.objectContaining({ userId: 'user-uuid', isActive: false }));
    });
    it('should accept undefined encryptedSecret', async () => {
      mfaRepo.create.mockReturnValue({ id: 'factor-x' });
      mfaRepo.save.mockResolvedValue(undefined);
      expect(await service.setupMfaFactor('user-uuid', MfaType.EMAIL)).toBeDefined();
    });
  });

  // verifyTOTPCode
  describe('verifyTOTPCode', () => {
    it('should return true for valid TOTP code on active factor', async () => {
      mfaRepo.findOne.mockResolvedValue({
        id: 'f1', userId: 'u1', type: MfaType.TOTP,
        secretEncrypted: validEncryptedSecret, isActive: true,
      });
      (authenticator.checkToken as jest.Mock).mockReturnValue(true);
      const result = await service.verifyTOTPCode('f1', '123456');
      expect(result).toBe(true);
      expect(mfaRepo.save).toHaveBeenCalled();
    });
    it('should return false for inactive factor', async () => {
      mfaRepo.findOne.mockResolvedValue({ id: 'f1', secretEncrypted: validEncryptedSecret, isActive: false });
      expect(await service.verifyTOTPCode('f1', '123456')).toBe(false);
    });
    it('should return false when factor not found', async () => {
      mfaRepo.findOne.mockResolvedValue(null);
      expect(await service.verifyTOTPCode('nope', '123456')).toBe(false);
    });
    it('should return false for invalid code', async () => {
      mfaRepo.findOne.mockResolvedValue({ id: 'f1', secretEncrypted: validEncryptedSecret, isActive: true });
      (authenticator.checkToken as jest.Mock).mockReturnValue(false);
      expect(await service.verifyTOTPCode('f1', '999999')).toBe(false);
    });
  });

  // enableFactor
  describe('enableFactor', () => {
    it('should enable TOTP factor with valid code', async () => {
      mfaRepo.findOneBy.mockResolvedValue({
        id: 'f1', userId: 'u1', type: MfaType.TOTP,
        secretEncrypted: validEncryptedSecret, isActive: false,
      });
      (authenticator.checkToken as jest.Mock).mockReturnValue(true);
      const result = await service.enableFactor('f1', '123456');
      expect(result).toBe(true);
    });
    it('should throw BadRequestException when factor not found', async () => {
      mfaRepo.findOneBy.mockResolvedValue(null);
      await expect(service.enableFactor('nope', '123456')).rejects.toThrow('MFA factor not found');
    });
    it('should return false for invalid TOTP code', async () => {
      mfaRepo.findOneBy.mockResolvedValue({
        id: 'f1', type: MfaType.TOTP, secretEncrypted: validEncryptedSecret, isActive: false,
      });
      (authenticator.checkToken as jest.Mock).mockReturnValue(false);
      expect(await service.enableFactor('f1', '999999')).toBe(false);
    });
    it('should enable non-TOTP factor without code validation', async () => {
      mfaRepo.findOneBy.mockResolvedValue({ id: 'f1', type: MfaType.EMAIL, isActive: false });
      expect(await service.enableFactor('f1', 'ignore')).toBe(true);
    });
  });

  // disableFactor
  describe('disableFactor', () => {
    it('should disable MFA factor', async () => {
      const f = { id: 'f1', userId: 'u1', type: MfaType.TOTP, isActive: true };
      mfaRepo.findOne.mockResolvedValue(f);
      await service.disableFactor('f1', 'u1');
      expect(f.isActive).toBe(false);
    });
    it('should throw when factor not found', async () => {
      mfaRepo.findOne.mockResolvedValue(null);
      await expect(service.disableFactor('nope', 'u1')).rejects.toThrow('MFA factor not found');
    });
  });

  // listFactors
  describe('listFactors', () => {
    it('should return array of user MFA factors', async () => {
      mfaRepo.find.mockResolvedValue([
        { id: 'f1', type: MfaType.TOTP, isActive: true, label: 'App', verifiedAt: new Date() },
        { id: 'f2', type: MfaType.EMAIL, isActive: false, label: null, verifiedAt: null },
      ]);
      const result = await service.listFactors('u1');
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('f1');
    });
    it('should return empty array', async () => {
      mfaRepo.find.mockResolvedValue([]);
      expect(await service.listFactors('u1')).toEqual([]);
    });
  });

  // generateBackupCodes
  describe('generateBackupCodes', () => {
    it('should generate 8 backup codes by default', async () => {
      mfaRepo.findOne.mockResolvedValue(null);
      mfaRepo.create.mockReturnValue({ id: 'bf' });
      mfaRepo.save.mockResolvedValue(undefined);
      const result = await service.generateBackupCodes('u1');
      expect(result).toHaveLength(8);
      expect(result[0]).toMatch(/^[A-F0-9]+$/);
    });
    it('should update existing backup factor', async () => {
      const existing = { id: 'old', userId: 'u1', type: MfaType.BACKUP_CODE, backupCodesHashed: ['old'] };
      mfaRepo.findOne.mockResolvedValue(existing);
      mfaRepo.save.mockResolvedValue(undefined);
      expect(await service.generateBackupCodes('u1', 5)).toHaveLength(5);
    });
  });

  // verifyBackupCode
  describe('verifyBackupCode', () => {
    it('should return true for valid unused backup code', async () => {
      const f = { id: 'bf', userId: 'u1', type: MfaType.BACKUP_CODE, backupCodesHashed: ['h1', 'h2', 'h3'] };
      mfaRepo.findOne.mockResolvedValue(f);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);
      const result = await service.verifyBackupCode('u1', 'valid');
      expect(result).toBe(true);
      expect(mfaRepo.save).toHaveBeenCalled();
    });
    it('should return false when no backup codes', async () => {
      mfaRepo.findOne.mockResolvedValue({ id: 'bf', type: MfaType.BACKUP_CODE, backupCodesHashed: [] });
      expect(await service.verifyBackupCode('u1', 'x')).toBe(false);
    });
    it('should return false for invalid code', async () => {
      mfaRepo.findOne.mockResolvedValue({ id: 'bf', type: MfaType.BACKUP_CODE, backupCodesHashed: ['h1'] });
      expect(await service.verifyBackupCode('u1', 'bad')).toBe(false);
    });
    it('should remove used code', async () => {
      const f = { id: 'bf', type: MfaType.BACKUP_CODE, backupCodesHashed: ['h1', 'h2'] };
      mfaRepo.findOne.mockResolvedValue(f);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);
      await service.verifyBackupCode('u1', 'valid');
      expect(f.backupCodesHashed).toHaveLength(1);
    });
    it('should return false when no backup factor exists', async () => {
      mfaRepo.findOne.mockResolvedValue(null);
      expect(await service.verifyBackupCode('u1', 'x')).toBe(false);
    });
  });
});
