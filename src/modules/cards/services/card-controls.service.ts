import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CardControls } from '../entities/card-controls.entity';

@Injectable()
export class CardControlsService {
  private readonly logger = new Logger(CardControlsService.name);

  constructor(
    @InjectRepository(CardControls)
    private readonly repo: Repository<CardControls>,
  ) {}

  async create(data: Partial<CardControls>): Promise<CardControls> {
    const controls = this.repo.create({
      cardId: data.cardId,
      contactlessEnabled: true,
      onlinePurchasesEnabled: true,
      internationalTransactionsEnabled: true,
      atmWithdrawalsEnabled: true,
      mccBlockedList: [],
      mccAllowedList: [],
      geographicRestrictions: {},
      merchantBlockedList: [],
      transactionAlertsEnabled: true,
      alertThresholdAmount: 1000,
      virtualCardEnabled: true,
      subscriptionPaymentsEnabled: true,
    });
    return this.repo.save(controls);
  }

  async findByCard(cardId: string): Promise<CardControls> {
    const controls = await this.repo.findOne({ where: { cardId } });
    if (!controls) throw new NotFoundException(`Controls for card ${cardId} not found`);
    return controls;
  }

  async update(cardId: string, dto: Partial<CardControls>): Promise<CardControls> {
    const controls = await this.findByCard(cardId);
    Object.assign(controls, dto);
    return this.repo.save(controls);
  }

  async toggleContactless(cardId: string, enabled: boolean): Promise<CardControls> {
    const controls = await this.findByCard(cardId);
    controls.contactlessEnabled = enabled;
    return this.repo.save(controls);
  }

  async toggleOnline(cardId: string, enabled: boolean): Promise<CardControls> {
    const controls = await this.findByCard(cardId);
    controls.onlinePurchasesEnabled = enabled;
    return this.repo.save(controls);
  }

  async toggleInternational(cardId: string, enabled: boolean): Promise<CardControls> {
    const controls = await this.findByCard(cardId);
    controls.internationalTransactionsEnabled = enabled;
    return this.repo.save(controls);
  }

  async toggleAtm(cardId: string, enabled: boolean): Promise<CardControls> {
    const controls = await this.findByCard(cardId);
    controls.atmWithdrawalsEnabled = enabled;
    return this.repo.save(controls);
  }

  async blockMerchant(cardId: string, merchant: string): Promise<CardControls> {
    const controls = await this.findByCard(cardId);
    if (!controls.merchantBlockedList.includes(merchant)) {
      controls.merchantBlockedList.push(merchant);
    }
    return this.repo.save(controls);
  }

  async unblockMerchant(cardId: string, merchant: string): Promise<CardControls> {
    const controls = await this.findByCard(cardId);
    controls.merchantBlockedList = controls.merchantBlockedList.filter(m => m !== merchant);
    return this.repo.save(controls);
  }

  async setGeoRestrictions(cardId: string, restrictions: Record<string, unknown>): Promise<CardControls> {
    const controls = await this.findByCard(cardId);
    controls.geographicRestrictions = restrictions;
    return this.repo.save(controls);
  }

  async validateTransaction(cardId: string, params: { 
    amount: number; 
    isInternational: boolean; 
    isOnline: boolean; 
    isContactless: boolean; 
    isAtm: boolean; 
    merchantMcc: string; 
    merchantName: string;
  }): Promise<{ allowed: boolean; reason?: string }> {
    const controls = await this.findByCard(cardId);

    if (params.isContactless && !controls.contactlessEnabled) {
      return { allowed: false, reason: 'Contactless disabled' };
    }
    if (params.isOnline && !controls.onlinePurchasesEnabled) {
      return { allowed: false, reason: 'Online purchases disabled' };
    }
    if (params.isInternational && !controls.internationalTransactionsEnabled) {
      return { allowed: false, reason: 'International transactions disabled' };
    }
    if (params.isAtm && !controls.atmWithdrawalsEnabled) {
      return { allowed: false, reason: 'ATM withdrawals disabled' };
    }
    if (controls.mccBlockedList.includes(params.merchantMcc)) {
      return { allowed: false, reason: `MCC ${params.merchantMcc} blocked` };
    }
    if (controls.merchantBlockedList.some(m => params.merchantName.toLowerCase().includes(m.toLowerCase()))) {
      return { allowed: false, reason: `Merchant ${params.merchantName} blocked` };
    }

    return { allowed: true };
  }
}
