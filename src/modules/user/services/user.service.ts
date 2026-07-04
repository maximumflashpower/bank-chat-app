import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

import { UserProfile } from '../entities/user-profile.entity';
import { IdentityUser } from '../../identity/entities/identity-user.entity';
import { Credential } from '../../identity/entities/credential.entity';
import { CredentialType } from '../../identity/entities/credential-type.enum';
import { UserStatus } from '../../identity/entities/user-status.enum';
import { SetPasswordDto } from '../dto/set-password.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(UserProfile)
    private profileRepo: Repository<UserProfile>,
    @InjectRepository(IdentityUser)
    private userRepo: Repository<IdentityUser>,
    @InjectRepository(Credential)
    private credentialRepo: Repository<Credential>,
    private config: ConfigService,
  ) {}

  async setPassword(userId: string, dto: SetPasswordDto): Promise<{ message: string }> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: { credentials: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new BadRequestException('Account must be active to set a password');
    }

    // Check if password already exists
    const existingPassword = user.credentials?.find(
      (c) => c.type === CredentialType.PASSWORD,
    );

    if (existingPassword) {
      throw new ConflictException('Password already set. Use change-password endpoint.');
    }

    const rounds = this.config.get<number>('BCRYPT_ROUNDS', 12);
    const hashedPassword = await bcrypt.hash(dto.password, rounds);

    const credential = this.credentialRepo.create({
      userId: user.id,
      type: CredentialType.PASSWORD,
      hashedValue: hashedPassword,
      isActive: true,
    });
    await this.credentialRepo.save(credential);

    this.logger.log(`Password set for user: ${userId}`);
    return { message: 'Password set successfully' };
  }

  async getProfile(userId: string): Promise<UserProfile> {
    let profile = await this.profileRepo.findOne({ where: { userId } });

    if (!profile) {
      // Auto-create empty profile if not exists
      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      profile = this.profileRepo.create({
        userId: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
      });
      await this.profileRepo.save(profile);
    }

    return profile;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<UserProfile> {
    const profile = await this.getProfile(userId);

    Object.assign(profile, {
      ...(dto.firstName !== undefined && { firstName: dto.firstName }),
      ...(dto.lastName !== undefined && { lastName: dto.lastName }),
      ...(dto.birthDate !== undefined && { birthDate: dto.birthDate }),
      ...(dto.gender !== undefined && { gender: dto.gender }),
      ...(dto.city !== undefined && { city: dto.city }),
      ...(dto.country !== undefined && { country: dto.country }),
      ...(dto.bio !== undefined && { bio: dto.bio }),
    });

    const saved = await this.profileRepo.save(profile);
    this.logger.log(`Profile updated for user: ${userId}`);
    return saved;
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<{ message: string }> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: { credentials: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const passwordCredential = user.credentials?.find(
      (c) => c.type === CredentialType.PASSWORD && c.isActive,
    );

    if (!passwordCredential) {
      throw new BadRequestException('No password set. Use set-password endpoint.');
    }

    const isValid = await bcrypt.compare(oldPassword, passwordCredential.hashedValue);
    if (!isValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const rounds = this.config.get<number>('BCRYPT_ROUNDS', 12);
    passwordCredential.hashedValue = await bcrypt.hash(newPassword, rounds);
    passwordCredential.failedAttempts = 0;
    passwordCredential.lockedUntil = null;
    await this.credentialRepo.save(passwordCredential);

    this.logger.log(`Password changed for user: ${userId}`);
    return { message: 'Password changed successfully' };
  }
}
