import { Controller, Get, Put, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CardControlsService } from '../services/card-controls.service';

@ApiTags('Cards — Controls')
@ApiBearerAuth()
@Controller('v1/cards/controls')
export class ControlsController {
  constructor(private readonly controlsService: CardControlsService) {}

  @Get(':cardId')
  @ApiOperation({ summary: 'Obtener controles' })
  async get(@Param('cardId') cardId: string) {
    return this.controlsService.findByCard(cardId);
  }

  @Put(':cardId')
  @ApiOperation({ summary: 'Actualizar controles' })
  async update(@Param('cardId') cardId: string, @Body() data: any) {
    return this.controlsService.update(cardId, data as any);
  }

  @Put(':cardId/contactless')
  @ApiOperation({ summary: 'Toggle contactless' })
  async toggleContactless(@Param('cardId') cardId: string, @Body() body: { enabled: boolean }) {
    return this.controlsService.toggleContactless(cardId, body.enabled);
  }

  @Put(':cardId/international')
  @ApiOperation({ summary: 'Toggle international' })
  async toggleInternational(@Param('cardId') cardId: string, @Body() body: { enabled: boolean }) {
    return this.controlsService.toggleInternational(cardId, body.enabled);
  }

  @Put(':cardId/atm')
  @ApiOperation({ summary: 'Toggle ATM' })
  async toggleAtm(@Param('cardId') cardId: string, @Body() body: { enabled: boolean }) {
    return this.controlsService.toggleAtm(cardId, body.enabled);
  }

  @Put(':cardId/online')
  @ApiOperation({ summary: 'Toggle online' })
  async toggleOnline(@Param('cardId') cardId: string, @Body() body: { enabled: boolean }) {
    return this.controlsService.toggleOnline(cardId, body.enabled);
  }

  @Put(':cardId/geo-restrictions')
  @ApiOperation({ summary: 'Restricciones geográficas' })
  async setGeo(@Param('cardId') cardId: string, @Body() body: { restrictions: Record<string, unknown> }) {
    return this.controlsService.setGeoRestrictions(cardId, body.restrictions);
  }

  @Post(':cardId/block-merchant')
  @ApiOperation({ summary: 'Bloquear comerciante' })
  async blockMerchant(@Param('cardId') cardId: string, @Body() body: { merchant: string }) {
    return this.controlsService.blockMerchant(cardId, body.merchant);
  }
}
