import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { RetailDepositProduct, DepositProductType, DepositProductStatus } from '../entities/retail-deposit-product.entity';

@Injectable()
export class DepositProductService {
  private readonly logger = new Logger(DepositProductService.name);

  constructor(
    @InjectRepository(RetailDepositProduct)
    private readonly repo: Repository<RetailDepositProduct>,
  ) {}

  async createCD(data: Partial<RetailDepositProduct>): Promise<RetailDepositProduct> {
    const termMonths = data.termMonths || 12;
    const maturityDate = data.maturityDate || this.calculateMaturityDate(termMonths);
    const entity = this.repo.create({
      accountId: data.accountId!,
      productType: data.productType!,
      principalAmount: data.principalAmount!,
      interestRate: data.interestRate!,
      annualPercentageYield: data.annualPercentageYield,
      termMonths,
      maturityDate,
      interestPayoutFrequency: data.interestPayoutFrequency!,
      interestCompoundFrequency: data.interestCompoundFrequency,
      interestPayoutAccountId: data.interestPayoutAccountId,
      earlyWithdrawalPenaltyType: data.earlyWithdrawalPenaltyType,
      earlyWithdrawalPenaltyValue: data.earlyWithdrawalPenaltyValue,
      gracePeriodDays: data.gracePeriodDays || 7,
      autoRenewEnabled: data.autoRenewEnabled || false,
      autoRenewTermMonths: data.autoRenewTermMonths,
      renewalInstructions: data.renewalInstructions,
      status: DepositProductStatus.ACTIVE,
    });
    const saved = await this.repo.save(entity);
    this.logger.log(`CD created: principal=${saved.principalAmount}, rate=${Number(saved.interestRate)*100}%, term=${saved.termMonths}mo`);
    return saved;
  }

  async findById(id: string): Promise<RetailDepositProduct> {
    const product = await this.repo.findOne({ where: { id } });
    if (!product) throw new NotFoundException(`CD ${id} not found`);
    return product;
  }

  async findByAccount(accountId: string): Promise<RetailDepositProduct[]> {
    return this.repo.find({ where: { accountId }, order: { maturityDate: 'ASC' } });
  }

  calculateMaturityDate(termMonths: number): Date {
    const maturity = new Date();
    maturity.setMonth(maturity.getMonth() + termMonths);
    return maturity;
  }

  async calculateInterest(principal: number, rate: number, years: number, compoundMethod: string): Promise<number> {
    if (compoundMethod === 'simple') {
      return principal * rate * years;
    }
    const n = compoundMethod.includes('daily') ? 365 : 12;
    return principal * Math.pow(1 + rate / n, n * years) - principal;
  }

  async checkMaturingSoon(daysThreshold: number = 15): Promise<{ maturing: number; products: RetailDepositProduct[] }> {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() + daysThreshold);
    const maturing = await this.repo.find({
      where: { maturityDate: LessThanOrEqual(threshold), status: DepositProductStatus.ACTIVE },
    });
    for (const product of maturing) {
      if (!product.maturityNoticeSentAt) {
        product.maturityNoticeSentAt = new Date();
        await this.repo.save(product);
      }
    }
    this.logger.log(`Maturity check: ${maturing.length} CDs maturing within ${daysThreshold} days`);
    return { maturing: maturing.length, products: maturing };
  }

  async renewCd(cdId: string, renewalTermMonths?: number): Promise<RetailDepositProduct> {
    const cd = await this.findById(cdId);
    cd.status = DepositProductStatus.RENEWED;
    if (cd.autoRenewEnabled && renewalTermMonths) {
      const newCd = this.repo.create({
        accountId: cd.accountId,
        productType: cd.productType,
        principalAmount: cd.principalAmount,
        interestRate: cd.interestRate,
        annualPercentageYield: cd.annualPercentageYield,
        termMonths: renewalTermMonths,
        maturityDate: this.calculateMaturityDate(renewalTermMonths),
        interestPayoutFrequency: cd.interestPayoutFrequency,
        interestCompoundFrequency: cd.interestCompoundFrequency,
        interestPayoutAccountId: cd.interestPayoutAccountId,
        earlyWithdrawalPenaltyType: cd.earlyWithdrawalPenaltyType,
        earlyWithdrawalPenaltyValue: cd.earlyWithdrawalPenaltyValue,
        gracePeriodDays: cd.gracePeriodDays,
        autoRenewEnabled: cd.autoRenewEnabled,
        autoRenewTermMonths: cd.autoRenewTermMonths,
        renewalInstructions: cd.renewalInstructions,
        status: DepositProductStatus.ACTIVE,
      });
      return this.repo.save(newCd);
    }
    return this.repo.save(cd);
  }

  async earlyWithdrawal(cdId: string): Promise<{ principal: number; penalty: number; net: number }> {
    const cd = await this.findById(cdId);
    if (cd.status !== DepositProductStatus.ACTIVE) {
      throw new BadRequestException(`CD ${cdId} is not active`);
    }
    const principal = Number(cd.principalAmount);
    const interestEarned = await this.calculateInterest(
      principal, Number(cd.interestRate), 1, cd.interestCompoundFrequency || 'simple',
    );
    let penalty = 0;
    if (cd.earlyWithdrawalPenaltyType === 'fixed_amount') {
      penalty = Number(cd.earlyWithdrawalPenaltyValue || 0);
    } else if (cd.earlyWithdrawalPenaltyType === 'months_interest') {
      penalty = interestEarned * (Number(cd.termMonths) / 12);
    } else if (cd.earlyWithdrawalPenaltyType === 'percentage') {
      penalty = interestEarned * (Number(cd.earlyWithdrawalPenaltyValue || 0) / 100);
    }
    const net = principal + interestEarned - penalty;
    cd.status = DepositProductStatus.WITHDRAWN;
    await this.repo.save(cd);
    this.logger.log(`Early withdrawal CD ${cdId}: principal=${principal}, penalty=${penalty}, net=${net}`);
    return { principal, penalty, net };
  }

  async matureCd(cdId: string): Promise<RetailDepositProduct> {
    const cd = await this.findById(cdId);
    cd.status = DepositProductStatus.MATURED;
    await this.repo.save(cd);
    this.logger.log(`CD ${cdId} matured`);
    return cd;
  }

  async getProjectedInterest(cdId: string): Promise<{ projectedInterest: number; projectedTotal: number }> {
    const cd = await this.findById(cdId);
    const years = cd.termMonths / 12;
    const interest = await this.calculateInterest(
      Number(cd.principalAmount), Number(cd.interestRate), years, cd.interestCompoundFrequency || 'simple',
    );
    return { projectedInterest: interest, projectedTotal: Number(cd.principalAmount) + interest };
  }

  async listAvailableProducts(_type: DepositProductType): Promise<Array<{ term: number; rate: number; apy: number }>> {
    return [
      { term: 3, rate: 0.04, apy: 0.0408 },
      { term: 6, rate: 0.045, apy: 0.0458 },
      { term: 12, rate: 0.05, apy: 0.0512 },
      { term: 24, rate: 0.055, apy: 0.0565 },
      { term: 36, rate: 0.06, apy: 0.0618 },
    ];
  }
}
