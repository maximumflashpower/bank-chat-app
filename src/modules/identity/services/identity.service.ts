import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Redis } from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

import { IdentityUser } from '../entities/identity-user.entity';
import { Credential } from '../entities/credential.entity';
import { UserStatus } from '../entities/user-status.enum';
import { CredentialType } from '../entities/credential-type.enum';
import { RegisterDto } from '../dto/register.dto';
import { VerifyOtpDto } from '../dto/verify-otp.dto';
import { LoginDto } from '../dto/login.dto';
import { JwtPayload } from '../strategies/jwt.strategy';
import { AuthResponse, OtpResponse } from '../dto/auth-response.interface';

@Injectable()
export class IdentityService {
  private readonly logger = new Logger(IdentityService.name);

  constructor(
    @InjectRepository(IdentityUser)
    private userRepo: Repository<IdentityUser>,
    @InjectRepository(Credential)
    private credentialRepo: Repository<Credential>,
    private config: ConfigService,
    private jwtService: JwtService,
    @InjectRedis() private redis: Redis,
  ) {}

  async register(dto: RegisterDto): Promise<OtpResponse> {
    const existing = await this.userRepo.findOne({ where: { phoneNumber: dto.phoneNumber } });
    if (existing) {
      throw new ConflictException('Phone number already registered');
    }

    const user = this.userRepo.create({
      phoneNumber: dto.phoneNumber,
      email: dto.email ?? null,
      firstName: dto.firstName ?? null,
      lastName: dto.lastName ?? null,
      status: UserStatus.PENDING,
      isVerified: false,
    });
    await this.userRepo.save(user);

    const otp = this.generateOtp();
    const ttl = this.config.get<number>('OTP_TTL_SECONDS', 300);
    const redisKey = `otp:${dto.phoneNumber}`;

    await this.redis.set(redisKey, otp, 'EX', ttl);

    this.logger.log(`User registered: ${user.id} — phone: ${dto.phoneNumber}`);

    return {
      message: 'Registration successful. Verify your phone with the OTP sent.',
      phoneNumber: dto.phoneNumber,
      expiresIn: ttl,
      devOtp: otp,
    };
  }

  async verifyOtp(dto: VerifyOtpDto): Promise<AuthResponse> {
    const redisKey = `otp:${dto.phoneNumber}`;
    const storedOtp = await this.redis.get(redisKey);

    if (!storedOtp) {
      throw new BadRequestException('OTP expired or not found. Please register first.');
    }

    if (storedOtp !== dto.otp) {
      throw new BadRequestException('Invalid OTP code.');
    }

    const user = await this.userRepo.findOne({ where: { phoneNumber: dto.phoneNumber } });
    if (!user) {
      throw new BadRequestException('User not found.');
    }

    user.status = UserStatus.ACTIVE;
    user.isVerified = true;
    await this.userRepo.save(user);

    await this.redis.del(redisKey);

    const tokens = this.issueTokens(user);

    this.logger.log(`User verified: ${user.id} — phone: ${dto.phoneNumber}`);

    return {
      ...tokens,
      user: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        status: user.status,
        isVerified: user.isVerified,
      },
    };
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.userRepo.findOne({
      where: { phoneNumber: dto.phoneNumber },
      relations: { credentials: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status === UserStatus.BLOCKED || user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException(`Account is ${user.status}`);
    }

    const passwordCredential = user.credentials?.find(
      (c) => c.type === CredentialType.PASSWORD && c.isActive,
    );

    if (!passwordCredential) {
      throw new UnauthorizedException('No password credential set. Use OTP flow first.');
    }

    const isValid = await bcrypt.compare(dto.password, passwordCredential.hashedValue);
    if (!isValid) {
      passwordCredential.failedAttempts += 1;

      if (passwordCredential.failedAttempts >= 5) {
        passwordCredential.lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
      }

      await this.credentialRepo.save(passwordCredential);
      throw new UnauthorizedException('Invalid credentials');
    }

    passwordCredential.failedAttempts = 0;
    await this.credentialRepo.save(passwordCredential);

    user.lastLoginAt = new Date();
    await this.userRepo.save(user);

    const tokens = this.issueTokens(user);

    return {
      ...tokens,
      user: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        status: user.status,
        isVerified: user.isVerified,
      },
    };
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.config.get<string>('JWT_SECRET'),
      });

      const user = await this.userRepo.findOne({ where: { id: payload.sub } });
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const accessToken = this.jwtService.sign(
        { sub: user.id, phoneNumber: user.phoneNumber },
        { expiresIn: this.config.get<string>('JWT_EXPIRES_IN', '15m') as any },
      );

      return { accessToken };
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async getMe(userId: string): Promise<Partial<IdentityUser>> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: {
        id: true,
        phoneNumber: true,
        email: true,
        firstName: true,
        lastName: true,
        status: true,
        isVerified: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  // --- Private helpers ---

  private generateOtp(): string {
    const length = this.config.get<number>('OTP_LENGTH', 6);
    const digits = '0123456789';
    let otp = '';
    const bytes = crypto.randomBytes(length);
    for (let i = 0; i < length; i++) {
      otp += digits[bytes[i] % 10];
    }
    return otp;
  }

  private issueTokens(user: IdentityUser): { accessToken: string; refreshToken: string } {
    const payload: JwtPayload = {
      sub: user.id,
      phoneNumber: user.phoneNumber,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.config.get<string>('JWT_EXPIRES_IN', '15m') as any,
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '7d') as any,
    });

    return { accessToken, refreshToken };
  }
}
