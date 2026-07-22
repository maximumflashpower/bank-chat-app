import { Test, TestingModule } from '@nestjs/testing';
import { DeviceSessionService } from './device-session.service';
import { Repository } from 'typeorm';
import { MobileDeviceSession } from '../entities/mobile-device-session.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';

describe('DeviceSessionService', () => {
  let service: DeviceSessionService;
  let repo: Repository<MobileDeviceSession>;

  const mockSession = {
    id: 'session-1',
    userId: 'user-1',
    deviceId: 'device-1',
    devicePlatform: 'ios',
    deviceModel: 'iPhone 15',
    osVersion: '17.0',
    appVersion: '1.0.0',
    biometricEnrolled: false,
    biometricType: undefined,
    isActive: true,
    securityFlags: {},
    createdAt: new Date(),
    lastLoginAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeviceSessionService,
        {
          provide: getRepositoryToken(MobileDeviceSession),
          useValue: {
            save: jest.fn((session) => Promise.resolve(session)),
            findOne: jest.fn(),
            find: jest.fn(),
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<DeviceSessionService>(DeviceSessionService);
    repo = module.get<Repository<MobileDeviceSession>>(getRepositoryToken(MobileDeviceSession));
  });

  describe('enroll', () => {
    it('should create new session if not exists', async () => {
      jest.spyOn(repo, 'findOne').mockResolvedValue(null);
      jest.spyOn(repo, 'save').mockImplementation((sess) => Promise.resolve(sess as any));

      const request = {
        userId: 'user-1',
        deviceId: 'device-1',
        devicePlatform: 'ios',
        deviceModel: 'iPhone 15',
        biometricType: 'face_id',
      };

      const result = await service.enroll(request);

      expect(result.biometricEnrolled).toBe(true);
      expect(result.biometricType).toBe('face_id');
      expect(result.securityFlags).toEqual({});
    });

    it('should update existing session', async () => {
      jest.spyOn(repo, 'findOne').mockResolvedValue(mockSession as any);
      jest.spyOn(repo, 'save').mockImplementation((sess) => Promise.resolve(sess as any));

      const request = {
        userId: 'user-1',
        deviceId: 'device-1',
        devicePlatform: 'ios',
        biometricType: 'touch_id',
      };

      const result = await service.enroll(request);

      expect(result.biometricEnrolled).toBe(true);
    });

    it('should update push token if provided', async () => {
      jest.spyOn(repo, 'findOne').mockResolvedValue(mockSession as any);
      jest.spyOn(repo, 'save').mockImplementation((sess) => Promise.resolve(sess as any));

      const request = {
        userId: 'user-1',
        deviceId: 'device-1',
        devicePlatform: 'android',
        pushToken: 'fcm-token-123',
      };

      const result = await service.enroll(request);

      expect(result.pushToken).toBe('fcm-token-123');
    });
  });

  describe('updateSession', () => {
    it('should update session JWT and refresh tokens', async () => {
      jest.spyOn(repo, 'findOne').mockResolvedValue(mockSession as any);
      jest.spyOn(repo, 'save').mockImplementation((sess) => Promise.resolve(sess as any));

      const result = await service.updateSession('user-1', 'session-1', {
        sessionJwt: 'jwt-token',
        refreshToken: 'refresh-token',
        jwtExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
      });

      expect(result.sessionJwt).toBe('jwt-token');
      expect(result.refreshToken).toBe('refresh-token');
    });

    it('should throw NotFoundException if session not found', async () => {
      jest.spyOn(repo, 'findOne').mockResolvedValue(null);

      await expect(service.updateSession('user-1', 'session-999', { sessionJwt: 'token' }))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('revoke', () => {
    it('should revoke session successfully', async () => {
      const revokedSession = { ...mockSession, isActive: false, revokedAt: new Date() };
      jest.spyOn(repo, 'findOne').mockResolvedValue(mockSession as any);
      jest.spyOn(repo, 'save').mockImplementation((sess) => Promise.resolve(sess as any));

      const result = await service.revoke('user-1', 'session-1');

      expect(result.isActive).toBe(false);
      expect(result.revokedAt).toBeDefined();
    });

    it('should throw NotFoundException if session not found for revocation', async () => {
      jest.spyOn(repo, 'findOne').mockResolvedValue(null);

      await expect(service.revoke('user-1', 'session-999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getSession', () => {
    it('should return session by ID and user', async () => {
      jest.spyOn(repo, 'findOne').mockResolvedValue(mockSession as any);

      const result = await service.getSession('user-1', 'session-1');

      expect(result.id).toBe('session-1');
      expect(repo.findOne).toHaveBeenCalledWith({
        where: { id: 'session-1', userId: 'user-1' },
      });
    });

    it('should throw NotFoundException if session not found', async () => {
      jest.spyOn(repo, 'findOne').mockResolvedValue(null);

      await expect(service.getSession('user-1', 'session-999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getActiveSessions', () => {
    it('should return all active sessions for user', async () => {
      jest.spyOn(repo, 'find').mockResolvedValue([mockSession as any]);

      const result = await service.getActiveSessions('user-1');

      expect(result).toHaveLength(1);
      expect(repo.find).toHaveBeenCalledWith({
        where: { userId: 'user-1', isActive: true },
        order: { lastLoginAt: 'DESC' },
      });
    });
  });

  describe('detectJailbreak', () => {
    it('should update jailbreak detection flag', async () => {
      jest.spyOn(repo, 'update').mockResolvedValue({} as any);

      await service.detectJailbreak('session-1', true);

      expect(repo.update).toHaveBeenCalledWith('session-1', { jailbreakDetected: true });
    });
  });
});
