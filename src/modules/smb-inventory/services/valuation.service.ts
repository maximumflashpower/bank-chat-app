import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SmbStockLevel } from '../entities/smb-stock-level.entity';
import { SmbInventoryItem } from '../entities/smb-inventory-item.entity';
import { SmbStockMovement } from '../entities/smb-stock-movement.entity';

export interface ValuationReport {
  itemId: string;
  itemName: string;
  sku: string;
  valuationMethod: string;
  totalQuantity: number;
  totalValue: number;
  avgUnitCost: number;
  byWarehouse: { warehouseId: string; onHand: number; value: number }[];
}

export interface CogsReport {
  itemId: string;
  itemName: string;
  quantitySold: number;
  cogsTotal: number;
  avgCogsPerUnit: number;
}

export interface VarianceReport {
  itemId: string;
  itemName: string;
  warehouseId: string;
  recordedQty: number;
  expectedQty: number;
  varianceQty: number;
  varianceCost: number;
}

@Injectable()
export class ValuationService {
  constructor(
    @InjectRepository(SmbStockLevel)
    private levelRepo: Repository<SmbStockLevel>,
    @InjectRepository(SmbInventoryItem)
    private itemRepo: Repository<SmbInventoryItem>,
    @InjectRepository(SmbStockMovement)
    private movementRepo: Repository<SmbStockMovement>,
  ) {}

  async generateValuationReport(companyProfileId: string): Promise<ValuationReport[]> {
    const items = await this.itemRepo.find({ where: { companyProfileId, isActive: true } });
    const reports: ValuationReport[] = [];

    for (const item of items) {
      const levels = await this.levelRepo.find({ where: { itemId: item.id } });
      const totalQuantity = levels.reduce((sum, l) => sum + Number(l.onHand), 0);
      const totalValue = levels.reduce((sum, l) => sum + Number(l.totalValue), 0);
      const avgUnitCost = totalQuantity > 0 ? totalValue / totalQuantity : 0;

      reports.push({
        itemId: item.id,
        itemName: item.itemName,
        sku: item.sku,
        valuationMethod: item.valuationMethod,
        totalQuantity,
        totalValue,
        avgUnitCost,
        byWarehouse: levels.map(l => ({
          warehouseId: l.warehouseId,
          onHand: Number(l.onHand),
          value: Number(l.totalValue),
        })),
      });
    }

    return reports;
  }

  async calculateCogs(companyProfileId: string, startDate?: Date, endDate?: Date): Promise<CogsReport[]> {
    const items = await this.itemRepo.find({ where: { companyProfileId, isActive: true } });
    const reports: CogsReport[] = [];

    for (const item of items) {
      const qb = this.movementRepo.createQueryBuilder('m')
        .where('m.itemId = :itemId', { itemId: item.id })
        .andWhere('m.movementType = :type', { type: 'SALE' });

      if (startDate) qb.andWhere('m.createdAt >= :startDate', { startDate });
      if (endDate) qb.andWhere('m.createdAt <= :endDate', { endDate });

      const movements = await qb.getMany();
      const quantitySold = movements.reduce((sum, m) => sum + Number(m.quantity), 0);
      const cogsTotal = movements.reduce((sum, m) => sum + Number(m.totalCost ?? 0), 0);

      reports.push({
        itemId: item.id,
        itemName: item.itemName,
        quantitySold,
        cogsTotal,
        avgCogsPerUnit: quantitySold > 0 ? cogsTotal / quantitySold : 0,
      });
    }

    return reports;
  }

  async generateVarianceReport(companyProfileId: string): Promise<VarianceReport[]> {
    const adjustments = await this.movementRepo
      .createQueryBuilder('m')
      .leftJoin(SmbInventoryItem, 'item', 'item.id = m.itemId')
      .where('item.companyProfileId = :companyProfileId', { companyProfileId })
      .andWhere('m.movementType = :type', { type: 'ADJUSTMENT' })
      .getMany();

    return adjustments.map(adj => ({
      itemId: adj.itemId,
      itemName: '',
      warehouseId: adj.warehouseId,
      recordedQty: Number(adj.quantity),
      expectedQty: 0,
      varianceQty: Number(adj.quantity),
      varianceCost: Number(adj.totalCost ?? 0),
    }));
  }

  async recalculateMovingAvg(itemId: string, warehouseId: string): Promise<void> {
    const movements = await this.movementRepo.find({
      where: { itemId, warehouseId },
      order: { createdAt: 'ASC' },
    });

    let onHand = 0;
    let movingAvgCost = 0;

    for (const m of movements) {
      const qty = Number(m.quantity);
      const cost = Number(m.unitCost ?? 0);

      if (qty > 0) {
        const totalExisting = onHand * movingAvgCost;
        const totalNew = qty * cost;
        onHand += qty;
        movingAvgCost = onHand > 0 ? (totalExisting + totalNew) / onHand : cost;
      } else {
        onHand += qty;
      }
    }

    const level = await this.levelRepo.findOne({ where: { itemId, warehouseId } });
    if (level) {
      level.movingAvgCost = movingAvgCost;
      level.onHand = onHand;
      level.totalValue = onHand * movingAvgCost;
      await this.levelRepo.save(level);
    }
  }

  async generateIas2Report(companyProfileId: string): Promise<{
    inventoryAtCost: number;
    inventoryAtNetRealizable: number;
    writeDownRequired: number;
    byCategory: { category: string; cost: number; value: number }[];
  }> {
    const items = await this.itemRepo.find({ where: { companyProfileId, isActive: true } });
    let inventoryAtCost = 0;
    let inventoryAtNetRealizable = 0;
    const categoryMap = new Map<string, { cost: number; value: number }>();

    for (const item of items) {
      const levels = await this.levelRepo.find({ where: { itemId: item.id } });
      const qty = levels.reduce((sum, l) => sum + Number(l.onHand), 0);
      const cost = qty * Number(item.standardCost ?? 0);
      const nrv = qty * Number(item.sellingPrice ?? 0);

      inventoryAtCost += cost;
      inventoryAtNetRealizable += nrv;

      const cat = item.category ?? 'Uncategorized';
      const existing = categoryMap.get(cat) ?? { cost: 0, value: 0 };
      categoryMap.set(cat, { cost: existing.cost + cost, value: existing.value + nrv });
    }

    return {
      inventoryAtCost,
      inventoryAtNetRealizable,
      writeDownRequired: Math.max(0, inventoryAtCost - inventoryAtNetRealizable),
      byCategory: Array.from(categoryMap.entries()).map(([category, v]) => ({ category, ...v })),
    };
  }
}
