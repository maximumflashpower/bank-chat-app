import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RbacService } from '../services/rbac.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { RoleType } from '../entities/role.enum';
import { CreateRoleDto } from '../dto/create-role.dto';
import { AssignRoleDto } from '../dto/assign-role.dto';

@ApiTags('RBAC')
@ApiBearerAuth()
@Controller('auth/roles')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleType.ADMIN)
export class RbacController {
  constructor(private readonly rbacService: RbacService) {}

  @Get()
  @ApiOperation({ summary: 'List all available roles' })
  @ApiResponse({ status: 200, description: 'List of roles' })
  async listRoles() {
    return this.rbacService.getAllRoles();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new role with permissions' })
  @ApiResponse({ status: 201, description: 'Role created' })
  @ApiResponse({ status: 400, description: 'Role already exists' })
  async createRole(@Body() dto: CreateRoleDto) {
    return this.rbacService.createRole(dto.name, dto.permissions, dto.isSystemRole);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Modify role permissions' })
  @ApiResponse({ status: 200, description: 'Role updated' })
  async updateRole(
    @Param('id') roleId: string,
    @Body() dto: Partial<CreateRoleDto>,
  ) {
    return this.rbacService.updateRole(roleId, dto);
  }

  @Post('assign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Assign a role to a user' })
  @ApiResponse({ status: 200, description: 'Role assigned' })
  @ApiResponse({ status: 400, description: 'Role not found' })
  async assignRole(@Body() dto: AssignRoleDto) {
    await this.rbacService.assignRoleToUser(dto.userId, dto.roleId, dto.orgId);
    return { message: 'Role assigned successfully' };
  }

  @Post('revoke')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke a role from a user' })
  @ApiResponse({ status: 200, description: 'Role revoked' })
  async revokeRole(@Body() dto: AssignRoleDto) {
    await this.rbacService.revokeRoleFromUser(dto.userId, dto.roleId);
    return { message: 'Role revoked successfully' };
  }

  @Get('permissions/:userId')
  @ApiOperation({ summary: 'List permissions for a specific user' })
  @ApiResponse({ status: 200, description: 'User permissions' })
  async getUserPermissions(@Param('userId') userId: string) {
    const roles = await this.rbacService.getUserRoles(userId);
    return { userId, roles };
  }
}
