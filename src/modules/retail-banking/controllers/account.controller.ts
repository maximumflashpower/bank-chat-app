import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RetailAccountService } from '../services/retail-account.service';
import { AccountStatus } from '../entities/retail-account.entity';

@ApiTags('Retail — Accounts')
@ApiBearerAuth()
@Controller('v1/retail')
export class AccountController {
  constructor(private readonly accountService: RetailAccountService) {}

  @Post('account/open')
  @ApiOperation({ summary: 'Apertura de cuenta digital completa' })
  async openAccount(@Body() data: any) {
    return this.accountService.openAccount(data as any);
  }

  @Get('accounts/:userId')
  @ApiOperation({ summary: 'Listar cuentas del cliente' })
  async findByCustomer(@Param('userId') userId: string) {
    return this.accountService.findByCustomer(userId);
  }

  @Get('account/:accountId')
  @ApiOperation({ summary: 'Detalle de cuenta' })
  async findById(@Param('accountId') accountId: string) {
    return this.accountService.findById(accountId);
  }

  @Get('account/:accountId/balance')
  @ApiOperation({ summary: 'Saldo disponible tiempo real' })
  async getBalance(@Param('accountId') accountId: string) {
    return this.accountService.getBalance(accountId);
  }

  @Put('account/:accountId/status')
  @ApiOperation({ summary: 'Cambiar estado cuenta' })
  async updateStatus(@Param('accountId') accountId: string, @Body() body: { status: AccountStatus; reason?: string }) {
    return this.accountService.updateStatus(accountId, body.status, body.reason);
  }

  @Post('account/:accountId/close')
  @ApiOperation({ summary: 'Cerrar cuenta' })
  async closeAccount(@Param('accountId') accountId: string, @Body() body: { reason: string; dispositionAccountId?: string }) {
    return this.accountService.closeAccount(accountId, body.reason, body.dispositionAccountId);
  }

  @Post('account/:accountId/freeze')
  @ApiOperation({ summary: 'Congelar cuenta' })
  async freezeAccount(@Param('accountId') accountId: string) {
    return this.accountService.freezeAccount(accountId);
  }

  @Post('account/:accountId/unfreeze')
  @ApiOperation({ summary: 'Descongelar cuenta' })
  async unfreezeAccount(@Param('accountId') accountId: string) {
    return this.accountService.unfreezeAccount(accountId);
  }

  @Put('account/:accountId/overdraft')
  @ApiOperation({ summary: 'Configurar protección sobregiro' })
  async configureOverdraft(@Param('accountId') accountId: string, @Body() body: { limit: number; enabled: boolean }) {
    return this.accountService.configureOverdraft(accountId, body.limit, body.enabled);
  }
}
