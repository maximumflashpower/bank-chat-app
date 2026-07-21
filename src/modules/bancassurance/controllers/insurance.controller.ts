import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { QuoteService } from '../services/quote.service';
import { PolicyService } from '../services/policy.service';
import { QuoteDto } from '../dto/quote.dto';
import { IssuePolicyDto } from '../dto/issue-policy.dto';
import { EndorsementDto } from '../dto/endorsement.dto';

@ApiTags('insurance')
@Controller('api/v1/insurance')
export class InsuranceController {
  constructor(
    private readonly quoteService: QuoteService,
    private readonly policyService: PolicyService,
  ) {}

  @Get('/products')
  @ApiOperation({ summary: 'Catálogo de productos de seguros' })
  async getProducts() {
    return this.quoteService.getProducts();
  }

  @Post('/quote')
  @ApiOperation({ summary: 'Cotizar seguro' })
  async quote(@Body() dto: QuoteDto) {
    return this.quoteService.quote(dto);
  }

  @Get('/quotes/:id')
  @ApiOperation({ summary: 'Detalle de cotización' })
  @ApiParam({ name: 'id' })
  async getQuote(@Param('id') id: string) {
    return this.quoteService.getQuoteById(id);
  }

  @Get('/quotes')
  @ApiOperation({ summary: 'Listar cotizaciones del usuario' })
  async getQuotes(@Query('userId') userId: string) {
    return this.quoteService.getQuotesByUser(userId);
  }

  @Post('/policies')
  @ApiOperation({ summary: 'Emitir póliza' })
  async issuePolicy(@Body() dto: IssuePolicyDto) {
    return this.policyService.issue(dto);
  }

  @Get('/policies')
  @ApiOperation({ summary: 'Listar pólizas del cliente' })
  async getPolicies(@Query('userId') userId: string) {
    return this.policyService.findByUser(userId);
  }

  @Get('/policies/:id')
  @ApiOperation({ summary: 'Detalle de póliza' })
  @ApiParam({ name: 'id' })
  async getPolicy(@Param('id') id: string) {
    return this.policyService.findById(id);
  }

  @Put('/policies/:id/endorsement')
  @ApiOperation({ summary: 'Modificar póliza (endorsement)' })
  @ApiParam({ name: 'id' })
  async endorse(@Param('id') id: string, @Body() dto: EndorsementDto) {
    return this.policyService.endorse(id, dto);
  }

  @Post('/policies/:id/renew')
  @ApiOperation({ summary: 'Renovar póliza' })
  @ApiParam({ name: 'id' })
  async renew(@Param('id') id: string) {
    return this.policyService.renew(id);
  }

  @Post('/policies/:id/cancel')
  @ApiOperation({ summary: 'Cancelar póliza' })
  @ApiParam({ name: 'id' })
  async cancel(@Param('id') id: string, @Body('reason') reason: string) {
    return this.policyService.cancel(id, reason);
  }

  @Get('/policies/:id/premiums')
  @ApiOperation({ summary: 'Historial de primas cobradas' })
  @ApiParam({ name: 'id' })
  async getPremiumHistory(@Param('id') id: string) {
    return this.policyService.getPremiumHistory(id);
  }
}
