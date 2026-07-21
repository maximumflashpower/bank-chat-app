import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoanMaster } from '../entities/loan-master.entity';

@Injectable()
export class EscrowService {
  constructor(
    @InjectRepository(LoanMaster)
    private repo: Repository<LoanMaster>,
  ) {}

  async calculateEscrowPayment(loanId: string): Promise<{ annualTax: number; annualInsurance: number; monthlyEscrow: number }> {
    const loan = await this.repo.findOne({ where: { id: loanId } });
    if (!loan) throw new NotFoundException(`Loan ${loanId} not found`);
    
    // Stub calculation — in production, would fetch tax/insurance from external sources
    const annualTax = loan.principalAmount * 0.012; // 1.2% property tax
    const annualInsurance = loan.principalAmount * 0.003; // 0.3% insurance
    const monthlyEscrow = (annualTax + annualInsurance) / 12;
    
    return { annualTax, annualInsurance, monthlyEscrow };
  }

  async analyzeEscrowShortage(loanId: string): Promise<{ shortage?: number; recommendation: string }> {
    const loan = await this.repo.findOne({ where: { id: loanId } });
    if (!loan) throw new NotFoundException(`Loan ${loanId} not found`);
    
    // Stub analysis
    const shortage = Math.random() < 0.3 ? 500 : 0;
    return { 
      shortage: shortage || undefined,
      recommendation: shortage ? 'Increase monthly escrow payment' : 'No adjustment needed'
    };
  }

  async projectEscrowBalance(loanId: string): Promise<{ projectedBalance: number; projectionDate: Date }> {
    const loan = await this.repo.findOne({ where: { id: loanId } });
    if (!loan) throw new NotFoundException(`Loan ${loanId} not found`);
    
    const escrowPayment = await this.calculateEscrowPayment(loanId);
    const projectedBalance = escrowPayment.monthlyEscrow * 6; // 6 month buffer
    const projectionDate = new Date();
    projectionDate.setMonth(projectionDate.getMonth() + 6);
    
    return { projectedBalance, projectionDate };
  }

  async manageAnnualEscrowAnalysis(loanId: string): Promise<{ analysis: any; adjustments: any }> {
    const loan = await this.repo.findOne({ where: { id: loanId } });
    if (!loan) throw new NotFoundException(`Loan ${loanId} not found`);
    
    const escrowPayment = await this.calculateEscrowPayment(loanId);
    const analysis = {
      loanId,
      annualTax: escrowPayment.annualTax,
      annualInsurance: escrowPayment.annualInsurance,
      previousBalance: 0,
      shortage: 0,
      surplus: 0,
      analysisDate: new Date(),
    };
    
    const adjustments = {
      newMonthlyEscrow: escrowPayment.monthlyEscrow,
      effectiveDate: new Date(),
      refundDue: 0,
      deficiencyPayment: 0,
    };
    
    return { analysis, adjustments };
  }

  async adjustEscrowPayment(loanId: string, newMonthlyAmount: number, reason: string): Promise<{ success: boolean; message: string }> {
    const loan = await this.repo.findOne({ where: { id: loanId } });
    if (!loan) throw new NotFoundException(`Loan ${loanId} not found`);
    
    // Stub: would update loan records
    return { 
      success: true, 
      message: `Escrow payment adjusted to $${newMonthlyAmount.toFixed(2)} for reason: ${reason}`
    };
  }

  async trackTaxBillReceived(loanId: string, taxBillAmount: number, taxYear: number): Promise<void> {
    const loan = await this.repo.findOne({ where: { id: loanId } });
    if (!loan) throw new NotFoundException(`Loan ${loanId} not found`);
    // Stub: log receipt
    console.log(`Tax bill received for ${loanId}: $${taxBillAmount} for year ${taxYear}`);
  }

  async trackInsurancePremiumPaid(loanId: string, premiumAmount: number, coveragePeriod: string): Promise<void> {
    const loan = await this.repo.findOne({ where: { id: loanId } });
    if (!loan) throw new NotFoundException(`Loan ${loanId} not found`);
    // Stub: log payment
    console.log(`Insurance premium paid for ${loanId}: $${premiumAmount} period: ${coveragePeriod}`);
  }

  async generateEscrowStatement(loanId: string, startDate: Date, endDate: Date): Promise<{ statement: any }> {
    const loan = await this.repo.findOne({ where: { id: loanId } });
    if (!loan) throw new NotFoundException(`Loan ${loanId} not found`);
    
    const escrowPayment = await this.calculateEscrowPayment(loanId);
    
    const statement = {
      loanId,
      statementPeriod: { startDate, endDate },
      beginningBalance: 0,
      deposits: escrowPayment.monthlyEscrow * ((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30)),
      disbursements: escrowPayment.annualTax + escrowPayment.annualInsurance,
      endingBalance: 0,
      activities: [],
    };
    
    return { statement };
  }

  async handleEscrowDeficiency(loanId: string, deficiencyAmount: number): Promise<{ repaymentPlan: any }> {
    const loan = await this.repo.findOne({ where: { id: loanId } });
    if (!loan) throw new NotFoundException(`Loan ${loanId} not found`);
    
    const repaymentPlan = {
      deficiencyAmount,
      monthlyIncrease: deficiencyAmount / 12,
      durationMonths: 12,
      startDate: new Date(),
    };
    
    return { repaymentPlan };
  }

  async processEscrowRefund(loanId: string, refundAmount: number): Promise<{ success: boolean; refundId: string }> {
    const loan = await this.repo.findOne({ where: { id: loanId } });
    if (!loan) throw new NotFoundException(`Loan ${loanId} not found`);
    
    const refundId = `REF-${Date.now()}`;
    console.log(`Processing escrow refund ${refundId} for ${loanId}: $${refundAmount}`);
    
    return { success: true, refundId };
  }
}
