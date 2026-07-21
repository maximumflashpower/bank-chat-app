import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { NostroAccountService } from '../services/nostro-account.service';

@ApiTags('correspondent')
@Controller('api/v1/nostro')
export class NostroAccountController {
  constructor(private readonly accountService: NostroAccountService) {}

  @Get('/accounts')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lista cuentas Nostro activas' })
  async listAccounts() {
    return this.accountService.findAll();
  }

  @Get('/account/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Detalle cuenta Nostro específica' })
  async getById(@Param('id') id: string) {
    return this.accountService.findById(id);
  }

  @Get('/account/:id/balance')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Saldo actual disponibilidad Nostro' })
  async getBalance(@Param('id') id: string) {
    return this.accountService.getBalanceSnapshot(id);
  }

  @Get('/account/:id/statement')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Extracto bancario Nostro histórico' })
  async getStatement(@Param('id') id: string, @Query('fromDate') fromDate: string, @Query('toDate') toDate: string) {
    // Stub - requiere integración con NostroTransactionLog
    return { accountId: id, fromDate, toDate, transactions: [] };
  }

  @Post('/account')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear cuenta Nostro' })
  async create(@Body() data: Partial<any>) {
    return this.accountService.create(data);
  }

  @Post('/account/:id/balance')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar saldo cuenta' })
  async updateBalance(
    @Param('id') id: string,
    @Body() body: { balanceAvailable: number; balanceLedger: number; balanceReserved: number },
  ) {
    return this.accountService.updateBalance(id, body.balanceAvailable, body.balanceLedger, body.balanceReserved);
  }

  @Post('/account/:id/reconcile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar estado reconciliación' })
  async updateReconciliation(
    @Param('id') id: string,
    @Body() body: { reconcileDate: Date; variance: number },
  ) {
    return this.accountService.updateReconciliation(id, body.reconcileDate, body.variance);
  }
}
