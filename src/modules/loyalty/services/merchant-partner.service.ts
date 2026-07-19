import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoyaltyMerchantPartner, PartnerStatus } from '../entities/loyalty-merchant-partner.entity';
import { RegisterMerchantDto } from '../dto/register-merchant.dto';

@Injectable()
export class MerchantPartnerService {
  constructor(
    @InjectRepository(LoyaltyMerchantPartner)
    private repo: Repository<LoyaltyMerchantPartner>,
  ) {}

  async register(dto: RegisterMerchantDto): Promise<LoyaltyMerchantPartner> {
    const merchant = this.repo.create(dto);
    return this.repo.save(merchant);
  }

  async findAll(programId?: string, status?: PartnerStatus): Promise<LoyaltyMerchantPartner[]> {
    const conditions: any = {};
    if (programId) conditions.programId = programId;
    if (status) conditions.status = status;
    return this.repo.find({ where: Object.keys(conditions).length > 0 ? conditions : undefined });
  }

  async findById(id: string): Promise<LoyaltyMerchantPartner> {
    const merchant = await this.repo.findOne({ where: { id } });
    if (!merchant) throw new NotFoundException('Merchant not found');
    return merchant;
  }

  async getByCode(code: string): Promise<LoyaltyMerchantPartner> {
    const merchant = await this.repo.findOne({ where: { merchantCode: code } });
    if (!merchant) throw new NotFoundException('Merchant not found');
    return merchant;
  }

  async updateCommission(id: string, commissionRate: number): Promise<LoyaltyMerchantPartner> {
    const merchant = await this.findById(id);
    merchant.commissionRate = commissionRate;
    return this.repo.save(merchant);
  }

  async updateMultiplier(id: string, multiplier: number): Promise<LoyaltyMerchantPartner> {
    const merchant = await this.findById(id);
    merchant.earningMultiplier = multiplier;
    return this.repo.save(merchant);
  }

  async getStats(merchantId: string): Promise<{
    totalTransactions: number;
    totalPointsGenerated: number;
    totalCommissionAccrued: number;
    averageTransactionValue: number;
  }> {
    const merchant = await this.findById(merchantId);
    // Placeholder - en producción consultaría transacciones reales
    return {
      totalTransactions: 0,
      totalPointsGenerated: Number(merchant.totalPointsGenerated),
      totalCommissionAccrued: Number(merchant.totalCommissionAccrued),
      averageTransactionValue: 0,
    };
  }

  async settleCommission(merchantId: string, periodStart: Date, periodEnd: Date): Promise<{
    amount: number;
    settlementDate: Date;
  }> {
    const merchant = await this.findById(merchantId);
    const amount = Number(merchant.totalCommissionAccrued);
    
    merchant.lastSettlementDate = new Date();
    merchant.totalCommissionAccrued = 0;
    await this.repo.save(merchant);

    return {
      amount,
      settlementDate: new Date(),
    };
  }
}
