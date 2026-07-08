import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SmbInventoryItem } from '../entities/smb-inventory-item.entity';
import { CreateItemDto } from '../dto/create-item.dto';
import { UpdateItemDto } from '../dto/update-item.dto';

@Injectable()
export class InventoryItemService {
  constructor(
    @InjectRepository(SmbInventoryItem)
    private itemRepo: Repository<SmbInventoryItem>,
  ) {}

  async create(companyProfileId: string, dto: CreateItemDto): Promise<SmbInventoryItem> {
    const item = this.itemRepo.create({
      ...dto,
      companyProfileId,
    });
    return this.itemRepo.save(item);
  }

  async findAll(companyProfileId: string, filters?: { category?: string; activeOnly?: boolean }): Promise<SmbInventoryItem[]> {
    const qb = this.itemRepo.createQueryBuilder('item')
      .where('item.companyProfileId = :companyProfileId', { companyProfileId });

    if (filters?.category) {
      qb.andWhere('item.category = :category', { category: filters.category });
    }
    if (filters?.activeOnly) {
      qb.andWhere('item.isActive = :isActive', { isActive: true });
    }
    return qb.getMany();
  }

  async findById(id: string): Promise<SmbInventoryItem> {
    const item = await this.itemRepo.findOne({ where: { id } });
    if (!item) throw new NotFoundException(`Inventory item ${id} not found`);
    return item;
  }

  async update(id: string, dto: UpdateItemDto): Promise<SmbInventoryItem> {
    const item = await this.findById(id);
    Object.assign(item, dto);
    return this.itemRepo.save(item);
  }

  async deactivate(id: string): Promise<void> {
    const item = await this.findById(id);
    item.isActive = false;
    await this.itemRepo.save(item);
  }

  async findByBarcode(barcode: string, companyProfileId: string): Promise<SmbInventoryItem | null> {
    return this.itemRepo.findOne({ where: { barcode, companyProfileId } });
  }

  async findBySku(sku: string, companyProfileId: string): Promise<SmbInventoryItem | null> {
    return this.itemRepo.findOne({ where: { sku, companyProfileId } });
  }

  async findPerishableItems(companyProfileId: string): Promise<SmbInventoryItem[]> {
    return this.itemRepo.find({
      where: { companyProfileId, isPerishable: true, isActive: true },
    });
  }

  async findSerialTrackedItems(companyProfileId: string): Promise<SmbInventoryItem[]> {
    return this.itemRepo.find({
      where: { companyProfileId, serialTrackingEnabled: true, isActive: true },
    });
  }

  async findLotTrackedItems(companyProfileId: string): Promise<SmbInventoryItem[]> {
    return this.itemRepo.find({
      where: { companyProfileId, lotTrackingEnabled: true, isActive: true },
    });
  }
}
