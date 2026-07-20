import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Logger } from '@nestjs/common';
import { TellerTransaction, TellerTransactionType, TellerTransactionStatus } from '../entities/teller-transaction.entity';
import { FxExchangeDto } from '../dto/fx-exchange.dto';

@Injectable()
export class FXTellerService {
  private readonly logger = new Logger(FXTellerService.name);

  // Tasas FX simuladas (en producción, integrar con mercado real)
  private fxRates: Map<string, number> = new Map([
    ['USD-EUR', 0.92],
    ['EUR-USD', 1.087],
    ['USD-MXN', 17.25],
    ['MXN-USD', 0.058],
    ['USD-GBP', 0.79],
    ['GBP-USD', 1.266],
    ['USD-JPY', 149.5],
    ['JPY-USD', 0.00669],
    ['USD-CAD', 1.36],
    ['CAD-USD', 0.735],
    ['EUR-GBP', 0.86],
    ['GBP-EUR', 1.163],
  ]);

  constructor(
    @InjectRepository(TellerTransaction)
    private transactionRepo: Repository<TellerTransaction>,
  ) {}

  /**
   * FX-001: Obtener tasa de cambio disponible
   */
  async getRate(fromCurrency: string, toCurrency: string): Promise<{
    fromCurrency: string;
    toCurrency: string;
    rate: number;
    timestamp: Date;
  }> {
    const pair = `${fromCurrency.toUpperCase()}-${toCurrency.toUpperCase()}`;
    const reversePair = `${toCurrency.toUpperCase()}-${fromCurrency.toUpperCase()}`;

    let rate = this.fxRates.get(pair);

    if (!rate) {
      // Intentar inversa
      const reverseRate = this.fxRates.get(reversePair);
      if (reverseRate) {
        rate = 1 / reverseRate;
        this.logger.log(`Calculando tasa inversa: ${pair} = 1/${reversePair} = ${rate}`);
      }
    }

    if (!rate) {
      throw new BadRequestException(`Par de divisa no disponible: ${pair}`);
    }

    return {
      fromCurrency: fromCurrency.toUpperCase(),
      toCurrency: toCurrency.toUpperCase(),
      rate,
      timestamp: new Date(),
    };
  }

  /**
   * FX-002: Listar todas las tasas disponibles
   */
  async getAllRates(): Promise<{
    fromCurrency: string;
    toCurrency: string;
    rate: number;
  }[]> {
    const result: { fromCurrency: string; toCurrency: string; rate: number }[] = [];

    for (const [pair, rate] of this.fxRates.entries()) {
      const [from, to] = pair.split('-');
      result.push({ fromCurrency: from, toCurrency: to, rate });
    }

    return result.sort((a, b) => `${a.fromCurrency}-${a.toCurrency}`.localeCompare(`${b.fromCurrency}-${b.toCurrency}`));
  }

  /**
   * FX-003: Calcular intercambio sin ejecutar
   */
  async calculateExchange(dto: {
    amountFrom: number;
    currencyFrom: string;
    currencyTo: string;
  }): Promise<{
    amountFrom: number;
    currencyFrom: string;
    currencyTo: string;
    rate: number;
    amountTo: number;
    commission: number;
    total: number;
  }> {
    const rateInfo = await this.getRate(dto.currencyFrom, dto.currencyTo);

    const amountTo = dto.amountFrom * rateInfo.rate;
    const commission = amountTo * 0.0025; // 0.25% commission

    return {
      amountFrom: dto.amountFrom,
      currencyFrom: dto.currencyFrom.toUpperCase(),
      currencyTo: dto.currencyTo.toUpperCase(),
      rate: rateInfo.rate,
      amountTo,
      commission,
      total: amountTo + commission,
    };
  }

  /**
   * FX-004: Ejecutar intercambio FX
   */
  async executeExchange(dto: FxExchangeDto): Promise<TellerTransaction> {
    this.logger.log(
      `Ejecutando intercambio FX: ${dto.amountFrom} ${dto.currencyFrom} → ${dto.currencyTo}`,
    );

    // Validar que la tasa exista
    const rateInfo = await this.getRate(dto.currencyFrom, dto.currencyTo);

    if (Math.abs(dto.exchangeRate - rateInfo.rate) > 0.01) {
      this.logger.warn(
        `Tasa desviada: solicitada=${dto.exchangeRate}, actual=${rateInfo.rate}`,
      );
    }

    // Calcular monto destino
    const amountTo = dto.amountFrom * dto.exchangeRate;

    const totalAmount = dto.amountFrom + (dto.commissionAmount ?? 0);

    const transactionData: Partial<TellerTransaction> = {
      transactionType: TellerTransactionType.FOREIGN_EXCHANGE,
      amountPrincipal: dto.amountFrom,
      totalAmount,
      feeCharged: dto.commissionAmount ?? 0,
      currencyCode: dto.currencyFrom.toUpperCase(),
      foreignExchangeRate: dto.exchangeRate,
      fromAccountId: dto.sourceAccountId,
      toAccountId: dto.destinationAccountId,
      overrideRequired: dto.amountFrom > 25000,
      receiptPrinted: false,
      transactionStatus: TellerTransactionStatus.PENDING,
      transactionReference: this.generateTransactionReference(),
    };

    const transaction = this.transactionRepo.create(transactionData) as unknown as TellerTransaction;
    
    transaction.branchId = dto.branchId;
    transaction.tellerUserId = dto.tellerUserId;
    transaction.customerId = dto.customerId;

    const saved = await this.transactionRepo.save(transaction);
    this.logger.log(
      `Intercambio FX creado: ref=${saved.transactionReference}, rate=${dto.exchangeRate}`,
    );

    return saved;
  }

  /**
   * FX-005: Confirmar intercambio (post-validación)
   */
  async confirmExchange(
    transactionId: string,
    confirmationData: {
      ledgerJournalEntryId?: string;
      actualRateUsed?: number;
    },
  ): Promise<TellerTransaction> {
    const tx = await this.getTransactionById(transactionId);

    tx.transactionStatus = TellerTransactionStatus.COMPLETED;
    if (confirmationData.ledgerJournalEntryId) {
      tx.ledgerJournalEntryId = confirmationData.ledgerJournalEntryId;
    }
    if (confirmationData.actualRateUsed) {
      tx.foreignExchangeRate = confirmationData.actualRateUsed;
    }
    tx.receiptPrinted = true;
    tx.processedAt = new Date();

    const updated = await this.transactionRepo.save(tx);
    this.logger.log(`Intercambio FX confirmado: ref=${updated.transactionReference}`);

    return updated;
  }

  /**
   * FX-006: Revertir intercambio FX
   */
  async reverseExchange(
    transactionId: string,
    reason: string,
    reversedByUserId: string,
  ): Promise<TellerTransaction> {
    const tx = await this.getTransactionById(transactionId);

    if (tx.transactionStatus !== 'completed') {
      throw new BadRequestException('Solo se pueden revertir intercambios completados');
    }

    tx.transactionStatus = TellerTransactionStatus.REVERSED;
    tx.reversalReason = reason;
    tx.overrideApprovedBy = reversedByUserId;

    const updated = await this.transactionRepo.save(tx);
    this.logger.log(`Intercambio FX revertido: ref=${updated.transactionReference}`);

    return updated;
  }

  /**
   * FX-007: Establecer tasa custom (para admin/supervisor)
   */
  async setCustomRate(
    fromCurrency: string,
    toCurrency: string,
    rate: number,
    setByUserId: string,
  ): Promise<{
    fromCurrency: string;
    toCurrency: string;
    oldRate: number | null;
    newRate: number;
    setBy: string;
  }> {
    const pair = `${fromCurrency.toUpperCase()}-${toCurrency.toUpperCase()}`;
    const oldRate = this.fxRates.get(pair) ?? null;

    if (rate <= 0) {
      throw new BadRequestException('La tasa debe ser mayor a 0');
    }

    this.fxRates.set(pair, rate);
    this.logger.log(`Tasa FX actualizada: ${pair} = ${rate} (setBy=${setByUserId})`);

    return {
      fromCurrency: fromCurrency.toUpperCase(),
      toCurrency: toCurrency.toUpperCase(),
      oldRate,
      newRate: rate,
      setBy: setByUserId,
    };
  }

  /**
   * FX-008: Resetear tasa a valor por defecto
   */
  async resetRate(fromCurrency: string, toCurrency: string): Promise<{
    fromCurrency: string;
    toCurrency: string;
    wasCustom: boolean;
  }> {
    const pair = `${fromCurrency.toUpperCase()}-${toCurrency.toUpperCase()}`;
    const wasCustom = this.fxRates.has(pair);
    
    this.fxRates.delete(pair);
    this.logger.log(`Tasa FX reseteada: ${pair} (wasCustom=${wasCustom})`);

    return {
      fromCurrency: fromCurrency.toUpperCase(),
      toCurrency: toCurrency.toUpperCase(),
      wasCustom,
    };
  }

  /**
   * Helper: obtener transacción por ID
   */
  private async getTransactionById(transactionId: string): Promise<TellerTransaction> {
    const tx = await this.transactionRepo.findOne({ where: { id: transactionId } });
    if (!tx) {
      throw new NotFoundException(`Transacción ${transactionId} no encontrada`);
    }
    return tx;
  }

  /**
   * Generar número de referencia único para transacción
   */
  private generateTransactionReference(): string {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `FX-${yearMonth}-${random}`;
  }
}
