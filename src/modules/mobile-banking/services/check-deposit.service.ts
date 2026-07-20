import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, Not, In } from 'typeorm';
import { MobileCheckDeposit } from '../entities/mobile-check-deposit.entity';
import { DepositStatus } from '../enums/mobile.enums';

interface CheckDepositRequest {
  customerId: string;
  accountId: string;
  amount: number;
  checkNumber?: string;
  checkDate?: Date;
  payerName?: string;
  payerAccountNumber?: string;
  payerRoutingNumber?: string;
  frontImageUrl: string;
  backImageUrl: string;
  ocrData?: Record<string, any>;
  customerConfirmedAmount: boolean;
}

@Injectable()
export class CheckDepositService {
  private readonly DAILY_DEPOSIT_COUNT_LIMIT = 3;

  constructor(
    @InjectRepository(MobileCheckDeposit)
    private readonly repo: Repository<MobileCheckDeposit>,
  ) {}

  async submitDeposit(request: CheckDepositRequest): Promise<MobileCheckDeposit> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todaysDeposits = await this.repo.count({
      where: {
        customerId: request.customerId,
        submittedAt: MoreThan(todayStart),
        depositStatus: Not(In([DepositStatus.REJECTED])),
      },
    });

    if (todaysDeposits >= this.DAILY_DEPOSIT_COUNT_LIMIT) {
      throw new BadRequestException('Daily deposit limit reached (max 3)');
    }

    const depositReference = `MCD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 99999).toString().padStart(5, '0')}`;

    const deposit = new MobileCheckDeposit();
    deposit.depositReference = depositReference;
    deposit.customerId = request.customerId;
    deposit.accountId = request.accountId;
    deposit.checkAmount = request.amount;
    
    // Asignar condicionales solo si existe
    if (request.checkNumber) deposit.checkNumber = request.checkNumber;
    if (request.checkDate) deposit.checkDate = request.checkDate;
    if (request.payerName) deposit.payerName = request.payerName;
    if (request.payerAccountNumber) deposit.payerAccountNumber = request.payerAccountNumber;
    if (request.payerRoutingNumber) deposit.payerRoutingNumber = request.payerRoutingNumber;
    
    deposit.frontImageUrl = request.frontImageUrl;
    deposit.backImageUrl = request.backImageUrl;
    if (request.ocrData) deposit.ocrExtractionJson = request.ocrData as any;
    deposit.customerConfirmedAmount = request.customerConfirmedAmount;
    deposit.depositStatus = DepositStatus.SUBMITTED;

    return this.repo.save(deposit);
  }

  async getStatus(depositId: string, customerId: string): Promise<MobileCheckDeposit> {
    const deposit = await this.repo.findOne({
      where: { id: depositId, customerId },
    });

    if (!deposit) {
      throw new NotFoundException('Deposit not found');
    }

    return deposit;
  }

  async getDepositHistory(customerId: string): Promise<MobileCheckDeposit[]> {
    return this.repo.find({
      where: { customerId },
      order: { submittedAt: 'DESC' },
    });
  }

  async processDepositApproval(depositId: string, approved: boolean, reason?: string): Promise<MobileCheckDeposit> {
    const deposit = await this.repo.findOne({ where: { id: depositId } });

    if (!deposit) {
      throw new NotFoundException('Deposit not found');
    }

    if (approved) {
      deposit.depositStatus = DepositStatus.ACCEPTED;
      const holdDays = 2;
      deposit.holdUntilDate = new Date(Date.now() + holdDays * 24 * 60 * 60 * 1000);
    } else {
      deposit.depositStatus = DepositStatus.REJECTED;
      deposit.rejectionReason = reason ?? 'Rejected by reviewer';
    }

    return this.repo.save(deposit);
  }
}
