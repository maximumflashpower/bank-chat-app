import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../identity/guards/jwt-auth.guard';
import { RolesGuard } from '../../identity/guards/roles.guard';
import { Roles } from '../../identity/decorators/roles.decorator';
import { RoleType } from '../../identity/entities/role.enum';
import { TellerService } from '../services/teller.service';
import { DrawerManagementService } from '../services/drawer-management.service';
import { TransactDto } from '../dto/transact.dto';
import { DrawerOpenDto } from '../dto/drawer-open.dto';
import { DrawerCloseDto } from '../dto/drawer-close.dto';
import { OverrideRequestDto } from '../dto/override-request.dto';

@ApiTags('branch-teller')
@Controller('v1/branch-teller/teller')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TellerController {
  constructor(
    private tellerService: TellerService,
    private drawerService: DrawerManagementService,
  ) {}

  @Post('transaction')
  @ApiOperation({ summary: 'Ejecutar transacción de cajero' })
  @ApiResponse({ status: 201, description: 'Transacción creada' })
  @ApiResponse({ status: 400, description: 'Error de validación' })
  @Roles(RoleType.MANAGER, RoleType.MANAGER)
  async transact(@Body() dto: TransactDto) {
    return this.tellerService.executeTransaction(dto);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Listar transacciones con filtros' })
  @Roles(RoleType.MANAGER, RoleType.MANAGER, RoleType.AUDITOR)
  async listTransactions(
    @Query('branchId') branchId?: string,
    @Query('tellerUserId') tellerUserId?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.tellerService.findByCriteria(
      branchId,
      tellerUserId,
      undefined,
      fromDate ? new Date(fromDate) : undefined,
      toDate ? new Date(toDate) : undefined,
    );
  }

  @Get('transaction/:reference')
  @ApiOperation({ summary: 'Obtener transacción por referencia' })
  @Roles(RoleType.MANAGER, RoleType.MANAGER, RoleType.AUDITOR)
  async getTransactionByReference(@Param('reference') reference: string) {
    return this.tellerService.getByReference(reference);
  }

  @Post('transaction/:id/confirm')
  @ApiOperation({ summary: 'Confirmar/completar transacción' })
  @Roles(RoleType.ADMIN)
  async confirmTransaction(
    @Param('id') id: string,
    @Body() data: { ledgerJournalEntryId?: string; dualControlWitnessId?: string },
  ) {
    return this.tellerService.confirmTransaction(id, data);
  }

  @Post('transaction/:id/reverse')
  @ApiOperation({ summary: 'Revertir transacción' })
  @Roles(RoleType.ADMIN, RoleType.MANAGER)
  async reverseTransaction(
    @Param('id') id: string,
    @Body() data: { reversalReason: string; reversedByUserId: string },
  ) {
    return this.tellerService.reverseTransaction(id, data.reversalReason, data.reversedByUserId);
  }

  @Post('transaction/:id/void')
  @ApiOperation({ summary: 'Anular transacción pendiente' })
  @Roles(RoleType.MANAGER, RoleType.ADMIN)
  async voidTransaction(
    @Param('id') id: string,
    @Body() data: { voidReason: string },
  ) {
    return this.tellerService.voidTransaction(id, data.voidReason);
  }

  @Post('drawer/open')
  @ApiOperation({ summary: 'Abrir drawer de cajero' })
  @Roles(RoleType.MANAGER)
  async openDrawer(@Body() dto: DrawerOpenDto) {
    return this.drawerService.openDrawer(dto);
  }

  @Post('drawer/close')
  @ApiOperation({ summary: 'Cerrar drawer con conteo' })
  @Roles(RoleType.MANAGER)
  async closeDrawer(@Body() dto: DrawerCloseDto) {
    return this.drawerService.closeDrawer(dto);
  }

  @Get('drawers')
  @ApiOperation({ summary: 'Listar drawers activos' })
  @Roles(RoleType.MANAGER, RoleType.MANAGER, RoleType.AUDITOR)
  async listActiveDrawers(@Query('branchId') branchId: string) {
    return this.drawerService.getActiveDrawers(branchId);
  }

  @Get('drawer/:id')
  @ApiOperation({ summary: 'Obtener drawer por ID' })
  @Roles(RoleType.MANAGER, RoleType.MANAGER, RoleType.AUDITOR)
  async getDrawer(@Param('id') id: string) {
    return this.drawerService.getById(id);
  }

  @Get('daily-stats')
  @ApiOperation({ summary: 'Estadísticas diarias del cajero' })
  @Roles(RoleType.MANAGER, RoleType.MANAGER)
  async dailyStats(
    @Query('tellerUserId') tellerUserId: string,
    @Query('branchId') branchId: string,
  ) {
    return this.drawerService.getDailyStats(tellerUserId, branchId);
  }

  @Post('override-request')
  @ApiOperation({ summary: 'Solicitar override de supervisor' })
  @Roles(RoleType.MANAGER)
  async requestOverride(@Body() dto: OverrideRequestDto) {
    // TODO: Implementar flujo de aprobación de supervisor
    return this.tellerService.executeTransaction({
      branchId: dto.branchId,
      tellerUserId: dto.requestedByUserId,
      customerId: '',
      transactionType: dto.operationType as any,
      amountPrincipal: dto.amount,
    });
  }

  @Post('drawer/update-balance')
  @ApiOperation({ summary: 'Actualizar balance actual del drawer' })
  @Roles(RoleType.MANAGER, RoleType.ADMIN)
  async updateDrawerBalance(
    @Body() data: { drawerId: string; adjustment: number },
  ) {
    await this.drawerService.updateCurrentBalance(data.drawerId, data.adjustment);
    return { success: true, message: 'Balance actualizado' };
  }
}
