import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaxCalculationResult } from '../entities/tax-calculation-result.entity';
import { TaxDeclarationPeriod } from '../entities/tax-declaration-period.entity';

@Injectable()
export class TaxAuditService {
  constructor(
    @InjectRepository(TaxCalculationResult)
    private calcRepo: Repository<TaxCalculationResult>,
    @InjectRepository(TaxDeclarationPeriod)
    private declRepo: Repository<TaxDeclarationPeriod>,
  ) {}

  async getCalculationTrail(calculationId: string): Promise<TaxCalculationResult | null> {
    return this.calcRepo.findOne({ where: { id: calculationId } });
  }

  async getDeclarationBreakdown(declarationId: string): Promise<TaxDeclarationPeriod | null> {
    return this.declRepo.findOne({ where: { id: declarationId } });
  }

  async reconcileWithLedger(declarationId: string, ledgerBalances: Record<string, number>): Promise<{ reconciled: boolean; discrepancies: string[] }> {
    const declaration = await this.declRepo.findOne({ where: { id: declarationId } });
    if (!declaration) {
      return { reconciled: false, discrepancies: ['Declaration not found'] };
    }

    const discrepancies: string[] = [];
    
    if (declaration.outputTax && Math.abs(declaration.outputTax - (ledgerBalances.output_tax ?? 0)) > 0.01) {
      discrepancies.push(`Output tax mismatch: ${declaration.outputTax} vs ledger ${ledgerBalances.output_tax}`);
    }
    if (declaration.inputTax && Math.abs(declaration.inputTax - (ledgerBalances.input_tax ?? 0)) > 0.01) {
      discrepancies.push(`Input tax mismatch: ${declaration.inputTax} vs ledger ${ledgerBalances.input_tax}`);
    }

    return { reconciled: discrepancies.length === 0, discrepancies };
  }

  async getAuditSummary(countryCode: string, fiscalYear: number): Promise<{
    totalCalculations: number;
    totalDeclarations: number;
    totalTaxCollected: number;
    totalTaxPaid: number;
  }> {
    const calculations = await this.calcRepo.find();
    const declarations = await this.declRepo.find({ where: { countryCode } });

    return {
      totalCalculations: calculations.length,
      totalDeclarations: declarations.length,
      totalTaxCollected: calculations.reduce((sum, c) => sum + (c.taxAmount || 0), 0),
      totalTaxPaid: declarations.reduce((sum, d) => sum + (d.inputTax || 0), 0),
    };
  }
}
