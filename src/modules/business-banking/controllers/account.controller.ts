import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BusinessAccountService } from '../services/business-account.service';
import { BusinessAccount, BusinessAccountStatus, KycCorporateStatus } from '../entities/business-account.entity';

@ApiTags('Business — Accounts')
@ApiBearerAuth()
@Controller('v1/business')
export class AccountController {
  constructor(private readonly accountService: BusinessAccountService) {}

  @Post('account/open')
  @ApiOperation({ summary: 'Apertura cuenta comercial' })
  async openAccount(@Body() data: any) {
    return this.accountService.openAccount(data as any);
  }

  @Get('accounts/:organizationId')
  @ApiOperation({ summary: 'Listar cuentas comerciales' })
  async findByOrganization(@Param('organizationId') organizationId: string) {
    return this.accountService.findByOrganization(organizationId);
  }

  @Get('account/:accountId')
  @ApiOperation({ summary: 'Detalle cuenta' })
  async findById(@Param('accountId') accountId: string) {
    return this.accountService.findById(accountId);
  }

  @Get('account/:accountId/balance')
  @ApiOperation({ summary: 'Saldo tiempo real' })
  async getBalance(@Param('accountId') accountId: string) {
    return this.accountService.getBalance(accountId);
  }

  @Put('account/:accountId/status')
  @ApiOperation({ summary: 'Cambiar estado cuenta' })
  async updateStatus(@Param('accountId') accountId: string, @Body() body: { status: BusinessAccountStatus; reason?: string }) {
    return this.accountService.updateStatus(accountId, body.status, body.reason);
  }

  @Post('account/:accountId/close')
  @ApiOperation({ summary: 'Cerrar cuenta' })
  async closeAccount(@Param('accountId') accountId: string, @Body() body: { reason: string }) {
    return this.accountService.closeAccount(accountId, body.reason);
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
  @ApiOperation({ summary: 'Configurar sobregiro' })
  async configureOverdraft(@Param('accountId') accountId: string, @Body() body: { limit: number; enabled: boolean }) {
    await this.accountService.configureOverdraft(accountId, body.limit, body.enabled);
    return { success: true };
  }

  @Post('account/:accountId/kyc/verify')
  @ApiOperation({ summary: 'Verificar KYC corporativo' })
  async verifyKyc(@Param('accountId') accountId: string) {
    return this.accountService.verifyKyc(accountId);
  }
}
