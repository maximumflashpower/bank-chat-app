import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SmbInvoiceDocument } from '../entities/smb-invoice-document.entity';
import { SmbInvoiceLineItem } from '../entities/smb-invoice-line-item.entity';
import { SmbContactParty } from '../entities/smb-contact-party.entity';
import { CreateInvoiceWithItemsDto } from '../dto/create-invoice-with-items.dto';
import { StockMovementService } from '../../smb-inventory/services/stock-movement.service';
import { InventoryTaxService } from '../../tax/services/inventory-tax.service';
import { CalculateInventorySalesTaxDto } from '../../tax/dto/calculate-inventory-sales-tax.dto';
import { InventoryTaxLineItemDto } from '../../tax/dto/inventory-tax-line-item.dto';

export interface InvoiceWithItemsResult {
  invoice: SmbInvoiceDocument;
  lineItems: SmbInvoiceLineItem[];
  stockMovementIds: string[];
  taxCalculationResultId?: string;
}

@Injectable()
export class SmbInventoryInvoiceService {
  constructor(
    @InjectRepository(SmbInvoiceDocument)
    private invoiceRepo: Repository<SmbInvoiceDocument>,
    @InjectRepository(SmbInvoiceLineItem)
    private lineItemRepo: Repository<SmbInvoiceLineItem>,
    @InjectRepository(SmbContactParty)
    private contactRepo: Repository<SmbContactParty>,
    private readonly stockMovementService: StockMovementService,
    private readonly inventoryTaxService: InventoryTaxService,
  ) {}

  async createInvoiceWithItems(dto: CreateInvoiceWithItemsDto): Promise<InvoiceWithItemsResult> {
    const customer = await this.contactRepo.findOne({ where: { id: dto.customerId } });
    if (!customer) throw new NotFoundException(`Customer ${dto.customerId} not found`);

    if (!dto.lineItems || dto.lineItems.length === 0) {
      throw new BadRequestException('Invoice must have at least one line item');
    }

    // 1. Pre-calcular subtotal provisional
    const subtotalNetAmount = dto.lineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const discountAbsoluteAmount = dto.discountPercentageApplied && dto.discountPercentageApplied > 0
      ? subtotalNetAmount * (dto.discountPercentageApplied / 100) : 0;
    const taxableBaseAmount = subtotalNetAmount - discountAbsoluteAmount;

    // 2. Crear invoice header con totales provisionales
    const invoiceNumber = await this.generateInvoiceNumber();
    const invoice = this.invoiceRepo.create({
      invoiceNumber,
      customerId: dto.customerId,
      issueDate: new Date(dto.issueDate),
      dueDate: new Date(dto.dueDate),
      subtotalNetAmount,
      discountPercentageApplied: dto.discountPercentageApplied,
      discountAbsoluteAmount: discountAbsoluteAmount || undefined,
      taxableBaseAmount,
      taxRateAppliedPercent: 0,
      taxAmountCalculated: 0,
      shippingHandlingFee: dto.shippingHandlingFee || undefined,
      grandTotalAmountDue: taxableBaseAmount + (dto.shippingHandlingFee || 0),
      currencyIsoCode: dto.currencyIsoCode || 'USD',
      status: 'draft',
      paidAmountTotalReceived: 0,
      remainingBalanceOwed: taxableBaseAmount + (dto.shippingHandlingFee || 0),
      createdByUserId: dto.createdByUserId,
    });
    const savedInvoice = await this.invoiceRepo.save(invoice);

    // 3. Crear stock movements y line items (ya con invoiceId)
    const stockMovementIds: string[] = [];
    const lineItems: SmbInvoiceLineItem[] = [];
    const taxLineItems: InventoryTaxLineItemDto[] = [];

    for (let i = 0; i < dto.lineItems.length; i++) {
      const item = dto.lineItems[i];

      const movement = await this.stockMovementService.sale(
        item.inventoryItemId,
        dto.warehouseId,
        item.quantity,
        dto.referenceDoc,
      );
      stockMovementIds.push(movement.id);

      const lineSubtotal = item.quantity * item.unitPrice;

      const lineItem = this.lineItemRepo.create({
        invoiceId: savedInvoice.id,
        inventoryItemId: item.inventoryItemId,
        sku: item.sku,
        itemName: item.itemName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineSubtotal,
        lineTotal: lineSubtotal,
        taxCategory: item.taxCategoryOverride || 'STANDARD',
        stockMovementId: movement.id,
        sortOrder: item.sortOrder ?? i,
      });
      const savedLine = await this.lineItemRepo.save(lineItem);
      lineItems.push(savedLine);

      taxLineItems.push({
        stockMovementId: movement.id,
        inventoryItemId: item.inventoryItemId,
        sku: item.sku,
        itemName: item.itemName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxCategoryOverride: item.taxCategoryOverride,
      });
    }

    // 4. Calcular impuestos si hay jurisdictionCode
    let taxCalcResultId: string | undefined;
    let taxAmount = 0;

    if (dto.jurisdictionCode) {
      const taxDto: CalculateInventorySalesTaxDto = {
        companyProfileId: dto.companyProfileId,
        currency: dto.currencyIsoCode || 'USD',
        jurisdictionCode: dto.jurisdictionCode,
        calculationMethod: 'exclusive',
        referenceDoc: dto.referenceDoc,
        lineItems: taxLineItems,
      };

      const taxResult = await this.inventoryTaxService.calculateSalesTax(taxDto);
      taxCalcResultId = taxResult.taxCalculationResult.id;
      taxAmount = taxResult.totalTaxAmount;

      for (let i = 0; i < lineItems.length; i++) {
        const taxLine = taxResult.lines[i];
        if (taxLine) {
          lineItems[i].taxRate = Number(taxLine.appliedRate);
          lineItems[i].taxAmount = Number(taxLine.taxAmount);
          lineItems[i].lineTotal = Number(lineItems[i].lineSubtotal) + Number(taxLine.taxAmount);
          lineItems[i].taxCalculationResultId = taxCalcResultId;
          await this.lineItemRepo.save(lineItems[i]);
        }
      }
    }

    // 5. Actualizar invoice con totales finales
    const shippingFee = dto.shippingHandlingFee || 0;
    const grandTotal = taxableBaseAmount + taxAmount + shippingFee;

    await this.invoiceRepo.update(savedInvoice.id, {
      taxRateAppliedPercent: taxableBaseAmount > 0 ? taxAmount / taxableBaseAmount : 0,
      taxAmountCalculated: taxAmount,
      grandTotalAmountDue: grandTotal,
      remainingBalanceOwed: grandTotal,
    });

    const finalInvoice = (await this.invoiceRepo.findOne({ where: { id: savedInvoice.id } }))!;

    await this.contactRepo.update(dto.customerId, {
      lastInvoiceDate: new Date(dto.issueDate),
    } as any);

    return {
      invoice: finalInvoice,
      lineItems,
      stockMovementIds,
      taxCalculationResultId: taxCalcResultId,
    };
  }

  async findInvoiceWithItems(invoiceId: string): Promise<{ invoice: SmbInvoiceDocument; lineItems: SmbInvoiceLineItem[] }> {
    const invoice = await this.invoiceRepo.findOne({ where: { id: invoiceId } });
    if (!invoice) throw new NotFoundException(`Invoice ${invoiceId} not found`);

    const lineItems = await this.lineItemRepo.find({
      where: { invoiceId },
      order: { sortOrder: 'ASC' },
    });

    return { invoice, lineItems };
  }

  async findLineItemsByInvoice(invoiceId: string): Promise<SmbInvoiceLineItem[]> {
    return this.lineItemRepo.find({
      where: { invoiceId },
      order: { sortOrder: 'ASC' },
    });
  }

  private async generateInvoiceNumber(): Promise<string> {
    const now = new Date();
    const yyyy = now.getFullYear();
    const seq = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    return `INV-${yyyy}-${seq}`;
  }
}
