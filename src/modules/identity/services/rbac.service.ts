import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../entities/role.entity';
import { UserRole } from '../entities/user-role.entity';
import { RoleType } from '../entities/role.enum';
import { AuditService } from '../../audit/services/audit.service';
import { AuditEventType } from '../../audit/entities/audit-event.enum';

@Injectable()
export class RbacService {
  private readonly logger = new Logger(RbacService.name);

  constructor(
    @InjectRepository(Role)
    private roleRepo: Repository<Role>,
    @InjectRepository(UserRole)
    private userRoleRepo: Repository<UserRole>,
    private auditService: AuditService,
  ) {}

  async createRole(name: string, permissions: string[], isSystemRole?: boolean): Promise<Role> {
    const existing = await this.roleRepo.findOneBy({ name });
    if (existing) {
      throw new BadRequestException(`Role "${name}" already exists`);
    }

    const role = this.roleRepo.create({
      name,
      description: null,
      permissions,
      isSystemRole: isSystemRole ?? false,
      parentRoleId: null,
      orgId: null,
    });

    await this.roleRepo.save(role);

    this.logger.log(`Created role: ${role.id} — ${name}`);
    await this.auditService.log({
      userId: null,
      eventType: AuditEventType.ROLE_CREATED,
      description: `Role created: ${name}`,
      metadata: { roleId: role.id, name, permissions },
    });

    return role;
  }

  async updateRole(roleId: string, updates: { name?: string; permissions?: string[]; description?: string }): Promise<Role> {
    const role = await this.roleRepo.findOneBy({ id: roleId });
    if (!role) {
      throw new BadRequestException('Role not found');
    }

    if (updates.name) role.name = updates.name;
    if (updates.permissions) role.permissions = updates.permissions;
    if (updates.description !== undefined) role.description = updates.description;

    await this.roleRepo.save(role);

    this.logger.log(`Updated role: ${roleId}`);
    await this.auditService.log({
      userId: null,
      eventType: AuditEventType.PROFILE_UPDATED,
      description: `Role updated: ${role.name}`,
      metadata: { roleId, updates },
    });

    return role;
  }

  async getAllRoles(): Promise<Role[]> {
    return this.roleRepo.find({ order: { createdAt: 'ASC' } });
  }

  async assignRoleToUser(userId: string, roleId: string, orgId?: string): Promise<void> {
    const [userRoleExists, role] = await Promise.all([
      this.userRoleRepo.findOne({ where: { userId, roleId } }),
      this.roleRepo.findOneBy({ id: roleId }),
    ]);

    if (!role) {
      throw new BadRequestException('Role not found');
    }

    if (userRoleExists?.isActive === true) {
      this.logger.warn(`Role ${roleId} already assigned to user ${userId}`);
      return;
    }

    const userRole = this.userRoleRepo.create({
      userId,
      roleId,
      orgId: orgId ?? null,
      isActive: true,
    });

    await this.userRoleRepo.save(userRole);

    this.logger.log(`Assigned role ${roleId} to user ${userId}`);
    await this.auditService.log({
      userId,
      eventType: AuditEventType.ROLE_ASSIGNED,
      description: `Role assigned: ${role.name}`,
      metadata: { roleId, roleName: role.name },
    });
  }

  async revokeRoleFromUser(userId: string, roleId: string): Promise<void> {
    const userRole = await this.userRoleRepo.findOne({
      where: { userId, roleId },
    });

    if (!userRole) {
      this.logger.warn(`No assignment found for user ${userId}, role ${roleId}`);
      return;
    }

    userRole.isActive = false;
    await this.userRoleRepo.save(userRole);

    this.logger.log(`Revoked role ${roleId} from user ${userId}`);
    await this.auditService.log({
      userId,
      eventType: AuditEventType.ROLE_REVOKED,
      description: 'Role revoked',
      metadata: { roleId, userName: userId },
    });
  }

  async getUserRoles(userId: string): Promise<string[]> {
    const assignments = await this.userRoleRepo
      .createQueryBuilder('ur')
      .leftJoin('ur.role', 'r')
      .where('ur.userId = :userId AND ur.isActive = :isActive', {
        userId,
        isActive: true,
      })
      .addSelect(['r.name'])
      .getMany();

    return assignments.map((ur) => ur.role.name);
  }

  async hasPermission(userId: string, requiredPermission: string): Promise<boolean> {
    const userRoles = await this.getUserRoles(userId);

    let hasPerm = false;
    for (const roleName of userRoles) {
      const role = await this.roleRepo.findOneBy({ name: roleName as RoleType });
      if (role && role.permissions.includes(requiredPermission)) {
        hasPerm = true;
        break;
      }
    }

    return hasPerm;
  }
}
