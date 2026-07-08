import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SmbReportSnapshot } from '../entities/smb-report-snapshot.entity';
import { SmbInventoryItem } from '../../smb-inventory/entities/smb-inventory-item.entity';
import { SmbStockLevel } from '../../smb-inventory/entities/smb-stock-level.entity';
import { SmbStockMovement } from '../../smb-inventory/entities/smb-stock-movement.entity';
import { ValuationService } from '../../smb-inventory/services/valuation.service';

import { InventoryValuationReportDto } from '../dto/inventory-valuation-report.dto';
import { StockMovementHistoryDto } from '../dto/stock-movement-history.dto';
import { InventoryAgingDto } from '../dto/inventory-aging.dto';

@Injectable()
export class SmbReportingService {
  constructor(
    @InjectRepository(SmbReportSnapshot)
    private snapshotRepo: Repository<SmbReportSnapshot>,
    @InjectRepository(SmbInventoryItem)
    private itemRepo: Repository<SmbInventoryItem>,
    @InjectRepository(SmbStockLevel)
    private levelRepo: Repository<SmbStockLevel>,
    @InjectRepository(SmbStockMovement)
    private movementRepo: Repository<SmbStockMovement>,
    private valuationService: ValuationService,
  ) {}

  // 1. Inventory Valuation Report
  async getInventoryValuation(dto: InventoryValuationReportDto): Promise<any> {
    const itemWhere: any = { companyProfileId: dto.companyProfileId, isActive: true };
    const items = await this.itemRepo.find({ where: itemWhere });

    const results: any[] = [];

    for (const item of items) {
      const levelWhere: any = { itemId: item.id };
      if (dto.warehouseId) levelWhere.warehouseId = dto.warehouseId;

      const levels = await this.levelRepo.find({ where: levelWhere });
      const onHand = levels.reduce((sum, l) => sum + Number(l.onHand ?? 0), 0);
      const available = levels.reduce((sum, l) => sum + Number(l.available ?? 0), 0);
      const committed = levels.reduce((sum, l) => sum + Number(l.committed ?? 0), 0);
      const movingAvgCost = levels.length > 0 ? Number(levels[0].movingAvgCost ?? 0) : 0;
      const standardCost = Number(item.standardCost ?? 0);
      const sellingPrice = Number(item.sellingPrice ?? 0);

      const valueAtCost = onHand * standardCost;
      const valueAtAvgCost = onHand * movingAvgCost;
      const valueAtNRV = onHand * sellingPrice;

      results.push({
        itemId: item.id,
        sku: item.sku,
        itemName: item.itemName,
        category: item.category ?? 'Uncategorized',
        onHand,
        available,
        committed,
        standardCost,
        movingAvgCost,
        sellingPrice,
        valueAtCost,
        valueAtAvgCost,
        valueAtNRV,
        warehouseId: dto.warehouseId ?? 'all',
      });
    }

    const totals = {
      totalItems: results.length,
      totalUnitsOnHand: results.reduce((s, r) => s + r.onHand, 0),
      totalValueAtCost: results.reduce((s, r) => s + r.valueAtCost, 0),
      totalValueAtAvgCost: results.reduce((s, r) => s + r.valueAtAvgCost, 0),
      totalValueAtNRV: results.reduce((s, r) => s + r.valueAtNRV, 0),
    };

    return { items: results, totals, asOfDate: dto.asOfDate ?? new Date().toISOString().split('T')[0] };
  }

  // 2. Stock Movement History
  async getStockMovementHistory(dto: StockMovementHistoryDto): Promise<any> {
    const qb = this.movementRepo
      .createQueryBuilder('m')
      .where('m.company_profile_id = :companyId', { companyId: dto.companyProfileId });

    if (dto.itemId) {
      qb.andWhere('m.item_id = :itemId', { itemId: dto.itemId });
    }
    if (dto.warehouseId) {
      qb.andWhere('m.warehouse_id = :warehouseId', { warehouseId: dto.warehouseId });
    }
    if (dto.dateFrom) {
      qb.andWhere('m.created_at >= :dateFrom', { dateFrom: dto.dateFrom });
    }
    if (dto.dateTo) {
      qb.andWhere('m.created_at <= :dateTo', { dateTo: dto.dateTo });
    }

    qb.orderBy('m.created_at', 'DESC').limit(500);

    const movements = await qb.getMany();

    const summary = {
      totalMovements: movements.length,
      totalIn: movements.filter((m) => Number(m.quantity) > 0).reduce((s, m) => s + Number(m.quantity), 0),
      totalOut: movements.filter((m) => Number(m.quantity) < 0).reduce((s, m) => s + Math.abs(Number(m.quantity)), 0),
    };

    return { movements, summary, filters: dto };
  }

  // 3. Inventory Aging
  async getInventoryAging(dto: InventoryAgingDto): Promise<any> {
    const itemWhere: any = { companyProfileId: dto.companyProfileId, isActive: true };
    const items = await this.itemRepo.find({ where: itemWhere });

    const agingBuckets = {
      current: [] as any[],
      days30: [] as any[],
      days60: [] as any[],
      days90: [] as any[],
      days90Plus: [] as any[],
    };

    const now = new Date();
    const minDays = dto.minDays ?? 0;
    const maxDays = dto.maxDays ?? 999999;

    for (const item of items) {
      const levelWhere: any = { itemId: item.id };
      if (dto.warehouseId) levelWhere.warehouseId = dto.warehouseId;

      const levels = await this.levelRepo.find({ where: levelWhere });
      const onHand = levels.reduce((sum, l) => sum + Number(l.onHand ?? 0), 0);

      if (onHand === 0) continue;

      // Find earliest inbound movement for this item
      const earliestMovement = await this.movementRepo.findOne({
        where: { itemId: item.id },
        order: { createdAt: 'ASC' },
      });

      if (!earliestMovement) continue;

      const ageDays = Math.floor((now.getTime() - new Date(earliestMovement.createdAt).getTime()) / (1000 * 60 * 60 * 24));

      if (ageDays < minDays || ageDays > maxDays) continue;

      const entry = {
        itemId: item.id,
        sku: item.sku,
        itemName: item.itemName,
        onHand,
        ageDays,
        standardCost: Number(item.standardCost ?? 0),
        valueAtCost: onHand * Number(item.standardCost ?? 0),
      };

      if (ageDays <= 30) agingBuckets.current.push(entry);
      else if (ageDays <= 60) agingBuckets.days30.push(entry);
      else if (ageDays <= 90) agingBuckets.days60.push(entry);
      else if (ageDays <= 120) agingBuckets.days90.push(entry);
      else agingBuckets.days90Plus.push(entry);
    }

    const totals = {
      current: agingBuckets.current.reduce((s, e) => s + e.valueAtCost, 0),
      days30: agingBuckets.days30.reduce((s, e) => s + e.valueAtCost, 0),
      days60: agingBuckets.days60.reduce((s, e) => s + e.valueAtCost, 0),
      days90: agingBuckets.days90.reduce((s, e) => s + e.valueAtCost, 0),
      days90Plus: agingBuckets.days90Plus.reduce((s, e) => s + e.valueAtCost, 0),
    };

    return { agingBuckets, totals, generatedAt: new Date().toISOString() };
  }

  // 4. Inventory Summary (executive dashboard)
  async getInventorySummary(companyProfileId: string, warehouseId?: string): Promise<any> {
    const itemWhere: any = { companyProfileId, isActive: true };
    const items = await this.itemRepo.find({ where: itemWhere });

    let totalItems = items.length;
    let totalUnits = 0;
    let totalValueAtCost = 0;
    let lowStockItems: any[] = [];

    for (const item of items) {
      const levelWhere: any = { itemId: item.id };
      if (warehouseId) levelWhere.warehouseId = warehouseId;

      const levels = await this.levelRepo.find({ where: levelWhere });
      const onHand = levels.reduce((sum, l) => sum + Number(l.onHand ?? 0), 0);
      totalUnits += onHand;
      totalValueAtCost += onHand * Number(item.standardCost ?? 0);

      // Low stock alert: onHand below reorderPoint
      const reorderPoint = Number((item as any).reorderPoint ?? 0);
      if (reorderPoint > 0 && onHand <= reorderPoint) {
        lowStockItems.push({
          itemId: item.id,
          sku: item.sku,
          itemName: item.itemName,
          onHand,
          reorderPoint,
        });
      }
    }

    return {
      totalActiveItems: totalItems,
      totalUnitsOnHand: totalUnits,
      totalInventoryValueAtCost: totalValueAtCost,
      lowStockAlerts: lowStockItems,
      lowStockCount: lowStockItems.length,
      warehouseId: warehouseId ?? 'all',
      generatedAt: new Date().toISOString(),
    };
  }

  // 5. IAS 2 Report (delegates to existing method in StockMovementService)
  async getIas2Report(companyProfileId: string): Promise<any> {
    return this.valuationService.generateIas2Report(companyProfileId);
  }

  // 6. Save snapshot
  async saveSnapshot(
    reportType: string,
    companyProfileId: string,
    reportDate: string,
    reportData: Record<string, unknown>,
    warehouseId?: string,
    generatedByUserId?: string,
    jurisdictionCode?: string,
  ): Promise<SmbReportSnapshot> {
    const snapshot = this.snapshotRepo.create({
      reportType,
      companyProfileId,
      reportDate,
      reportData,
      warehouseId,
      generatedByUserId,
      jurisdictionCode,
      isValid: true,
    });
    return this.snapshotRepo.save(snapshot);
  }

  // 7. Get snapshot history
  async getSnapshotHistory(companyProfileId: string, reportType?: string): Promise<SmbReportSnapshot[]> {
    const where: any = { companyProfileId, isValid: true };
    if (reportType) where.reportType = reportType;
    return this.snapshotRepo.find({ where, order: { generatedAt: 'DESC' }, take: 50 });
  }
}
