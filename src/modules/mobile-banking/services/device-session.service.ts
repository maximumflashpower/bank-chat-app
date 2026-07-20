import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MobileDeviceSession } from '../entities/mobile-device-session.entity';

interface EnrollRequest {
  userId: string;
  deviceId: string;
  devicePlatform: string;
  deviceModel?: string;
  osVersion?: string;
  appVersion?: string;
  biometricType?: string;
  pushToken?: string;
}

@Injectable()
export class DeviceSessionService {
  constructor(
    @InjectRepository(MobileDeviceSession)
    private readonly repo: Repository<MobileDeviceSession>,
  ) {}

  async enroll(request: EnrollRequest): Promise<MobileDeviceSession> {
    let session = await this.repo.findOne({
      where: { userId: request.userId, deviceId: request.deviceId },
    });

    if (!session) {
      session = new MobileDeviceSession();
      session.userId = request.userId;
      session.deviceId = request.deviceId;
      session.devicePlatform = request.devicePlatform;
      session.securityFlags = {};
      
      if (request.deviceModel) session.deviceModel = request.deviceModel;
      if (request.osVersion) session.osVersion = request.osVersion;
      if (request.appVersion) session.appVersion = request.appVersion;
    }

    if (request.biometricType) {
      session.biometricEnrolled = true;
      session.biometricType = request.biometricType;
    }

    if (request.pushToken) {
      session.pushToken = request.pushToken;
    }

    session.isActive = true;

    return this.repo.save(session);
  }

  async updateSession(userId: string, sessionId: string, updates: Partial<{
    sessionJwt: string;
    refreshToken: string;
    jwtExpiresAt: Date;
    lastLoginAt: Date;
    lastLoginIp: string;
    lastLoginLocation: string;
    pushToken: string;
  }>): Promise<MobileDeviceSession> {
    const session = await this.repo.findOne({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    Object.assign(session, updates);
    return this.repo.save(session);
  }

  async revoke(userId: string, sessionId: string): Promise<MobileDeviceSession> {
    const session = await this.repo.findOne({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    session.isActive = false;
    session.revokedAt = new Date();

    return this.repo.save(session);
  }

  async getSession(userId: string, sessionId: string): Promise<MobileDeviceSession> {
    const session = await this.repo.findOne({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    return session;
  }

  async getActiveSessions(userId: string): Promise<MobileDeviceSession[]> {
    return this.repo.find({
      where: { userId, isActive: true },
      order: { lastLoginAt: 'DESC' },
    });
  }

  async detectJailbreak(sessionId: string, detected: boolean): Promise<void> {
    await this.repo.update(sessionId, { jailbreakDetected: detected });
  }
}
