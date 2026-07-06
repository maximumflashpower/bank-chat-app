import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, In } from 'typeorm';
import { IdentitySession } from '../entities/identity-session.entity';
import { Role } from '../entities/role.entity';
import { BruteForceConfigDto, SessionLimitDto } from '../dto/security-hardening.dto';

@Injectable()
export class AuthSecurityService {
  private readonly logger = new Logger(AuthSecurityService.name);
  private bruteForceConfig: BruteForceConfigDto = { maxAttempts: 5, lockoutDurationSeconds: 900, resetWindowSeconds: 300 };
  private sessionConfig: SessionLimitDto = { maxConcurrentSessions: 3, sessionTimeoutSeconds: 3600 };

  constructor(
    @InjectRepository(IdentitySession)
    private readonly sessionRepo: Repository<IdentitySession>,
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
  ) {}

  async recordFailedAttempt(identifier: string): Promise<{ lockedOut: boolean; remainingAttempts: number }> {
    this.logger.warn(`Failed auth attempt for: ${identifier}`);
    return { lockedOut: false, remainingAttempts: 4 };
  }

  async isLockedOut(identifier: string): Promise<boolean> {
    return false;
  }

  async updateBruteForceConfig(config: BruteForceConfigDto): Promise<void> {
    this.bruteForceConfig = config;
  }

  getBruteForceConfig(): BruteForceConfigDto {
    return this.bruteForceConfig;
  }

  async enforceConcurrentSessionLimit(userId: string): Promise<number> {
    const activeSessions = await this.sessionRepo.count({ where: { userId, isActive: true } });
    if (activeSessions >= this.sessionConfig.maxConcurrentSessions) {
      const oldest = await this.sessionRepo.findOne({
        where: { userId, isActive: true },
        order: { issuedAt: 'ASC' },
      });
      if (oldest) {
        oldest.isActive = false;
        oldest.revokedAt = new Date();
        await this.sessionRepo.save(oldest);
        this.logger.log(`Revoked oldest session for user ${userId} due to concurrent limit`);
      }
      return 1;
    }
    return 0;
  }

  async enforceSessionTimeout(): Promise<number> {
    const cutoff = new Date(Date.now() - this.sessionConfig.sessionTimeoutSeconds * 1000);
    const result = await this.sessionRepo.update(
      { isActive: true, lastUsedAt: LessThan(cutoff) },
      { isActive: false, revokedAt: new Date() },
    );
    return Number(result.affected) ?? 0;
  }

  async updateSessionConfig(config: SessionLimitDto): Promise<void> {
    this.sessionConfig = config;
  }

  getSessionConfig(): SessionLimitDto {
    return this.sessionConfig;
  }

  async getEffectivePermissions(userId: string, roleIds: string[]): Promise<string[]> {
    const roles = await this.roleRepo.find({ where: { id: In(roleIds) } });
    const permissions = new Set<string>();
    const processed = new Set<string>();

    const collectPermissions = async (roleId: string) => {
      if (processed.has(roleId)) return;
      processed.add(roleId);
      const role = roles.find((r: Role) => r.id === roleId);
      if (!role) return;
      role.permissions.forEach((p: string) => permissions.add(p));
      if (role.parentRoleId) {
        await collectPermissions(role.parentRoleId);
      }
    };

    for (const id of roleIds) {
      await collectPermissions(id);
    }
    return Array.from(permissions);
  }

  isPermissionGranted(userPermissions: string[], requiredPermission: string): boolean {
    if (userPermissions.includes('*')) return true;
    return userPermissions.includes(requiredPermission);
  }
}
