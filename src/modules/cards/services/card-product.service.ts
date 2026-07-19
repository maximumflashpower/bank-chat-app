import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CardProduct, CardType, CardNetwork, CardLevel } from '../entities/card-product.entity';

@Injectable()
export class CardProductService {
  private readonly logger = new Logger(CardProductService.name);

  constructor(
    @InjectRepository(CardProduct)
    private readonly repo: Repository<CardProduct>,
  ) {}

  async create(dto: Partial<CardProduct>): Promise<CardProduct> {
    const product = this.repo.create({
      ...dto,
      isActive: true,
    });

    const saved = await this.repo.save(product);
    this.logger.log(`Card product created: ${saved.productCode}`);
    return saved;
  }

  async findById(id: string): Promise<CardProduct> {
    const product = await this.repo.findOne({ where: { id } });
    if (!product) throw new NotFoundException(`Card product ${id} not found`);
    return product;
  }

  async findByCode(code: string): Promise<CardProduct> {
    const product = await this.repo.findOne({ where: { productCode: code } });
    if (!product) throw new NotFoundException(`Card product ${code} not found`);
    return product;
  }

  async findAll(): Promise<CardProduct[]> {
    return this.repo.find({ where: { isActive: true }, order: { productName: 'ASC' } });
  }

  async findByType(cardType: CardType): Promise<CardProduct[]> {
    return this.repo.find({ where: { cardType, isActive: true } });
  }

  async findByNetwork(network: CardNetwork): Promise<CardProduct[]> {
    return this.repo.find({ where: { cardNetwork: network, isActive: true } });
  }

  async update(id: string, dto: Partial<CardProduct>): Promise<CardProduct> {
    const product = await this.findById(id);
    Object.assign(product, dto);
    return this.repo.save(product);
  }

  async deactivate(id: string): Promise<CardProduct> {
    const product = await this.findById(id);
    product.isActive = false;
    return this.repo.save(product);
  }

  async activate(id: string): Promise<CardProduct> {
    const product = await this.findById(id);
    product.isActive = true;
    return this.repo.save(product);
  }

  async generatePan(bin: string, lastFour?: string): Promise<string> {
    const checksum = this.luhnChecksum(bin + (lastFour || '0000'));
    return bin + lastFour + checksum.toString();
  }

  private luhnChecksum(number: string): number {
    let sum = 0;
    for (let i = 0; i < number.length; i++) {
      let digit = parseInt(number[i], 10);
      if (i % 2 === 0) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
    }
    return (10 - (sum % 10)) % 10;
  }
}
