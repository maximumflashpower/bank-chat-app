import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RemittanceService } from '../services/remittance.service';

@ApiTags('correspondent')
@Controller('v1/remittance')
export class RemittanceController {
  constructor(private readonly service: RemittanceService) {}

  @Post('/initiate')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Iniciar instrucción pago cross-border' })
  async initiate(@Body() data: Partial<any>) {
    return this.service.initiate(data);
  }

  @Get('/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Detalle instrucción de remesa' })
  async getById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Get('/number/:number')
  @ApiOperation({ summary: 'Buscar por número de remesa' })
  async getByNumber(@Param('number') number: string) {
    return this.service.findByNumber(number);
  }

  @Get('/')
  @ApiOperation({ summary: 'Listar instrucciones con filtros' })
  async list(@Query('status') status?: string, @Query('customerId') customerId?: string) {
    return this.service.findAll(status ? { status } : undefined);
  }

  @Post('/:id/route-optimize')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Recomendar mejor ruta costo-tiempo éxito' })
  async optimizeRoute(@Param('id') id: string) {
    return this.service.routeOptimize(id);
  }

  @Post('/:id/execute')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ejecutar instrucción ruta seleccionada' })
  async execute(@Param('id') id: string) {
    return this.service.execute(id);
  }

  @Post('/:id/confirm')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Confirmar ejecución con GPI tracking' })
  async confirmExecution(
    @Param('id') id: string,
    @Body() body: { gpiTrackingId: string },
  ) {
    return this.service.confirmExecution(id, body.gpiTrackingId);
  }

  @Get('/:id/track')
  @ApiOperation({ summary: 'Tracking end-to-end status GPI track' })
  async track(@Param('id') id: string) {
    return this.service.getTrackingStatus(id);
  }

  @Get('/:id/fee-breakdown')
  @ApiOperation({ summary: 'Desglose completo fees total landed cost' })
  async feeBreakdown(@Param('id') id: string) {
    return this.service.calculateLandedCost(id);
  }

  @Post('/:id/cancel')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancelar instrucción' })
  async cancel(@Param('id') id: string, @Body() body: { reason: string }) {
    return this.service.cancel(id, body.reason);
  }
}
