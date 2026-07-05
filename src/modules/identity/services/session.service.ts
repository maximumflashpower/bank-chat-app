import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Redis } from 'ioredis';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);
  private readonly MAX_CONCURRENT_SESSIONS = 5;

  constructor(
    @InjectRedis() private redis: Redis,
    private config: ConfigService,
    private jwtService: JwtService,
  ) {}

  async recordSessionStart(userId: string, deviceId: string, userAgent: string, ipAddress: string): Promise<string> {
    const sessionId = crypto.randomUUID();
    const ttlSeconds = 7 * 24 * 3600; // 7 days

    const sessionData = {
      userId,
      deviceId,
      userAgent,
      ipAddress,
      startedAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
    };

    await Promise.all([
      this.redis.hset(`session:${sessionId}`, sessionData),
      this.redis.sadd(`user:sessions:${userId}`, sessionId),
      this.redis.expire(`session:${sessionId}`, ttlSeconds),
    ]);

    this.logger.debug(`Session recorded: ${sessionId} for user ${userId}`);

    return sessionId;
  }

  async listUserSessions(userId: string): Promise<any[]> {
    const sessionIds = await this.redis.smembers(`user:sessions:${userId}`);

    if (sessionIds.length === 0) {
      return [];
    }

    const sessions = await Promise.all(
      sessionIds.map(async (id) => {
        const data = await this.redis.hgetall(`session:${id}`);
        return {
          sessionId: id,
          deviceId: data.deviceId,
          userAgent: data.userAgent,
          ipAddress: data.ipAddress,
          startedAt: data.startedAt,
          lastActivityAt: data.lastActivityAt,
        };
      }),
    );

    return sessions.sort((a, b) =>
      new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime()
    );
  }

  async revokeSession(sessionId: string, userId: string): Promise<void> {
    const storedUserId = await this.redis.hget(`session:${sessionId}`, 'userId');

    if (storedUserId !== userId) {
      this.logger.warn(`Session revocation denied: ${sessionId} does not belong to ${userId}`);
      throw new BadRequestException('Session not found or unauthorized');
    }

    await Promise.all([
      this.redis.del(`session:${sessionId}`),
      this.redis.srem(`user:sessions:${userId}`, sessionId),
    ]);

    this.logger.log(`Session revoked: ${sessionId} for user ${userId}`);
  }

  async markSessionActive(sessionId: string): Promise<void> {
    await this.redis.hset(`session:${sessionId}`, 'lastActivityAt', new Date().toISOString());
  }

  async enforceMaxConcurrentSessions(userId: string, maxSessions?: number): Promise<string[]> {
    const limit = maxSessions ?? this.MAX_CONCURRENT_SESSIONS;
    const sessionIds = await this.redis.smembers(`user:sessions:${userId}`);

    if (sessionIds.length <= limit) {
      return [];
    }

    const excessCount = sessionIds.length - limit;
    const oldestSessions = sessionIds.slice(0, excessCount);

    for (const sid of oldestSessions) {
      await this.revokeSession(sid, userId);
    }

    this.logger.log(`Enforced max sessions (${limit}) for user ${userId}, revoked ${excessCount} old sessions`);

    return oldestSessions;
  }

  async invalidateAllUserSessions(userId: string): Promise<number> {
    const sessionIds = await this.redis.smembers(`user:sessions:${userId}`);

    if (sessionIds.length === 0) {
      return 0;
    }

    const pipeline = this.redis.pipeline();
    for (const sid of sessionIds) {
      pipeline.del(`session:${sid}`);
    }
    pipeline.del(`user:sessions:${userId}`);
    await pipeline.exec();

    this.logger.log(`Invalidated ${sessionIds.length} sessions for user ${userId}`);

    return sessionIds.length;
  }

  async rotateRefreshToken(oldToken: string, userId: string): Promise<string> {
    try {
      const decoded = this.jwtService.decode(oldToken) as any;

      if (decoded?.sub !== userId) {
        throw new BadRequestException('Token mismatch');
      }

      const newPayload = {
        sub: userId,
        iat: Math.floor(Date.now() / 1000),
      };

      const newRefreshToken = this.jwtService.sign(newPayload, {
        expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '7d') as any,
      });

      await this.invalidateAllUserSessions(userId);

      return newRefreshToken;
    } catch {
      throw new BadRequestException('Invalid refresh token');
    }
  }
}
