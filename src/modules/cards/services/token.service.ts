import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, Not } from 'typeorm';
import { CardToken, WalletProvider, TokenStatus } from '../entities/card-token.entity';

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);

  constructor(
    @InjectRepository(CardToken)
    private readonly repo: Repository<CardToken>,
  ) {}

  async tokenizeCard(data: { 
    cardId: string; 
    walletProvider: WalletProvider; 
    tokenValue: string; 
    deviceId?: string; 
    deviceName?: string; 
  }): Promise<CardToken> {
    const expiration = new Date();
    expiration.setFullYear(expiration.getFullYear() + 3);

    const token = this.repo.create({
      ...data,
      tokenExpiration: expiration,
      status: TokenStatus.ACTIVE,
      usageCount: 0,
    });

    const saved = await this.repo.save(token);
    this.logger.log(`Card tokenized: card=${data.cardId}, wallet=${data.walletProvider}`);
    return saved;
  }

  async findById(id: string): Promise<CardToken> {
    const token = await this.repo.findOne({ where: { id } });
    if (!token) throw new NotFoundException(`Token ${id} not found`);
    return token;
  }

  async findByCard(cardId: string): Promise<CardToken[]> {
    return this.repo.find({
      where: { cardId },
      order: { createdAt: 'DESC' },
    });
  }

  async revokeToken(id: string): Promise<CardToken> {
    const token = await this.findById(id);
    token.status = TokenStatus.REVOKED;
    return this.repo.save(token);
  }

  async suspendToken(id: string): Promise<CardToken> {
    const token = await this.findById(id);
    token.status = TokenStatus.SUSPENDED;
    return this.repo.save(token);
  }

  async reactivateToken(id: string): Promise<CardToken> {
    const token = await this.findById(id);
    token.status = TokenStatus.ACTIVE;
    return this.repo.save(token);
  }

  async incrementUsage(id: string): Promise<void> {
    await this.repo.increment({ id }, "usageCount", 1);
    await this.repo.update(id, { lastUsedAt: new Date() });
  }

  async cleanupExpired(): Promise<number> {
    const now = new Date();
    const expiredTokens = await this.repo.find({
      where: {
        tokenExpiration: LessThan(now),
      },
    });
    let updated = 0;
    for (const token of expiredTokens) {
      if (token.status !== TokenStatus.REVOKED) {
        token.status = TokenStatus.EXPIRED;
        await this.repo.save(token);
        updated++;
      }
    }
    this.logger.log(`Expired tokens marked: ${updated}`);
    return updated;
  }

  async getByDevice(deviceId: string): Promise<CardToken[]> {
    return this.repo.find({ where: { deviceId, status: TokenStatus.ACTIVE } });
  }
}
