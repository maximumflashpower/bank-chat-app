import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SmbInventoryItem } from '../entities/smb-inventory-item.entity';
import { SmbStockLevel } from '../entities/smb-stock-level.entity';
import { SmbStockMovement } from '../entities/smb-stock-movement.entity';
import { SmbWarehouse } from '../entities/smb-warehouse.entity';

export interface InventorySummaryReport {
  totalItems: number;
  activeItems: number;
  totalWarehouses: number;
  totalStockValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalOnHandUnits: number;
}

export interface MovementHistoryReport {
  movementType: string;
  count: number;
  totalQuantity: number;
  totalCost: number;
}

export interface WarehouseDistributionReport {
  warehouseId: string;
  warehouseName: string;
  itemCount: number;
  totalUnits: number;
  totalValue: number;
}

@Injectable()
export class InventoryReportService {
  constructor(
    @InjectRepository(SmbInventoryItem)
    private itemRepo: Repository<SmbInventoryItem>,
    @InjectRepository(SmbStockLevel)
    private levelRepo: Repository<SmbStockLevel>,
    @InjectRepository(SmbStockMovement)
    private movementRepo: Repository<SmbStockMovement>,
    @InjectRepository(SmbWarehouse)
    private warehouseRepo: Repository<SmbWarehouse>,
  ) {}

  async generateSummary(companyProfileId: string): Promise<InventorySummaryReport> {
    const [items, warehouses] = await Promise.all([
      this.itemRepo.find({ where: { companyProfileId } }),
      this.warehouseRepo.find({ where: { companyProfileId } }),
    ]);

    const activeItems = items.filter(i => i.isActive).length;
    const itemIds = items.map(i => i.id);

    let totalStockValue = 0;
    let totalOnHandUnits = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    for (const itemId of itemIds) {
      const levels = await this.levelRepo.find({ where: { itemId } });
      const item = items.find(i => i.id === itemId);
      const onHand = levels.reduce((sum, l) => sum + Number(l.onHand), 0);

      totalOnHandUnits += onHand;
      totalStockValue += levels.reduce((sum, l) => sum + Number(l.totalValue), 0);

      if (onHand <= 0) {
        outOfStockCount++;
      } else if (item && onHand <= Number(item.reorderLevel ?? 0)) {
        lowStockCount++;
      }
    }

    return {
      totalItems: items.length,
      activeItems,
      totalWarehouses: warehouses.length,
      totalStockValue,
      lowStockCount,
      outOfStockCount,
      totalOnHandUnits,
    };
  }

  async generateMovementHistory(
    companyProfileId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<MovementHistoryReport[]> {
    const qb = this.movementRepo
      .createQueryBuilder('m')
      .leftJoin(SmbInventoryItem, 'item', 'item.id = m.itemId')
      .where('item.companyProfileId = :companyProfileId', { companyProfileId })
      .select('m.movementType', 'movementType')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(m.quantity)', 'totalQuantity')
      .addSelect('COALESCE(SUM(m.totalCost), 0)', 'totalCost')
      .groupBy('m.movementType');

    if (startDate) qb.andWhere('m.createdAt >= :startDate', { startDate });
    if (endDate) qb.andWhere('m.createdAt <= :endDate', { endDate });

    const raw = await qb.getRawMany();

    return raw.map(r => ({
      movementType: r.movementType,
      count: Number(r.count),
      totalQuantity: Number(r.totalQuantity),
      totalCost: Number(r.totalCost),
    }));
  }

  async generateWarehouseDistribution(companyProfileId: string): Promise<WarehouseDistributionReport[]> {
    const warehouses = await this.warehouseRepo.find({ where: { companyProfileId } });
    const reports: WarehouseDistributionReport[] = [];

    for (const wh of warehouses) {
      const levels = await this.levelRepo.find({ where: { warehouseId: wh.id } });
      const totalUnits = levels.reduce((sum, l) => sum + Number(l.onHand), 0);
      const totalValue = levels.reduce((sum, l) => sum + Number(l.totalValue), 0);

      reports.push({
        warehouseId: wh.id,
        warehouseName: wh.name,
        itemCount: levels.length,
        totalUnits,
        totalValue,
      });
    }

    return reports;
  }

  async generateAbcAnalysis(companyProfileId: string): Promise<{
    classA: { itemId: string; itemName: string; totalValue: number }[];
    classB: { itemId: string; itemName: string; totalValue: number }[];
    classC: { itemId: string; itemName: string; totalValue: number }[];
  }> {
    const items = await this.itemRepo.find({ where: { companyProfileId, isActive: true } });
    const itemValues: { itemId: string; itemName: string; totalValue: number }[] = [];

    for (const item of items) {
      const levels = await this.levelRepo.find({ where: { itemId: item.id } });
      const totalValue = levels.reduce((sum, l) => sum + Number(l.totalValue), 0);
      itemValues.push({ itemId: item.id, itemName: item.itemName, totalValue });
    }

    itemValues.sort((a, b) => b.totalValue - a.totalValue);

    const grandTotal = itemValues.reduce((sum, iv) => sum + iv.totalValue, 0);
    let cumulative = 0;

    const classA: typeof itemValues = [];
    const classB: typeof itemValues = [];
    const classC: typeof itemValues = [];

    for (const iv of itemValues) {
      cumulative += iv.totalValue;
      const cumulativePct = grandTotal > 0 ? (cumulative / grandTotal) * 100 : 0;

      if (cumulativePct <= 80) {
        classA.push(iv);
      } else if (cumulativePct <= 95) {
        classB.push(iv);
      } else {
        classC.push(iv);
      }
    }

    return { classA, classB, classC };
  }

  async generateAgingReport(companyProfileId: string): Promise<{
    fresh: { itemId: string; itemName: string; daysSinceMovement: number; value: number }[];
    aging: { itemId: string; itemName: string; daysSinceMovement: number; value: number }[];
    stale: { itemId: string; itemName: string; daysSinceMovement: number; value: number }[];
  }> {
    const items = await this.itemRepo.find({ where: { companyProfileId, isActive: true } });
    const fresh: any[] = [];
    const aging: any[] = [];
    const stale: any[] = [];

    const now = Date.now();

    for (const item of items) {
      const levels = await this.levelRepo.find({ where: { itemId: item.id } });
      for (const level of levels) {
        if (Number(level.onHand) <= 0 || !level.lastMovementDate) continue;

        const days = Math.floor((now - level.lastMovementDate.getTime()) / 86400000);
        const entry = {
          itemId: item.id,
          itemName: item.itemName,
          daysSinceMovement: days,
          value: Number(level.totalValue),
        };

        if (days <= 30) {
          fresh.push(entry);
        } else if (days <= 90) {
          aging.push(entry);
        } else {
          stale.push(entry);
        }
      }
    }

    return { fresh, aging, stale };
  }
}
