import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../identity/guards/jwt-auth.guard';
import { RolesGuard } from '../../identity/guards/roles.guard';
import { Roles } from '../../identity/decorators/roles.decorator';
import { RoleType } from '../../identity/entities/role.enum';
import { VaultService } from '../services/vault.service';
import { VaultMoveDto } from '../dto/vault-move.dto';

@ApiTags('branch-teller-vault')
@Controller('v1/branch-teller/vault')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class VaultController {
  constructor(private vaultService: VaultService) {}

  @Get()
  @ApiOperation({ summary: 'Listar cajas fuertes' })
  @Roles(RoleType.MANAGER, RoleType.AUDITOR)
  async listVaults(@Query('branchId') branchId?: string) {
    return this.vaultService.findAll(branchId);
  }

  @Get(':vaultId')
  @ApiOperation({ summary: 'Obtener caja fuerte por ID' })
  @Roles(RoleType.MANAGER, RoleType.AUDITOR)
  async getVault(@Param('vaultId') vaultId: string) {
    return this.vaultService.getById(vaultId);
  }

  @Post('create')
  @ApiOperation({ summary: 'Crear caja fuerte de sucursal' })
  @Roles(RoleType.ADMIN)
  async createVault(@Body() data: {
    branchId: string;
    vaultIdentifier: string;
    vaultGrade: string;
    primaryCustodianId: string;
    dualControlRequired: boolean;
    initialBalance: number;
  }) {
    return this.vaultService.createVault(data);
  }

  @Post('move')
  @ApiOperation({ summary: 'Ejecutar movimiento de caja fuerte' })
  @ApiResponse({ status: 201, description: 'Movimiento registrado' })
  @Roles(RoleType.MANAGER)
  async executeMovement(@Body() dto: VaultMoveDto) {
    return this.vaultService.executeMovement(dto);
  }

  @Post('movement/:id/confirm')
  @ApiOperation({ summary: 'Confirmar movimiento (dual control)' })
  @Roles(RoleType.ADMIN, RoleType.MANAGER)
  async confirmMovement(
    @Param('id') id: string,
    @Body() data: { authorizedByUserId: string; witnessUserId?: string },
  ) {
    return this.vaultService.confirmMovement(id, data.authorizedByUserId, data.witnessUserId);
  }

  @Post('movement/:id/cancel')
  @ApiOperation({ summary: 'Cancelar movimiento pendiente' })
  @Roles(RoleType.MANAGER)
  async cancelMovement(
    @Param('id') id: string,
    @Body() data: { reason: string; canceledByUserId: string },
  ) {
    return this.vaultService.cancelMovement(id, data.reason, data.canceledByUserId);
  }

  @Post('movement/:id/reverse')
  @ApiOperation({ summary: 'Revertir movimiento completado' })
  @Roles(RoleType.ADMIN)
  async reverseMovement(
    @Param('id') id: string,
    @Body() data: { reason: string; reversedByUserId: string },
  ) {
    return this.vaultService.reverseMovement(id, data.reason, data.reversedByUserId);
  }

  @Get('movements')
  @ApiOperation({ summary: 'Listar movimientos de caja fuerte' })
  @Roles(RoleType.MANAGER, RoleType.AUDITOR)
  async listMovements(
    @Query('vaultId') vaultId?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.vaultService.getMovements(
      vaultId,
      undefined,
      undefined,
      fromDate ? new Date(fromDate) : undefined,
      toDate ? new Date(toDate) : undefined,
    );
  }

  @Get(':vaultId/balance')
  @ApiOperation({ summary: 'Obtener balance actual de caja fuerte' })
  @Roles(RoleType.MANAGER, RoleType.AUDITOR)
  async getBalance(@Param('vaultId') vaultId: string) {
    return this.vaultService.getCurrentBalance(vaultId);
  }

  @Post(':vaultId/audit')
  @ApiOperation({ summary: 'Registrar auditoría física de caja fuerte' })
  @Roles(RoleType.ADMIN, RoleType.AUDITOR)
  async registerAudit(
    @Param('vaultId') vaultId: string,
    @Body() data: {
      auditedByUserId: string;
      physicalCountTotal: number;
      varianceAmount?: number;
      notes?: string;
    },
  ) {
    await this.vaultService.registerAudit(
      vaultId,
      data.auditedByUserId,
      data.physicalCountTotal,
      data.varianceAmount,
      data.notes,
    );
    return { success: true, message: 'Auditoría registrada' };
  }
}
