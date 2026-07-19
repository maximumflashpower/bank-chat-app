import { Controller, Get, Post, Put, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CardService } from '../services/card.service';

@ApiTags('Cards — Instances')
@ApiBearerAuth()
@Controller('v1/cards')
export class CardController {
  constructor(private readonly cardService: CardService) {}

  @Post('request')
  @ApiOperation({ summary: 'Solicitar nueva tarjeta' })
  async requestCard(@Body() data: { productId: string; customerId: string; accountId: string }) {
    return this.cardService.requestCard(data);
  }

  @Get('customer/:customerId')
  @ApiOperation({ summary: 'Listar tarjetas del cliente' })
  async findByCustomer(@Param('customerId') customerId: string) {
    return this.cardService.findByCustomerId(customerId);
  }

  @Get(':cardId')
  @ApiOperation({ summary: 'Detalle tarjeta' })
  async findById(@Param('cardId') cardId: string) {
    return this.cardService.findById(cardId);
  }

  @Post(':cardId/activate')
  @ApiOperation({ summary: 'Activar tarjeta vía CVV' })
  async activate(@Param('cardId') cardId: string, @Body() body: { cvv: string }) {
    return this.cardService.activateCard(cardId, body.cvv);
  }

  @Put(':cardId/status')
  @ApiOperation({ summary: 'Bloquear/desbloquear tarjeta' })
  async updateStatus(@Param('cardId') cardId: string, @Body() body: { action: string; reason?: string }) {
    if (body.action === 'block') return this.cardService.blockCard(cardId, body.reason || 'user_request');
    if (body.action === 'unblock') return this.cardService.unblockCard(cardId);
    if (body.action === 'lost') return this.cardService.reportLost(cardId);
    if (body.action === 'stolen') return this.cardService.reportStolen(cardId);
    if (body.action === 'close') return this.cardService.closeCard(cardId);
  }

  @Post(':cardId/replace')
  @ApiOperation({ summary: 'Solicitar reemplazo' })
  async replace(@Param('cardId') cardId: string) {
    return this.cardService.replaceCard(cardId);
  }

  @Post(':cardId/renew')
  @ApiOperation({ summary: 'Renovar tarjeta' })
  async renew(@Param('cardId') cardId: string) {
    return this.cardService.renewCard(cardId);
  }

  @Put(':cardId/limits')
  @ApiOperation({ summary: 'Configurar límites' })
  async updateLimits(@Param('cardId') cardId: string, @Body() body: { dailyPurchaseLimit?: number; dailyAtmLimit?: number; onlinePurchaseLimit?: number }) {
    return this.cardService.updateLimits(cardId, body);
  }
}
