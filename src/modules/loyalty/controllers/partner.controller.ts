import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { MerchantPartnerService } from '../services/merchant-partner.service';
import { RegisterMerchantDto } from '../dto/register-merchant.dto';

@ApiTags('loyalty')
@Controller('v1/loyalty/partner')
export class PartnerController {
  constructor(private readonly merchantService: MerchantPartnerService) {}

  @Get('/merchants')
  @ApiOperation({ summary: 'Listar merchants partners' })
  async listMerchants(@Query('programId') programId?: string) {
    return this.merchantService.findAll(programId);
  }

  @Post('/register')
  @ApiOperation({ summary: 'Registrar nuevo merchant' })
  async registerMerchant(@Body() dto: RegisterMerchantDto) {
    return this.merchantService.register(dto);
  }

  @Get('/:id/stats')
  @ApiOperation({ summary: 'Estadísticas merchant' })
  @ApiParam({ name: 'id' })
  async getStats(@Param('id') id: string) {
    return this.merchantService.getStats(id);
  }

  @Post('/:id/settle-commission')
  @ApiOperation({ summary: 'Liquidar comisiones mensuales' })
  @ApiParam({ name: 'id' })
  async settleCommission(
    @Param('id') id: string,
    @Body('periodStart') periodStart: string,
    @Body('periodEnd') periodEnd: string,
  ) {
    return this.merchantService.settleCommission(id, new Date(periodStart), new Date(periodEnd));
  }

  @Post('/:id/update-commission-rate')
  @ApiOperation({ summary: 'Actualizar tasa de comisión' })
  @ApiParam({ name: 'id' })
  async updateCommission(
    @Param('id') id: string,
    @Body('commissionRate') commissionRate: number,
  ) {
    return this.merchantService.updateCommission(id, commissionRate);
  }
}
