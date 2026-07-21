import { Controller, Get, Post, Put, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CardProductService } from '../services/card-product.service';
import { CardType, CardNetwork } from '../entities/card-product.entity';

@ApiTags('Cards — Products')
@ApiBearerAuth()
@Controller('v1/cards/products')
export class ProductController {
  constructor(private readonly productService: CardProductService) {}

  @Post('create')
  @ApiOperation({ summary: 'Crear producto de tarjeta' })
  async create(@Body() data: any) {
    return this.productService.create(data as any);
  }

  @Get()
  @ApiOperation({ summary: 'Listar productos activos' })
  async findAll() {
    return this.productService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle producto' })
  async findById(@Param('id') id: string) {
    return this.productService.findById(id);
  }

  @Get('code/:code')
  @ApiOperation({ summary: 'Buscar por código' })
  async findByCode(@Param('code') code: string) {
    return this.productService.findByCode(code);
  }

  @Get('type/:cardType')
  @ApiOperation({ summary: 'Productos por tipo' })
  async findByType(@Param('cardType') cardType: CardType) {
    return this.productService.findByType(cardType);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar producto' })
  async update(@Param('id') id: string, @Body() data: any) {
    return this.productService.update(id, data as any);
  }

  @Post(':id/deactivate')
  @ApiOperation({ summary: 'Desactivar producto' })
  async deactivate(@Param('id') id: string) {
    return this.productService.deactivate(id);
  }

  @Post(':id/activate')
  @ApiOperation({ summary: 'Activar producto' })
  async activate(@Param('id') id: string) {
    return this.productService.activate(id);
  }
}
