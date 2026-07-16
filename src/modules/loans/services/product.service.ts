// src/modules/loans/services/product.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoanProduct } from '../entities/loan-product.entity.js';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(LoanProduct)
    private readonly repo: Repository<LoanProduct>,
  ) {}

  async findAll(activeOnly: boolean = true): Promise<LoanProduct[]> {
    return this.repo.find({ where: activeOnly ? { isActive: true } : {} });
  }

  async findById(id: string): Promise<LoanProduct> {
    const product = await this.repo.findOne({ where: { id } });
    if (!product) throw new NotFoundException(`Product ${id} not found`);
    return product;
  }

  async findByType(loanType: string, interestType?: string): Promise<LoanProduct[]> {
    const queryBuilder = this.repo.createQueryBuilder('p').where('p.loanType = :loanType', { loanType });
    if (interestType) {
      queryBuilder.andWhere('p.interestType = :interestType', { interestType });
    }
    return queryBuilder.getMany();
  }

  async calculateOriginationFee(product: LoanProduct, loanAmount: number): Promise<number> {
    let fee = 0;
    if (product.originationFeePct) {
      fee += loanAmount * (product.originationFeePct / 100);
    }
    if (product.originationFeeFlat) {
      fee += product.originationFeeFlat;
    }
    return fee;
  }

  async calculateLateFee(product: LoanProduct, paymentAmount: number, daysLate: number): Promise<number> {
    if (daysLate < product.lateFeeGraceDays) return 0;
    if (product.lateFeePct) {
      return paymentAmount * (product.lateFeePct / 100);
    }
    return 0;
  }
}
