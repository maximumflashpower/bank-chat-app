import { SetMetadata } from '@nestjs/common';
import { RoleType } from '../entities/role.enum';

export const ROLES_KEY = 'roles';

/**
 * Decorator to specify required roles on a route handler.
 * Usage: @Roles(RoleType.ADMIN, RoleType.MANAGER)
 * Enforced by RolesGuard.
 */
export const Roles = (...roles: RoleType[]) => SetMetadata(ROLES_KEY, roles);
