// src/modules/loans/services/collateral.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoanCollateral } from '../entities/loan-collateral.entity.js';
import { RegisterCollateralDto } from '../dto/register-collateral.dto.js';
import { CollateralStatus, TitleVerificationStatus } from '../entities/loans.enums.js';

@Injectable()
export class CollateralService {
  constructor(
    @InjectRepository(LoanCollateral)
    private readonly repo: Repository<LoanCollateral>,
  ) {}

  async register(dto: RegisterCollateralDto): Promise<LoanCollateral> {
    const collateral = this.repo.create(dto);
    return this.repo.save(collateral);
  }

  async findById(id: string): Promise<LoanCollateral> {
    const collateral = await this.repo.findOne({ where: { id } });
    if (!collateral) throw new NotFoundException(`Collateral ${id} not found`);
    return collateral;
  }

  async findByLoan(loanId: string): Promise<LoanCollateral[]> {
    return this.repo.find({ where: { loanId } });
  }

  async calculateLtv(collateralId: string, loanAmount: number): Promise<number> {
    const collateral = await this.findById(collateralId);
    if (!collateral.assessedValue) return 0;
    return (loanAmount / collateral.assessedValue) * 100;
  }

  async release(collateralId: string): Promise<LoanCollateral> {
    const collateral = await this.findById(collateralId);
    collateral.status = CollateralStatus.RELEASED;
    collateral.releasedAt = new Date();
    return this.repo.save(collateral);
  }

  async updateTitleStatus(collateralId: string, status: 'clear' | 'pending' | 'has_liens'): Promise<LoanCollateral> {
    const collateral = await this.findById(collateralId);
    collateral.titleVerificationStatus = status as TitleVerificationStatus;
    return this.repo.save(collateral);
  }
}
