import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SmbInventoryItem } from '../entities/smb-inventory-item.entity';
import { SmbStockLevel } from '../entities/smb-stock-level.entity';
import { GeneratePoDto } from '../dto/generate-po.dto';

export interface ReorderRecommendation {
  itemId: string;
  itemName: string;
  sku: string;
  warehouseId: string;
  currentStock: number;
  reorderLevel: number;
  reorderQuantity: number;
  recommendedQty: number;
  unitCost: number;
  estimatedCost: number;
  leadTimeDays: number;
  supplierRef?: string;
}

@Injectable()
export class ReorderService {
  constructor(
    @InjectRepository(SmbInventoryItem)
    private itemRepo: Repository<SmbInventoryItem>,
    @InjectRepository(SmbStockLevel)
    private levelRepo: Repository<SmbStockLevel>,
  ) {}

  async generateReorderRecommendations(companyProfileId: string, dto?: GeneratePoDto): Promise<ReorderRecommendation[]> {
    const multiplier = dto?.overrideMultiplier ?? 1;

    const items = await this.getFilteredItems(companyProfileId, dto);
    const recommendations: ReorderRecommendation[] = [];

    for (const item of items) {
      const levels = await this.getFilteredLevels(item.id, dto);
      for (const level of levels) {
        if (Number(level.onHand) <= Number(item.reorderLevel ?? 0)) {
          const reorderQty = Number(item.reorderQuantity ?? 0) * multiplier;
          const unitCost = Number(level.movingAvgCost ?? item.standardCost ?? 0);
          const estimatedCost = reorderQty * unitCost;

          recommendations.push({
            itemId: item.id,
            itemName: item.itemName,
            sku: item.sku,
            warehouseId: level.warehouseId,
            currentStock: Number(level.onHand),
            reorderLevel: Number(item.reorderLevel ?? 0),
            reorderQuantity: reorderQty,
            recommendedQty: reorderQty,
            unitCost,
            estimatedCost,
            leadTimeDays: item.leadTimeDays ?? 0,
          });
        }
      }
    }

    return recommendations;
  }

  async findCriticalItems(companyProfileId: string): Promise<ReorderRecommendation[]> {
    const items = await this.itemRepo.find({ where: { companyProfileId, isActive: true } });
    const critical: ReorderRecommendation[] = [];

    for (const item of items) {
      const levels = await this.levelRepo.find({ where: { itemId: item.id } });
      for (const level of levels) {
        if (Number(level.onHand) <= 0) {
          const reorderQty = Number(item.reorderQuantity ?? 0);
          const unitCost = Number(level.movingAvgCost ?? item.standardCost ?? 0);

          critical.push({
            itemId: item.id,
            itemName: item.itemName,
            sku: item.sku,
            warehouseId: level.warehouseId,
            currentStock: Number(level.onHand),
            reorderLevel: Number(item.reorderLevel ?? 0),
            reorderQuantity: reorderQty,
            recommendedQty: reorderQty,
            unitCost,
            estimatedCost: reorderQty * unitCost,
            leadTimeDays: item.leadTimeDays ?? 0,
          });
        }
      }
    }

    return critical;
  }

  async findDeadStock(companyProfileId: string, daysThreshold: number = 90): Promise<any[]> {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - daysThreshold);

    const items = await this.itemRepo.find({ where: { companyProfileId, isActive: true } });
    const deadStock: any[] = [];

    for (const item of items) {
      const levels = await this.levelRepo.find({ where: { itemId: item.id } });
      for (const level of levels) {
        if (
          Number(level.onHand) > 0 &&
          level.lastMovementDate &&
          level.lastMovementDate < thresholdDate
        ) {
          deadStock.push({
            itemId: item.id,
            itemName: item.itemName,
            sku: item.sku,
            warehouseId: level.warehouseId,
            onHand: Number(level.onHand),
            lastMovementDate: level.lastMovementDate,
            totalValue: Number(level.totalValue),
            daysIdle: Math.floor((Date.now() - level.lastMovementDate.getTime()) / 86400000),
          });
        }
      }
    }

    return deadStock;
  }

  async findExcessStock(companyProfileId: string): Promise<any[]> {
    const items = await this.itemRepo.find({ where: { companyProfileId, isActive: true } });
    const excess: any[] = [];

    for (const item of items) {
      const levels = await this.levelRepo.find({ where: { itemId: item.id } });
      for (const level of levels) {
        const reorderLevel = Number(item.reorderLevel ?? 0);
        if (reorderLevel > 0 && Number(level.onHand) > reorderLevel * 3) {
          excess.push({
            itemId: item.id,
            itemName: item.itemName,
            sku: item.sku,
            warehouseId: level.warehouseId,
            onHand: Number(level.onHand),
            reorderLevel,
            excessQty: Number(level.onHand) - reorderLevel,
            totalValue: Number(level.totalValue),
          });
        }
      }
    }

    return excess;
  }

  private async getFilteredItems(companyProfileId: string, dto?: GeneratePoDto): Promise<SmbInventoryItem[]> {
    if (dto?.itemId) {
      const item = await this.itemRepo.findOne({ where: { id: dto.itemId, companyProfileId } });
      return item ? [item] : [];
    }
    if (dto?.category) {
      return this.itemRepo.find({ where: { companyProfileId, category: dto.category, isActive: true } });
    }
    return this.itemRepo.find({ where: { companyProfileId, isActive: true } });
  }

  private async getFilteredLevels(itemId: string, dto?: GeneratePoDto): Promise<SmbStockLevel[]> {
    if (dto?.warehouseId) {
      return this.levelRepo.find({ where: { itemId, warehouseId: dto.warehouseId } });
    }
    return this.levelRepo.find({ where: { itemId } });
  }
}
