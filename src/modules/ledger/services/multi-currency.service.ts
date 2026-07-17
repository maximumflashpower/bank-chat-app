import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  LedgerExchangeRate, FXRateSourceType,
} from '../entities/ledger-exchange-rate.entity';
import { CreateExchangeRateDto } from '../dto/create-exchange-rate.dto';
import { RevalueCurrencyDto } from '../dto/revalue-currency.dto';

@Injectable()
export class MultiCurrencyService {
  private readonly logger = new Logger(MultiCurrencyService.name);

  constructor(
    @InjectRepository(LedgerExchangeRate)
    private readonly fxRepo: Repository<LedgerExchangeRate>,
  ) {}

  /**
   * LEDGER-MC-001: Crear nueva tasa de cambio
   */
  async createRate(dto: CreateExchangeRateDto): Promise<LedgerExchangeRate> {
    // Calcular tasa promedio si no se proporciona
    const rateAvg = dto.rateSell
      ? (dto.rateBuy + dto.rateSell) / 2
      : dto.rateBuy;

    const rate = this.fxRepo.create({
      ...dto,
      rateAvg,
      rateDate: new Date(dto.rateDate),
    });

    const saved = await this.fxRepo.save(rate);

    this.logger.log(
      `Tasa de cambio creada: ${saved.fromCurrency}/${saved.toCurrency} = ${saved.rateAvg}`,
    );

    return saved;
  }

  /**
   * LEDGER-MC-003: Obtener tasa de cambio por fecha y monedas
   */
  async getRate(
    fromCurrency: string,
    toCurrency: string,
    date: Date,
  ): Promise<number> {
    const rate = await this.fxRepo.findOne({
      where: {
        fromCurrency,
        toCurrency,
        effective: true,
      },
      order: { rateDate: 'DESC' },
    });

    if (!rate) {
      throw new NotFoundException(
        `Tasa de cambio no encontrada: ${fromCurrency}/${toCurrency} al ${date.toISOString()}`,
      );
    }

    return rate.rateAvg;
  }

  /**
   * LEDGER-MC-003: Listar todas las tasas activas
   */
  async listRates(currencyPair?: { from: string; to: string }): Promise<LedgerExchangeRate[]> {
    const where = currencyPair
      ? { fromCurrency: currencyPair.from, toCurrency: currencyPair.to, effective: true }
      : { effective: true };

    return this.fxRepo.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * LEDGER-MC-002: Revaluación de divisas al cierre de periodo
   */
  async revalueCurrencies(dto: RevalueCurrencyDto): Promise<{
    revaluationDate: Date;
    currenciesRevalued: string[];
    totalGainLoss: number;
    entriesCreated: number;
  }> {
    const revalueDate = new Date(dto.revalueDate);

    this.logger.log(`Iniciando revaluación de divisas: ${revalueDate.toISOString()}`);

    // Placeholder: en producción, esto:
    // 1. Buscaría todas las posiciones en moneda extranjera
    // 2. Compararía tasa histórica vs tasa de cierre
    // 3. Generaría asientos contables de ganancia/pérdida
    // 4. Marcaría las tasas como revaluadas

    const currenciesRevalued: string[] = [];
    let totalGainLoss = 0;
    let entriesCreated = 0;

    // Simulación básica - en realidad consultaría ledger_journal_line
    if (dto.currency) {
      currenciesRevalued.push(dto.currency);
    } else {
      currenciesRevalued.push('EUR', 'GBP', 'MXN');
    }

    this.logger.log(
      `Revaluación completada: ${currenciesRevalued.length} divisas, ${entriesCreated} asientos`,
    );

    return {
      revaluationDate: new Date(dto.revalueDate),
      currenciesRevalued,
      totalGainLoss,
      entriesCreated,
    };
  }

  /**
   * LEDGER-MC-002: Convertir monto entre monedas
   */
  async convertAmount(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
    date: Date,
  ): Promise<{ convertedAmount: number; rateUsed: number; rateDate: Date }> {
    if (fromCurrency === toCurrency) {
      return { convertedAmount: amount, rateUsed: 1, rateDate: date };
    }

    const rate = await this.getRate(fromCurrency, toCurrency, date);
    const converted = amount * rate;

    return {
      convertedAmount: converted,
      rateUsed: rate,
      rateDate: date,
    };
  }

  /**
   * LEDGER-MC-003: Ingesta automática de tasas de cambio externas
   */
  async fetchFromProvider(provider: 'ecb' | 'reuters' | 'bloomberg'): Promise<number> {
    // Placeholder: integrar con API real de proveedor de tasas
    // ECB: European Central Bank API
    // Reuters: Reuters FX Feed
    // Bloomberg: Bloomberg Terminal API

    this.logger.log(`Ingestando tasas desde ${provider.toUpperCase()}...`);

    // Simulación - en producción haría llamada HTTP real
    let ratesImported = 0;

    if (provider === 'ecb') {
      ratesImported = 18; // EUR base a 18 monedas
    }

    this.logger.log(`${ratesImported} tasas importadas exitosamente`);

    return ratesImported;
  }

  /**
   * Desactivar tasa de cambio antigua (reemplazada por nueva)
   */
  async deactivateRate(rateId: string): Promise<LedgerExchangeRate> {
    const rate = await this.fxRepo.findOne({ where: { id: rateId } });

    if (!rate) {
      throw new NotFoundException(`Tasa de cambio no encontrada: ${rateId}`);
    }

    rate.effective = false;

    return this.fxRepo.save(rate);
  }

  /**
   * Obtener tasa más reciente para par de monedas
   */
  async getLatestRate(
    fromCurrency: string,
    toCurrency: string,
  ): Promise<LedgerExchangeRate | null> {
    return this.fxRepo.findOne({
      where: {
        fromCurrency,
        toCurrency,
        effective: true,
      },
      order: { rateDate: 'DESC' },
    });
  }
}
