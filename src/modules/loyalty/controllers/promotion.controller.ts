import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { PromotionService } from '../services/promotion.service';
import { CreatePromotionDto } from '../dto/create-promotion.dto';

@ApiTags('admin')
@Controller('v1/admin/promotion')
export class PromotionController {
  constructor(private readonly promotionService: PromotionService) {}

  @Post('/create')
  @ApiOperation({ summary: 'Crear campaña promocional' })
  async createPromotion(@Body() dto: CreatePromotionDto) {
    return this.promotionService.create(dto);
  }

  @Put('/:id/activate')
  @ApiOperation({ summary: 'Activar campaña' })
  @ApiParam({ name: 'id' })
  async activate(@Param('id') id: string) {
    return this.promotionService.activate(id);
  }

  @Put('/:id/pause')
  @ApiOperation({ summary: 'Pausar campaña' })
  @ApiParam({ name: 'id' })
  async pause(@Param('id') id: string) {
    return this.promotionService.pause(id);
  }

  @Delete('/:id')
  @ApiOperation({ summary: 'Cancelar campaña' })
  @ApiParam({ name: 'id' })
  async cancel(@Param('id') id: string) {
    return this.promotionService.cancel(id);
  }

  @Get('/list')
  @ApiOperation({ summary: 'Listar campañas' })
  @ApiQuery({ name: 'activeOnly', required: false, type: Boolean })
  async listPromotions(@Query('activeOnly') activeOnly?: string) {
    return this.promotionService.findAll(activeOnly === 'true');
  }

  @Get('/check-eligibility/:promotionId')
  @ApiOperation({ summary: 'Verificar elegibilidad para promoción' })
  @ApiParam({ name: 'promotionId' })
  async checkEligibility(
    @Param('promotionId') promotionId: string,
    @Query('customerId') customerId: string,
    @Query('tier') tier?: string,
  ) {
    return this.promotionService.checkEligibility(promotionId, customerId, tier);
  }
}
