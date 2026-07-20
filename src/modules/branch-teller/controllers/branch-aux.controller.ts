import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../identity/guards/jwt-auth.guard';
import { RolesGuard } from '../../identity/guards/roles.guard';
import { Roles } from '../../identity/decorators/roles.decorator';
import { RoleType } from '../../identity/entities/role.enum';
import { NightDepositService } from '../services/night-deposit.service';
import { FXTellerService } from '../services/fx-teller.service';
import { SafeDepositService } from '../services/safe-deposit.service';
import { NightDepositDto } from '../dto/night-deposit.dto';
import { FxExchangeDto } from '../dto/fx-exchange.dto';
import { SafeBoxRentDto, SafeBoxAccessDto, SafeBoxReturnDto } from '../dto/safe-box.dto';

@ApiTags('branch-teller-auxiliary')
@Controller('api/v1/branch-teller')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class BranchAuxController {
  constructor(
    private nightDepositService: NightDepositService,
    private fxService: FXTellerService,
    private safeDepositService: SafeDepositService,
  ) {}

  // =====================
   // Depósitos Nocturnos
  // =====================
  @Post('night-deposit')
  @ApiOperation({ summary: 'Registrar depósito nocturno' })
  @Roles(RoleType.MANAGER)
  async createNightDeposit(@Body() dto: NightDepositDto) {
    return this.nightDepositService.createDeposit(dto);
  }

  @Get('night-deposits')
  @ApiOperation({ summary: 'Listar depósitos nocturnos' })
  @Roles(RoleType.MANAGER, RoleType.AUDITOR)
  async listNightDeposits(
    @Query('branchId') branchId?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.nightDepositService.findByCriteria(branchId, undefined, undefined, fromDate ? new Date(fromDate) : undefined, toDate ? new Date(toDate) : undefined);
  }

  @Post('night-deposit/:id/open')
  @ApiOperation({ summary: 'Iniciar apertura de depósito nocturno' })
  @Roles(RoleType.MANAGER)
  async openNightDeposit(
    @Param('id') id: string,
    @Body() data: { openedByUserId: string; witnessUserId?: string },
  ) {
    return this.nightDepositService.initiateOpening(id, data.openedByUserId, data.witnessUserId);
  }

  @Post('night-deposit/:id/process')
  @ApiOperation({ summary: 'Completar procesamiento con conteo' })
  @Roles(RoleType.MANAGER)
  async processNightDeposit(
    @Param('id') id: string,
    @Body() data: {
      processedByUserId: string;
      countedCashAmount?: number;
      countedCheckCount?: number;
      countedCheckTotal?: number;
      denominationBreakdown?: Record<string, unknown>;
      checkDetails?: Record<string, unknown>;
      discrepancyNotes?: string;
      ledgerJournalEntryId?: string;
    },
  ) {
    return this.nightDepositService.completeProcessing(id, data);
  }

  // ==========
   // Inter cambio FX
  // ==========
  @Get('fx/rates')
  @ApiOperation({ summary: 'Obtener tasa de cambio' })
  @ApiResponse({ status: 200, description: 'Tasa disponible' })
  @Roles(RoleType.MANAGER, RoleType.MANAGER)
  async getFxRate(
    @Query('from') fromCurrency: string,
    @Query('to') toCurrency: string,
  ) {
    return this.fxService.getRate(fromCurrency, toCurrency);
  }

  @Get('fx/all-rates')
  @ApiOperation({ summary: 'Listar todas las tasas FX disponibles' })
  @Roles(RoleType.MANAGER, RoleType.AUDITOR)
  async getAllFxRates() {
    return this.fxService.getAllRates();
  }

  @Post('fx/calculate')
  @ApiOperation({ summary: 'Calcular intercambio sin ejecutar' })
  @Roles(RoleType.MANAGER, RoleType.MANAGER)
  async calculateFx(@Body() data: { amountFrom: number; currencyFrom: string; currencyTo: string }) {
    return this.fxService.calculateExchange(data);
  }

  @Post('fx/exchange')
  @ApiOperation({ summary: 'Ejecutar intercambio FX' })
  @Roles(RoleType.MANAGER, RoleType.MANAGER)
  async executeFxExchange(@Body() dto: FxExchangeDto) {
    return this.fxService.executeExchange(dto);
  }

  @Post('fx/exchange/:id/confirm')
  @ApiOperation({ summary: 'Confirmar intercambio FX' })
  @Roles(RoleType.ADMIN)
  async confirmFxExchange(
    @Param('id') id: string,
    @Body() data: { ledgerJournalEntryId?: string; actualRateUsed?: number },
  ) {
    return this.fxService.confirmExchange(id, data);
  }

  @Post('fx/exchange/:id/reverse')
  @ApiOperation({ summary: 'Revertir intercambio FX' })
  @Roles(RoleType.ADMIN)
  async reverseFxExchange(
    @Param('id') id: string,
    @Body() data: { reason: string; reversedByUserId: string },
  ) {
    return this.fxService.reverseExchange(id, data.reason, data.reversedByUserId);
  }

  // ===================
   // Cajas de Seguridad
  // ===================
  @Post('safe-box/rent')
  @ApiOperation({ summary: 'Rentar caja de seguridad' })
  @Roles(RoleType.MANAGER)
  async rentSafeBox(@Body() dto: SafeBoxRentDto) {
    return this.safeDepositService.rentBox(dto);
  }

  @Post('safe-box/access')
  @ApiOperation({ summary: 'Registrar acceso a caja de seguridad' })
  @Roles(RoleType.MANAGER)
  async accessSafeBox(@Body() dto: SafeBoxAccessDto) {
    return this.safeDepositService.registerAccess(dto);
  }

  @Post('safe-box/return')
  @ApiOperation({ summary: 'Devolver caja de seguridad' })
  @Roles(RoleType.MANAGER)
  async returnSafeBox(@Body() dto: SafeBoxReturnDto) {
    return this.safeDepositService.returnBox(dto);
  }

  @Get('safe-boxes')
  @ApiOperation({ summary: 'Listar cajas de seguridad' })
  @Roles(RoleType.MANAGER, RoleType.AUDITOR)
  async listSafeBoxes(
    @Query('branchId') branchId?: string,
    @Query('customerId') customerId?: string,
  ) {
    if (customerId) {
      return this.safeDepositService.listByCustomer(customerId);
    }
    if (branchId) {
      return this.safeDepositService.listByBranch(branchId);
    }
    return [];
  }

  @Get('safe-box/:id')
  @ApiOperation({ summary: 'Obtener caja de seguridad por ID' })
  @Roles(RoleType.MANAGER, RoleType.AUDITOR)
  async getSafeBox(@Param('id') id: string) {
    return this.safeDepositService.getById(id);
  }

  @Post('safe-box/create')
  @ApiOperation({ summary: 'Crear nueva caja de seguridad (admin)' })
  @Roles(RoleType.ADMIN)
  async createSafeBox(@Body() data: {
    boxNumber: string;
    branchId: string;
    boxSize: string;
    vaultLocation?: string;
    annualRentalFee: number;
    requiredKeysCount?: number;
    dualControlRequired?: boolean;
  }) {
    return this.safeDepositService.createBox({ ...data, boxSize: data.boxSize as any });
  }

  // ===============
   // Cierre EOD
  // ===============
  @Post('eod/close-day')
  @ApiOperation({ summary: 'Cierre de día (end-of-day)' })
  @Roles(RoleType.ADMIN, RoleType.MANAGER)
  async closeDay(@Body() data: { branchId: string; closedByUserId: string; notes?: string }) {
    // TODO: Implementar lógica de cierre EOD
    // - Verificar todos los drawers cerrados
    // - Reconciliar balances
    // - Generar reporte diario
    // - Crear asiento contable de cierre
    return { success: true, message: 'Cierre de día procesado', branchId: data.branchId };
  }

  @Get('eod/daily-report')
  @ApiOperation({ summary: 'Generar reporte diario de sucursal' })
  @Roles(RoleType.MANAGER, RoleType.AUDITOR)
  async dailyReport(
    @Query('branchId') branchId: string,
    @Query('date') date?: string,
  ) {
    // TODO: Implementar generación de reporte diario
    return {
      branchId,
      date: date || new Date().toISOString().split('T')[0],
      totalTransactions: 0,
      totalCashIn: 0,
      totalCashOut: 0,
      netVariance: 0,
      drawerCount: 0,
      nightDeposits: 0,
      fxTransactions: 0,
    };
  }
}
