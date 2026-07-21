import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoanRestructure, RestructureStatus } from '../entities/loan-restructure.entity';
import { RestructureLoanDto } from '../dto/restructure-loan.dto';
import { LoanMaster } from '../entities/loan-master.entity';
import { LoanAmortizationSchedule } from '../entities/loan-amortization-schedule.entity';

@Injectable()
export class LoanRestructureService {
  private readonly logger = new Logger(LoanRestructureService.name);

  constructor(
    @InjectRepository(LoanRestructure)
    private readonly restructureRepo: Repository<LoanRestructure>,
    @InjectRepository(LoanMaster)
    private readonly loanRepo: Repository<LoanMaster>,
    @InjectRepository(LoanAmortizationSchedule)
    private readonly scheduleRepo: Repository<LoanAmortizationSchedule>,
  ) {}

  async proposeRestructure(loanId: string, dto: RestructureLoanDto): Promise<LoanRestructure> {
    const loan = await this.loanRepo.findOne({ where: { id: loanId } as any });
    if (!loan) throw new NotFoundException(`Loan ${loanId} not found`);

    const oldTerm = (loan as any).termMonths || (loan as any).originalTerm || null;
    const oldRate = (loan as any).interestRate || (loan as any).annualInterestRate || null;
    const oldPayment = await this.calculateCurrentPayment(loanId);
    const principal = (loan as any).principalAmount || (loan as any).originalPrincipal || 0;

    const restructureData: any = {
      loanId,
      reason: dto.reason || 'Voluntary restructuring request',
      oldTerm,
      newTerm: dto.newTermMonths,
      oldRate,
      newRate: dto.newInterestRate,
      oldPayment,
      newPayment: this.calculateNewPayment(dto, principal),
      status: RestructureStatus.PENDING,
    };

    if (dto.effectiveDate) {
      restructureData.effectiveDate = dto.effectiveDate;
    }

    const restructure = this.restructureRepo.create(restructureData);
    const saved = await this.restructureRepo.save(restructure);
    
    this.logger.log(`Restructure proposed for loan ${loanId}`);
    return saved as any;
  }

  async approveRestructure(restructureId: string, approvedBy: string, conditions?: Record<string, any>): Promise<LoanRestructure> {
    const restructure = await this.restructureRepo.findOne({ where: { id: restructureId } });
    if (!restructure) throw new NotFoundException('Restructure not found');

    if (restructure.status !== RestructureStatus.PENDING) {
      throw new BadRequestException(`Cannot approve restructure with status ${restructure.status}`);
    }

    restructure.status = RestructureStatus.APPROVED;
    restructure.approvedBy = approvedBy;
    restructure.decidedAt = new Date();
    if (conditions) restructure.approvalConditions = conditions;

    const saved = await this.restructureRepo.save(restructure);
    this.logger.log(`Restructure ${restructureId} approved`);
    return saved as any;
  }

  async rejectRestructure(restructureId: string, rejectedBy: string, reason: string): Promise<LoanRestructure> {
    const restructure = await this.restructureRepo.findOne({ where: { id: restructureId } });
    if (!restructure) throw new NotFoundException('Restructure not found');

    if (restructure.status !== RestructureStatus.PENDING) {
      throw new BadRequestException(`Cannot reject restructure with status ${restructure.status}`);
    }

    restructure.status = RestructureStatus.REJECTED;
    restructure.approvedBy = rejectedBy;
    restructure.rejectionReason = reason;
    restructure.decidedAt = new Date();

    const saved = await this.restructureRepo.save(restructure);
    this.logger.log(`Restructure ${restructureId} rejected: ${reason}`);
    return saved as any;
  }

  async applyRestructure(restructureId: string): Promise<LoanRestructure> {
    const restructure = await this.restructureRepo.findOne({ where: { id: restructureId } });
    if (!restructure) throw new NotFoundException('Restructure not found');

    if (restructure.status !== RestructureStatus.APPROVED) {
      throw new BadRequestException('Restructure must be approved before applying');
    }

    const updateData: Record<string, any> = {};
    if (restructure.newTerm) updateData.termMonths = restructure.newTerm;
    if (restructure.newRate) updateData.interestRate = restructure.newRate;

    await this.loanRepo.update(restructure.loanId, updateData);

    restructure.status = RestructureStatus.EFFECTIVE;
    restructure.effectiveDate = new Date();

    const saved = await this.restructureRepo.save(restructure);
    this.logger.log(`Restructure ${restructureId} applied to loan ${restructure.loanId}`);
    return saved as any;
  }

  async getByLoanId(loanId: string): Promise<LoanRestructure[]> {
    return this.restructureRepo.find({ where: { loanId }, order: { createdAt: 'DESC' } });
  }

  async getPendingRestructures(): Promise<LoanRestructure[]> {
    return this.restructureRepo.find({ where: { status: RestructureStatus.PENDING }, order: { createdAt: 'ASC' } });
  }

  private async calculateCurrentPayment(loanId: string): Promise<number | null> {
    const latestSchedule = await this.scheduleRepo.findOne({ where: { loanId } as any, order: { createdAt: 'DESC' } });
    if (latestSchedule && (latestSchedule as any).paymentAmount) {
      return Number((latestSchedule as any).paymentAmount);
    }
    return null;
  }

  private calculateNewPayment(dto: RestructureLoanDto, principal: number): number {
    if (!principal || principal <= 0) return 0;
    const monthlyRate = (dto.newInterestRate ?? dto.newRate ?? 0) / 100 / 12;
    const n = dto.newTermMonths ?? 12;
    if (monthlyRate === 0) return principal / Math.max(n, 1);
    const payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1);
    return Math.round(payment * 100) / 100;
  }
}
