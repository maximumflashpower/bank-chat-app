import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryTaxLine } from '../entities/inventory-tax-line.entity';
import { TaxCalculationResult } from '../entities/tax-calculation-result.entity';
import { TaxJurisdictionRule } from '../entities/tax-jurisdiction-rule.entity';
import { TaxProductMapping } from '../entities/tax-product-mapping.entity';
import { CalculateInventorySalesTaxDto } from '../dto/calculate-inventory-sales-tax.dto';
import { InventoryTaxLineItemDto } from '../dto/inventory-tax-line-item.dto';

export interface InventorySalesTaxResult {
  taxCalculationResult: TaxCalculationResult;
  lines: InventoryTaxLine[];
  totalTaxableAmount: number;
  totalTaxAmount: number;
  totalAmount: number;
}

@Injectable()
export class InventoryTaxService {
  constructor(
    @InjectRepository(InventoryTaxLine)
    private lineRepo: Repository<InventoryTaxLine>,
    @InjectRepository(TaxCalculationResult)
    private calcRepo: Repository<TaxCalculationResult>,
    @InjectRepository(TaxJurisdictionRule)
    private jurisdictionRepo: Repository<TaxJurisdictionRule>,
    @InjectRepository(TaxProductMapping)
    private productMappingRepo: Repository<TaxProductMapping>,
  ) {}

  async calculateSalesTax(dto: CalculateInventorySalesTaxDto): Promise<InventorySalesTaxResult> {
    const jurisdiction = dto.jurisdictionCode
      ? await this.findJurisdictionRule(dto.jurisdictionCode)
      : null;

    const lines: InventoryTaxLine[] = [];
    let totalTaxableAmount = 0;
    let totalTaxAmount = 0;
    let totalAmount = 0;

    for (const item of dto.lineItems) {
      const line = await this.calculateLineItemTax(item, dto, jurisdiction);
      lines.push(line);
      totalTaxableAmount += Number(line.taxableAmount);
      totalTaxAmount += Number(line.taxAmount);
      totalAmount += Number(line.totalAmount);
    }

    const calcResult = this.calcRepo.create({
      currency: dto.currency,
      taxableAmount: totalTaxableAmount,
      taxAmount: totalTaxAmount,
      totalAmount: totalAmount,
      calculationMethod: dto.calculationMethod || 'exclusive',
      appliedRate: totalTaxableAmount > 0 ? totalTaxAmount / totalTaxableAmount : 0,
      jurisdictionCode: dto.jurisdictionCode,
      customerId: dto.customerId,
      referenceDoc: dto.referenceDoc,
      breakdownJson: {
        lineCount: lines.length,
        exemptLines: lines.filter(l => l.isExempt).length,
        reverseChargeLines: lines.filter(l => l.reverseCharge).length,
      },
    });
    const savedCalc = await this.calcRepo.save(calcResult);

    for (const line of lines) {
      line.taxCalculationResultId = savedCalc.id;
      await this.lineRepo.save(line);
    }

    return {
      taxCalculationResult: savedCalc,
      lines,
      totalTaxableAmount,
      totalTaxAmount,
      totalAmount,
    };
  }

  private async calculateLineItemTax(
    item: InventoryTaxLineItemDto,
    dto: CalculateInventorySalesTaxDto,
    jurisdiction: TaxJurisdictionRule | null,
  ): Promise<InventoryTaxLine> {
    const productMapping = await this.productMappingRepo.findOne({
      where: { productSku: item.sku },
    });

    const taxableAmount = item.quantity * item.unitPrice;

    const taxCategory = item.taxCategoryOverride
      || productMapping?.taxCategory
      || 'STANDARD';

    const { rate, isExempt, exemptionReason, reverseCharge } = this.resolveTaxRate(
      taxCategory,
      productMapping,
      jurisdiction,
    );

    const method = dto.calculationMethod || 'exclusive';

    let taxAmount: number;
    if (isExempt || rate === 0) {
      taxAmount = 0;
    } else if (method === 'inclusive') {
      taxAmount = taxableAmount - (taxableAmount / (1 + rate));
    } else {
      taxAmount = taxableAmount * rate;
    }

    const totalAmount = method === 'inclusive'
      ? taxableAmount
      : taxableAmount + taxAmount;

    const line = this.lineRepo.create({
      stockMovementId: item.stockMovementId,
      inventoryItemId: item.inventoryItemId,
      sku: item.sku,
      itemName: item.itemName,
      taxCategory,
      taxability: isExempt ? 'EXEMPT' : reverseCharge ? 'REVERSE_CHARGE' : rate === 0 ? 'ZERO_RATED' : 'TAXABLE',
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      taxableAmount,
      appliedRate: rate,
      taxAmount,
      totalAmount,
      currency: dto.currency,
      jurisdictionCode: dto.jurisdictionCode,
      isExempt,
      exemptionReason,
      reverseCharge,
      breakdown: {
        method,
        jurisdictionRate: jurisdiction?.rateStandard ?? 0,
        productMappingFound: !!productMapping,
        hsTariffCode: productMapping?.hsTariffCode,
        vatProductCode: productMapping?.vatProductCode,
      },
    });

    return this.lineRepo.save(line);
    }

  private resolveTaxRate(
    taxCategory: string,
    productMapping: TaxProductMapping | null,
    jurisdiction: TaxJurisdictionRule | null,
  ): { rate: number; isExempt: boolean; exemptionReason?: string; reverseCharge: boolean } {
    if (productMapping?.defaultTaxability === 'EXEMPT') {
      return { rate: 0, isExempt: true, exemptionReason: productMapping.notes || 'Product marked as exempt', reverseCharge: false };
    }

    if (productMapping?.reverseChargeApplicable) {
      return { rate: 0, isExempt: false, reverseCharge: true };
    }

    if (!jurisdiction) {
      return { rate: 0, isExempt: false, reverseCharge: false };
    }

    let rate = jurisdiction.rateStandard;

    if (taxCategory === 'REDUCED') {
      rate = jurisdiction.rateReduced;
    } else if (taxCategory === 'SUPER_REDUCED') {
      rate = jurisdiction.rateSuperReduced;
    }

    if (jurisdiction.expirationDate && new Date(jurisdiction.expirationDate) < new Date()) {
      rate = 0;
    }

    return { rate, isExempt: false, reverseCharge: false };
  }

  private async findJurisdictionRule(jurisdictionCode: string): Promise<TaxJurisdictionRule | null> {
    const rule = await this.jurisdictionRepo.findOne({
      where: { countryCode: jurisdictionCode.substring(0, 2), active: true },
    });
    return rule || null;
  }

  async syncProductMappings(skus: string[], countryCode?: string): Promise<{ synced: number; created: number; updated: number }> {
    let synced = 0;
    let created = 0;
    let updated = 0;

    for (const sku of skus) {
      const existing = await this.productMappingRepo.findOne({ where: { productSku: sku } });
      if (existing) {
        if (countryCode && existing.countryCodes?.includes(countryCode)) {
          updated++;
        }
        synced++;
      } else {
        const mapping = this.productMappingRepo.create({
          productSku: sku,
          productName: sku,
          effectiveFrom: new Date(),
          countryCodes: countryCode ? [countryCode] : [],
        });
        await this.productMappingRepo.save(mapping);
        created++;
        synced++;
      }
    }

    return { synced, created, updated };
  }

  async findTaxLinesByMovement(stockMovementId: string): Promise<InventoryTaxLine[]> {
    return this.lineRepo.find({ where: { stockMovementId } });
  }

  async findTaxLinesByCalculation(calcResultId: string): Promise<InventoryTaxLine[]> {
    return this.lineRepo.find({ where: { taxCalculationResultId: calcResultId } });
  }

  async getTaxSummary(companyProfileId: string, startDate?: Date, endDate?: Date): Promise<any> {
    const qb = this.lineRepo.createQueryBuilder('line')
      .leftJoin(TaxCalculationResult, 'calc', 'line."taxCalculationResultId" = calc.id')
      .where('calc.referenceDoc IS NOT NULL');

    if (startDate) qb.andWhere('line.createdAt >= :startDate', { startDate });
    if (endDate) qb.andWhere('line.createdAt <= :endDate', { endDate });

    const lines = await qb.getMany();

    const totalTaxable = lines.reduce((sum, l) => sum + Number(l.taxableAmount), 0);
    const totalTax = lines.reduce((sum, l) => sum + Number(l.taxAmount), 0);
    const totalAmount = lines.reduce((sum, l) => sum + Number(l.totalAmount), 0);

    const byCategory = new Map<string, { taxable: number; tax: number }>();
    for (const line of lines) {
      const cat = line.taxCategory || 'UNKNOWN';
      const existing = byCategory.get(cat) || { taxable: 0, tax: 0 };
      byCategory.set(cat, {
        taxable: existing.taxable + Number(line.taxableAmount),
        tax: existing.tax + Number(line.taxAmount),
      });
    }

    return {
      totalTaxableAmount: totalTaxable,
      totalTaxAmount: totalTax,
      totalAmount,
      lineCount: lines.length,
      exemptCount: lines.filter(l => l.isExempt).length,
      reverseChargeCount: lines.filter(l => l.reverseCharge).length,
      byCategory: Array.from(byCategory.entries()).map(([category, data]) => ({ category, ...data })),
    };
  }
}
