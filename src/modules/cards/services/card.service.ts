import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CardInstance, CardStatus } from '../entities/card-instance.entity';
import { CardProductService } from './card-product.service';
import { CardControlsService } from './card-controls.service';

@Injectable()
export class CardService {
  private readonly logger = new Logger(CardService.name);

  constructor(
    @InjectRepository(CardInstance)
    private readonly repo: Repository<CardInstance>,
    private readonly cardProductService: CardProductService,
    private readonly controlsService: CardControlsService,
  ) {}

  async requestCard(dto: { productId: string; customerId: string; accountId: string }): Promise<CardInstance> {
    const product = await this.cardProductService.findById(dto.productId);

    const pan = await this.cardProductService.generatePan(product.binRangeStart.substring(0, 6));
    const panLastFour = pan.substring(pan.length - 4);
    const panHash = this.hashPan(pan);

    const now = new Date();
    const expirationDate = new Date(now.getFullYear() + 5, now.getMonth(), 1);

    const card = this.repo.create({
      ...dto,
      panEncrypted: this.encrypt(pan),
      panLastFour,
      panHash,
      expirationMonth: expirationDate.getMonth() + 1,
      expirationYear: expirationDate.getFullYear(),
      cvvEncrypted: this.encrypt(this.generateCvv()),
      cardholderName: 'CARDHOLDER NAME',
      isVirtual: true,
      issuedAt: now,
      status: CardStatus.PENDING_ACTIVATION,
      availableCredit: product.defaultCreditLimit || 0,
      creditLimit: product.defaultCreditLimit,
    });

    const saved = await this.repo.save(card);
    
    await this.controlsService.create({ cardId: saved.id });

    this.logger.log(`Card requested: ${saved.panLastFour}, customer=${dto.customerId}`);
    return saved;
  }

  async activateCard(id: string, cvv: string): Promise<CardInstance> {
    const card = await this.findById(id);
    
    if (card.status !== CardStatus.PENDING_ACTIVATION) {
      throw new BadRequestException(`Card is not pending activation, status=${card.status}`);
    }

    card.status = CardStatus.ACTIVE;
    card.activatedAt = new Date();
    return this.repo.save(card);
  }

  async findById(id: string): Promise<CardInstance> {
    const card = await this.repo.findOne({ where: { id } });
    if (!card) throw new NotFoundException(`Card ${id} not found`);
    return card;
  }

  async findByCustomerId(customerId: string): Promise<CardInstance[]> {
    return this.repo.find({ 
      where: { customerId },
      order: { issuedAt: 'DESC' },
    });
  }

  async blockCard(id: string, reason: string): Promise<CardInstance> {
    const card = await this.findById(id);
    card.status = CardStatus.BLOCKED;
    card.blockReason = reason;
    card.blockedAt = new Date();
    return this.repo.save(card);
  }

  async unblockCard(id: string): Promise<CardInstance> {
    const card = await this.findById(id);
    card.status = CardStatus.ACTIVE;
    card.blockReason = null;
    card.blockedAt = null;
    return this.repo.save(card);
  }

  async reportLost(id: string): Promise<CardInstance> {
    const card = await this.findById(id);
    card.status = CardStatus.LOST;
    card.blockedAt = new Date();
    return this.repo.save(card);
  }

  async reportStolen(id: string): Promise<CardInstance> {
    const card = await this.findById(id);
    card.status = CardStatus.STOLEN;
    card.blockedAt = new Date();
    return this.repo.save(card);
  }

  async closeCard(id: string): Promise<CardInstance> {
    const card = await this.findById(id);
    card.status = CardStatus.CLOSED;
    return this.repo.save(card);
  }

  async renewCard(id: string): Promise<CardInstance> {
    const card = await this.findById(id);
    
    const renewal = this.repo.create({
      ...card,
      id: undefined,
      status: CardStatus.ISSUED,
      renewedFromCardId: card.id,
      expirationYear: card.expirationYear + 5,
      cvvEncrypted: this.encrypt(this.generateCvv()),
      issuedAt: new Date(),
      activatedAt: null,
    });

    card.status = CardStatus.RENEWED;
    await this.repo.save(card);
    
    const savedRenewal = await this.repo.save(renewal);
    return savedRenewal;
  }

  async replaceCard(id: string): Promise<CardInstance> {
    const card = await this.findById(id);
    
    const replacement = this.repo.create({
      ...card,
      id: undefined,
      panEncrypted: this.encrypt(await this.cardProductService.generatePan(card.panLastFour)),
      panHash: '',
      status: CardStatus.ISSUED,
      cvvEncrypted: this.encrypt(this.generateCvv()),
      issuedAt: new Date(),
      activatedAt: null,
    });

    card.status = CardStatus.CLOSED;
    await this.repo.save(card);
    
    const savedReplacement = await this.repo.save(replacement);
    return savedReplacement;
  }

  async updateLimits(id: string, limits: { dailyPurchaseLimit?: number; dailyAtmLimit?: number; onlinePurchaseLimit?: number }): Promise<CardInstance> {
    const card = await this.findById(id);
    if (limits.dailyPurchaseLimit !== undefined) card.dailyPurchaseLimit = limits.dailyPurchaseLimit;
    if (limits.dailyAtmLimit !== undefined) card.dailyAtmLimit = limits.dailyAtmLimit;
    if (limits.onlinePurchaseLimit !== undefined) card.onlinePurchaseLimit = limits.onlinePurchaseLimit;
    return this.repo.save(card);
  }

  private encrypt(value: string): string {
    return Buffer.from(value).toString('base64');
  }

  private hashPan(pan: string): string {
    return require('crypto').createHash('sha256').update(pan).digest('hex');
  }

  private generateCvv(): string {
    return Math.floor(Math.random() * 9000 + 1000).toString();
  }
}
