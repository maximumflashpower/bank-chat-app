import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DepositProductService } from '../services/deposit-product.service';
import { DepositProductType } from '../entities/retail-deposit-product.entity';

@ApiTags('Retail — Deposit Products')
@ApiBearerAuth()
@Controller('v1/retail/deposit-product')
export class DepositProductController {
  constructor(private readonly depositService: DepositProductService) {}

  @Post('cd/create')
  @ApiOperation({ summary: 'Crear Certificado de Depósito' })
  async createCd(@Body() data: any) {
    return this.depositService.createCD(data as any);
  }

  @Get('products/list')
  @ApiOperation({ summary: 'Listar productos CD/Money Market disponibles' })
  async listProducts(@Query('type') type: DepositProductType) {
    return this.depositService.listAvailableProducts(type);
  }

  @Get('cd/:cdId')
  @ApiOperation({ summary: 'Detalle CD con schedule' })
  async findById(@Param('cdId') cdId: string) {
    return this.depositService.findById(cdId);
  }

  @Get('cd/:cdId/projected-interest')
  @ApiOperation({ summary: 'Proyección de intereses' })
  async getProjectedInterest(@Param('cdId') cdId: string) {
    return this.depositService.getProjectedInterest(cdId);
  }

  @Post('cd/:cdId/renew')
  @ApiOperation({ summary: 'Renovar CD al vencimiento' })
  async renewCd(@Param('cdId') cdId: string, @Body() body: { renewalTermMonths?: number }) {
    return this.depositService.renewCd(cdId, body.renewalTermMonths);
  }

  @Post('cd/:cdId/early-withdraw')
  @ApiOperation({ summary: 'Retiro anticipado CD' })
  async earlyWithdrawal(@Param('cdId') cdId: string) {
    return this.depositService.earlyWithdrawal(cdId);
  }

  @Get('cds/by-account/:accountId')
  @ApiOperation({ summary: 'Listar CDs por cuenta' })
  async findByAccount(@Param('accountId') accountId: string) {
    return this.depositService.findByAccount(accountId);
  }
}
