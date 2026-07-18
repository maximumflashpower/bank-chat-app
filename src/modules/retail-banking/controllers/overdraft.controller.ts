import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OverdraftService } from '../services/overdraft.service';

@ApiTags('Retail — Overdraft')
@ApiBearerAuth()
@Controller('v1/retail/overdraft')
export class OverdraftController {
  constructor(private readonly overdraftService: OverdraftService) {}

  @Post('configure')
  @ApiOperation({ summary: 'Configurar protección sobregiro' })
  async configure(@Body() body: { accountId: string; limit: number }) {
    await this.overdraftService.configureOverdraftLimit(body.accountId, body.limit);
    return { success: true, message: `Overdraft limit set to ${body.limit}` };
  }

  @Get('status')
  @ApiOperation({ summary: 'Estado overdraft limite disponible' })
  async getStatus(@Param('accountId') accountId: string) {
    return this.overdraftService.getAvailableOverdraft(accountId);
  }

  @Get('history/:accountId')
  @ApiOperation({ summary: 'Historial eventos sobregiro' })
  async getHistory(@Param('accountId') accountId: string) {
    return this.overdraftService.getOverdraftHistory(accountId);
  }

  @Post('check')
  @ApiOperation({ summary: 'Verificar transacción contra sobregiro' })
  async checkTransaction(@Body() body: { accountId: string; amount: number }) {
    return this.overdraftService.checkTransaction(body.accountId, body.amount);
  }
}
