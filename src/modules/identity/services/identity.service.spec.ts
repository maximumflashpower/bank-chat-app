// Mock entities and external deps to break circular imports
jest.mock('../entities/identity-user.entity');
jest.mock('../entities/credential.entity');
jest.mock('../../audit/services/audit.service');
jest.mock('bcrypt');

import * as bcrypt from 'bcrypt';
import { IdentityService } from './identity.service';
import { UserStatus } from '../entities/user-status.enum';
import { CredentialType } from '../entities/credential-type.enum';
import { ConflictException, BadRequestException, UnauthorizedException } from '@nestjs/common';

describe('IdentityService', () => {
  let service: IdentityService;
  let userRepo: any;
  let credentialRepo: any;
  let config: any;
  let jwtService: any;
  let redis: any;
  let auditService: any;

  beforeEach(() => {
    userRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    credentialRepo = {
      save: jest.fn(),
    };
    config = {
      get: jest.fn((key: string, defaultValue?: any) => {
        const values: Record<string, any> = {
          OTP_LENGTH: 6,
          OTP_TTL_SECONDS: 300,
          JWT_SECRET: 'test-secret',
          JWT_EXPIRES_IN: '15m',
          JWT_REFRESH_EXPIRES_IN: '7d',
        };
        return values[key] ?? defaultValue;
      }),
    };
    jwtService = {
      sign: jest.fn().mockReturnValue('mock-jwt-token'),
      verify: jest.fn(),
    };
    redis = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };
    auditService = {
      log: jest.fn().mockResolvedValue(undefined),
    };

    service = new IdentityService(userRepo, credentialRepo, config, jwtService, redis, auditService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ===========================
  // register()
  // ===========================

  describe('register', () => {
    const dto = {
      phoneNumber: '+525555555555',
      email: 'test@test.com',
      firstName: 'Test',
      lastName: 'User',
    };

    it('should register a new user and return OTP response', async () => {
      userRepo.findOne.mockResolvedValue(null);
      userRepo.create.mockReturnValue({ id: 'user-uuid-123', ...dto, status: 'PENDING', isVerified: false });
      userRepo.save.mockResolvedValue(undefined);

      const result = await service.register(dto);

      expect(result).toBeDefined();
      expect(result.phoneNumber).toBe(dto.phoneNumber);
      expect(result.devOtp).toBeDefined();
      expect(result.expiresIn).toBe(300);
      expect(result.message).toContain('Registration successful');
    });

    it('should throw ConflictException for already registered phone', async () => {
      userRepo.findOne.mockResolvedValue({ id: 'existing-user' });

      await expect(service.register(dto)).rejects.toThrow(ConflictException);
    });

    it('should store OTP in Redis with TTL', async () => {
      userRepo.findOne.mockResolvedValue(null);
      userRepo.create.mockReturnValue({ id: 'user-uuid', ...dto });
      userRepo.save.mockResolvedValue(undefined);

      await service.register(dto);

      expect(redis.set).toHaveBeenCalledWith(
        `otp:${dto.phoneNumber}`,
        expect.any(String),
        'EX',
        300,
      );
    });
  });

  // ===========================
  // verifyOtp()
  // ===========================

  describe('verifyOtp', () => {
    it('should verify OTP, activate user, and return tokens', async () => {
      const dto = { phoneNumber: '+525555555555', otp: '123456' };
      const mockUser = {
        id: 'user-uuid-123',
        phoneNumber: dto.phoneNumber,
        email: 'test@test.com',
        firstName: 'Test',
        lastName: 'User',
        status: 'PENDING',
        isVerified: false,
      };

      redis.get.mockResolvedValue('123456');
      userRepo.findOne.mockResolvedValue(mockUser);
      userRepo.save.mockResolvedValue(undefined);

      const result = await service.verifyOtp(dto);

      expect(mockUser.status).toBe(UserStatus.ACTIVE);
      expect(mockUser.isVerified).toBe(true);
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.user.id).toBe(mockUser.id);
      expect(redis.del).toHaveBeenCalledWith(`otp:${dto.phoneNumber}`);
    });

    it('should throw BadRequestException when OTP expired or not found', async () => {
      const dto = { phoneNumber: '+525555555555', otp: '123456' };
      redis.get.mockResolvedValue(null);

      await expect(service.verifyOtp(dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid OTP', async () => {
      const dto = { phoneNumber: '+525555555555', otp: '999999' };
      redis.get.mockResolvedValue('123456');

      await expect(service.verifyOtp(dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when user not found after OTP', async () => {
      const dto = { phoneNumber: '+525555555555', otp: '123456' };
      redis.get.mockResolvedValue('123456');
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.verifyOtp(dto)).rejects.toThrow(BadRequestException);
    });
  });

  // ===========================
  // login()
  // ===========================

  describe('login', () => {
    const dto = { phoneNumber: '+525555555555', password: 'Password123!' };
    const mockCredential = {
      id: 'cred-uuid',
      type: CredentialType.PASSWORD,
      isActive: true,
      hashedValue: '$2b$10$hashedvalue',
      failedAttempts: 0,
    };
    const mockUser = {
      id: 'user-uuid-123',
      phoneNumber: dto.phoneNumber,
      email: 'test@test.com',
      firstName: 'Test',
      lastName: 'User',
      status: UserStatus.ACTIVE,
      isVerified: true,
      credentials: [mockCredential],
      lastLoginAt: null,
    };

    it('should login successfully with correct password', async () => {
      userRepo.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      credentialRepo.save.mockResolvedValue(undefined);
      userRepo.save.mockResolvedValue(undefined);

      const result = await service.login(dto);

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.user.id).toBe(mockUser.id);
      expect(mockCredential.failedAttempts).toBe(0);
      expect(mockUser.lastLoginAt).toBeDefined();
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for blocked user', async () => {
      userRepo.findOne.mockResolvedValue({ ...mockUser, status: UserStatus.BLOCKED });

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for suspended user', async () => {
      userRepo.findOne.mockResolvedValue({ ...mockUser, status: UserStatus.SUSPENDED });

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when no password credential exists', async () => {
      userRepo.findOne.mockResolvedValue({ ...mockUser, credentials: [] });

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('should increment failedAttempts on wrong password', async () => {
      const cred = { ...mockCredential, failedAttempts: 2 };
      userRepo.findOne.mockResolvedValue({ ...mockUser, credentials: [cred] });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      credentialRepo.save.mockResolvedValue(undefined);

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
      expect(cred.failedAttempts).toBe(3);
    });

    it('should lock credential after 5 failed attempts', async () => {
      const cred = { ...mockCredential, failedAttempts: 4 };
      userRepo.findOne.mockResolvedValue({ ...mockUser, credentials: [cred] });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      credentialRepo.save.mockResolvedValue(undefined);

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
      expect(cred.failedAttempts).toBe(5);
      expect(cred.lockedUntil).toBeDefined();
    });
  });

  // ===========================
  // refreshToken()
  // ===========================

  describe('refreshToken', () => {
    it('should return new access token for valid refresh token', async () => {
      const mockUser = { id: 'user-uuid-123', phoneNumber: '+525555555555' };
      jwtService.verify.mockReturnValue({ sub: 'user-uuid-123', phoneNumber: '+525555555555' });
      userRepo.findOne.mockResolvedValue(mockUser);

      const result = await service.refreshToken('valid-refresh-token');

      expect(result.accessToken).toBeDefined();
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('invalid token');
      });

      await expect(service.refreshToken('invalid-token')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user not found', async () => {
      jwtService.verify.mockReturnValue({ sub: 'nonexistent-user', phoneNumber: '+525555555555' });
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.refreshToken('valid-but-orphaned')).rejects.toThrow(UnauthorizedException);
    });
  });

  // ===========================
  // getMe()
  // ===========================

  describe('getMe', () => {
    it('should return user profile', async () => {
      const mockUser = {
        id: 'user-uuid-123',
        phoneNumber: '+525555555555',
        email: 'test@test.com',
        firstName: 'Test',
        lastName: 'User',
        status: UserStatus.ACTIVE,
        isVerified: true,
        lastLoginAt: new Date(),
        createdAt: new Date(),
      };
      userRepo.findOne.mockResolvedValue(mockUser);

      const result = await service.getMe('user-uuid-123');

      expect(result.id).toBe(mockUser.id);
      expect(result.phoneNumber).toBe(mockUser.phoneNumber);
    });

    it('should throw UnauthorizedException when user not found', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.getMe('nonexistent')).rejects.toThrow(UnauthorizedException);
    });
  });
});
