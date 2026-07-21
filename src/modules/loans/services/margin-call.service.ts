import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, In } from 'typeorm';
import { MarginCall, MarginCallStatus, MarginCallAction } from '../entities/margin-call.entity';
import { TriggerMarginCallDto, ResolveMarginCallDto } from '../dto/margin-call.dto';
import { LoanMaster } from '../entities/loan-master.entity';
import { LoanCollateral } from '../entities/loan-collateral.entity';

@Injectable()
export class MarginCallService {
  private readonly logger = new Logger(MarginCallService.name);

  constructor(
    @InjectRepository(MarginCall)
    private readonly marginCallRepo: Repository<MarginCall>,
    @InjectRepository(LoanMaster)
    private readonly loanRepo: Repository<LoanMaster>,
    @InjectRepository(LoanCollateral)
    private readonly collateralRepo: Repository<LoanCollateral>,
  ) {}

  /**
   * L2-FIN-075: Monitor LTV ratios and trigger margin calls
   */
  async monitorLtvAndTriggerMarginCalls(): Promise<void> {
    this.logger.log('Running LTV monitoring job...');

    const collaterals = await this.collateralRepo.find({
      where: { status: 'registered' as any },
    });

    let triggers = 0;
    for (const collateral of collaterals) {
      if (!collateral.ltvRatio) continue;

      const ltv = Number(collateral.ltvRatio);
      const threshold = 80;

      if (ltv > threshold) {
        const loans = await this.loanRepo.find({
          where: { collateralId: collateral.id } as any,
        });

        for (const loan of loans) {
          await this.issueMarginCall(loan.id, collateral.id, ltv, threshold, collateral);
          triggers++;
        }
      }
    }

    this.logger.log(`LTV monitoring complete. ${triggers} margin calls triggered.`);
  }

  /**
   * L2-FIN-076: Issue Margin Call
   */
  async issueMarginCall(
    loanId: string,
    collateralId: string,
    currentLtv: number,
    thresholdLtv: number,
    collateral: LoanCollateral,
  ): Promise<MarginCall> {
    const marginCall = this.marginCallRepo.create({
      loanId,
      collateralId,
      currentLtv,
      thresholdLtv,
      actionRequired: MarginCallAction.PROVIDE_ADDITIONAL_COLLATERAL,
      deadline: this.calculateDeadline(),
      status: MarginCallStatus.ISSUED,
      collateralValueAtTrigger: Number(collateral.assessedValue),
      requiredTopupAmount: this.calculateRequiredTopup(currentLtv, thresholdLtv, Number(collateral.assessedValue)),
      issuedBy: 'system',
    });

    await this.marginCallRepo.save(marginCall);

    this.logger.warn(`Margin call issued for loan ${loanId}, collateral ${collateralId}. LTV: ${currentLtv.toFixed(2)}%`);

    return marginCall;
  }

  /**
   * Trigger margin call manually (API endpoint)
   */
  async manualTriggerMarginCall(dto: TriggerMarginCallDto): Promise<MarginCall> {
    const loan = await this.loanRepo.findOne({ where: { id: dto.loanId } as any });
    if (!loan) throw new NotFoundException(`Loan ${dto.loanId} not found`);

    const collateral = await this.collateralRepo.findOne({ where: { id: dto.collateralId } as any });
    if (!collateral) throw new NotFoundException(`Collateral ${dto.collateralId} not found`);

    return this.issueMarginCall(dto.loanId, dto.collateralId, dto.currentLtv, dto.thresholdLtv, collateral);
  }

  /**
   * L2-FIN-077: Acknowledge Margin Call
   */
  async acknowledgeMarginCall(marginCallId: string, acknowledgedBy: string): Promise<MarginCall> {
    const marginCall = await this.marginCallRepo.findOne({ where: { id: marginCallId } });
    if (!marginCall) throw new NotFoundException('Margin call not found');

    if (marginCall.status !== MarginCallStatus.ISSUED) {
      throw new BadRequestException(`Cannot acknowledge margin call with status ${marginCall.status}`);
    }

    marginCall.status = MarginCallStatus.ACKNOWLEDGED;
    marginCall.acknowledgedAt = new Date();
    marginCall.issuedBy = acknowledgedBy;

    return this.marginCallRepo.save(marginCall);
  }

  /**
   * L2-FIN-078: Resolve Margin Call
   */
  async resolveMarginCall(
    marginCallId: string,
    dto: ResolveMarginCallDto,
    resolvedBy: string,
  ): Promise<MarginCall> {
    const marginCall = await this.marginCallRepo.findOne({ where: { id: marginCallId } });
    if (!marginCall) throw new NotFoundException('Margin call not found');

    if (![MarginCallStatus.ACKNOWLEDGED, MarginCallStatus.ISSUED].includes(marginCall.status)) {
      throw new BadRequestException('Margin call must be acknowledged before resolution');
    }

    marginCall.status = MarginCallStatus.COMPLIANT;
    marginCall.resolution = dto.resolution;
    marginCall.resolvedAt = new Date();
    marginCall.issuedBy = resolvedBy;

    // Update collateral value
    await this.collateralRepo.update(marginCall.collateralId, {
      assessedValue: dto.newCollateralValue as any,
    });

    this.logger.log(`Margin call ${marginCallId} resolved. New collateral value: ${dto.newCollateralValue}`);

    return this.marginCallRepo.save(marginCall);
  }

  /**
   * Execute liquidation if margin call expires unresolved
   */
  async executeLiquidation(marginCallId: string, executedBy: string): Promise<MarginCall> {
    const marginCall = await this.marginCallRepo.findOne({ where: { id: marginCallId } });
    if (!marginCall) throw new NotFoundException('Margin call not found');

    if (marginCall.status !== MarginCallStatus.ACKNOWLEDGED) {
      throw new BadRequestException('Cannot liquidate without acknowledgment first');
    }

    marginCall.status = MarginCallStatus.EXECUTED;
    marginCall.resolution = 'Partial liquidation executed due to expired margin call';
    marginCall.resolvedAt = new Date();
    marginCall.issuedBy = executedBy;

    this.logger.error(`Executing liquidation for margin call ${marginCallId}`);

    return this.marginCallRepo.save(marginCall);
  }

  async getByLoanId(loanId: string): Promise<MarginCall[]> {
    return this.marginCallRepo.find({
      where: { loanId },
      order: { createdAt: 'DESC' },
    });
  }

  async getActiveMarginCalls(): Promise<MarginCall[]> {
    return this.marginCallRepo.find({
      where: { status: In([MarginCallStatus.ISSUED, MarginCallStatus.ACKNOWLEDGED]) },
    });
  }

  async getExpiredMarginCalls(): Promise<MarginCall[]> {
    return this.marginCallRepo.find({
      where: {
        deadline: LessThan(new Date()),
        status: In([MarginCallStatus.ISSUED, MarginCallStatus.ACKNOWLEDGED]),
      },
    });
  }

  // ========================================
  // Helper methods
  // ========================================

  private calculateDeadline(daysFromNow: number = 5): Date {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + daysFromNow);
    return deadline;
  }

  private calculateRequiredTopup(currentLtv: number, thresholdLtv: number, collateralValue: number): number {
    return Math.max(0, ((currentLtv - thresholdLtv) / 100) * collateralValue);
  }
}
