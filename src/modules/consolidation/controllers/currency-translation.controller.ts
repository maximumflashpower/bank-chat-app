import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CurrencyTranslationService } from '../services/currency-translation.service';
import { TranslateDto, BulkTranslateDto } from '../dto/translate.dto';

@ApiTags('Consolidation — Currency Translation')
@ApiBearerAuth()
@Controller('consolidation/translations')
export class CurrencyTranslationController {
  constructor(private readonly translationService: CurrencyTranslationService) {}

  @Get('run/:runId')
  @ApiOperation({ summary: 'Listar traducciones por run' })
  async findByRun(@Param('runId') runId: string) {
    return this.translationService.findByRun(runId);
  }

  @Get('entity/:entityId')
  @ApiOperation({ summary: 'Listar traducciones por entidad' })
  async findByEntity(@Param('entityId') entityId: string) {
    return this.translationService.findByEntity(entityId);
  }

  @Post('translate')
  @ApiOperation({ summary: 'Realizar traducción de moneda' })
  async translate(@Body() dto: TranslateDto) {
    return this.translationService.translate(
      dto.runId, dto.entityId, dto.translationType,
      dto.sourceCurrency, dto.targetCurrency,
      dto.translationMethod, dto.amount, dto.exchangeRate,
    );
  }

  @Post('bulk-translate')
  @ApiOperation({ summary: 'Traducción masiva' })
  async bulkTranslate(@Body() dto: BulkTranslateDto) {
    return this.translationService.bulkTranslate(dto.runId, dto.entityId, dto.entries);
  }

  @Get('run/:runId/cta')
  @ApiOperation({ summary: 'Calcular Cumulative Translation Adjustment' })
  async calculateCTA(@Param('runId') runId: string) {
    const cta = await this.translationService.calculateCTA(runId);
    return { runId, cumulativeTranslationAdjustment: cta };
  }

  @Get('run/:runId/fx-gain-loss')
  @ApiOperation({ summary: 'Calcular ganancia/pérdida FX' })
  async calculateFxGainLoss(@Param('runId') runId: string) {
    const gainLoss = await this.translationService.calculateFxGainLoss(runId);
    return { runId, fxGainLoss: gainLoss };
  }

  @Post('rate')
  @ApiOperation({ summary: 'Configurar tasa de cambio manual' })
  async setRate(@Body() body: { from: string; to: string; rate: number; method?: string }) {
    this.translationService.setRate(body.from, body.to, body.rate, body.method as any);
    return { success: true, message: `Rate set: ${body.from}/${body.to} = ${body.rate}` };
  }
}
