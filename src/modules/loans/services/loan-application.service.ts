// src/modules/loans/services/loan-application.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoanApplication } from '../entities/loan-application.entity.js';
import { CreateLoanApplicationDto } from '../dto/create-loan-application.dto.js';
import { DecisionStatus } from '../entities/loans.enums.js';

@Injectable()
export class LoanApplicationService {
  constructor(
    @InjectRepository(LoanApplication)
    private readonly repo: Repository<LoanApplication>,
  ) {}

  async create(dto: CreateLoanApplicationDto): Promise<LoanApplication> {
    const applicationNumber = `APP-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(Math.random()*100000).toString().padStart(5,'0')}`;
    const application = this.repo.create({
      ...dto,
      applicationNumber,
      decisionStatus: DecisionStatus.PENDING,
    });
    return this.repo.save(application);
  }

  async findById(id: string): Promise<LoanApplication> {
    const application = await this.repo.findOne({ where: { id } });
    if (!application) throw new NotFoundException(`Application ${id} not found`);
    return application;
  }

  async findByCustomer(customerId: string): Promise<LoanApplication[]> {
    return this.repo.find({ where: { customerId } });
  }

  async submitApplication(id: string): Promise<LoanApplication> {
    const application = await this.findById(id);
    application.submittedAt = new Date();
    return this.repo.save(application);
  }

  async updateDecision(
    id: string,
    status: string,
    approvedAmount?: number,
    approvedRate?: number,
    reason?: string,
  ): Promise<LoanApplication> {
    const application = await this.findById(id);
    application.decisionStatus = status as DecisionStatus;
    application.approvedAmount = approvedAmount || null;
    application.approvedRate = approvedRate || null;
    application.decisionReason = reason || null;
    application.decidedAt = new Date();
    return this.repo.save(application);
  }

  async acceptOffer(id: string, acceptCounteroffer: boolean = false): Promise<LoanApplication> {
    const application = await this.findById(id);
    if (acceptCounteroffer && application.counterofferAmount) {
      application.approvedAmount = application.counterofferAmount;
      application.approvedRate = application.counterofferRate;
    }
    application.eSignedAt = new Date();
    return this.repo.save(application);
  }
}
