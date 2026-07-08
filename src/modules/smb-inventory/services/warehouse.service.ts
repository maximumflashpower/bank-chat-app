import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SmbWarehouse } from '../entities/smb-warehouse.entity';

@Injectable()
export class WarehouseService {
  constructor(
    @InjectRepository(SmbWarehouse)
    private warehouseRepo: Repository<SmbWarehouse>,
  ) {}

  async create(companyProfileId: string, data: Partial<SmbWarehouse>): Promise<SmbWarehouse> {
    const warehouse = this.warehouseRepo.create({
      ...data,
      companyProfileId,
    });
    return this.warehouseRepo.save(warehouse);
  }

  async findAll(companyProfileId: string, activeOnly?: boolean): Promise<SmbWarehouse[]> {
    const where: any = { companyProfileId };
    if (activeOnly) {
      where.isActive = true;
    }
    return this.warehouseRepo.find({ where, order: { isPrimary: 'DESC', name: 'ASC' } });
  }

  async findById(id: string): Promise<SmbWarehouse> {
    const warehouse = await this.warehouseRepo.findOne({ where: { id } });
    if (!warehouse) throw new NotFoundException(`Warehouse ${id} not found`);
    return warehouse;
  }

  async update(id: string, data: Partial<SmbWarehouse>): Promise<SmbWarehouse> {
    const warehouse = await this.findById(id);
    Object.assign(warehouse, data);
    return this.warehouseRepo.save(warehouse);
  }

  async deactivate(id: string): Promise<void> {
    const warehouse = await this.findById(id);
    warehouse.isActive = false;
    await this.warehouseRepo.save(warehouse);
  }

  async findPrimary(companyProfileId: string): Promise<SmbWarehouse | null> {
    return this.warehouseRepo.findOne({
      where: { companyProfileId, isPrimary: true, isActive: true },
    });
  }

  async setPrimary(companyProfileId: string, warehouseId: string): Promise<void> {
    const current = await this.findPrimary(companyProfileId);
    if (current) {
      current.isPrimary = false;
      await this.warehouseRepo.save(current);
    }
    const newPrimary = await this.findById(warehouseId);
    newPrimary.isPrimary = true;
    await this.warehouseRepo.save(newPrimary);
  }

  async validateCapacity(warehouseId: string, itemCount: number): Promise<boolean> {
    const warehouse = await this.findById(warehouseId);
    if (!warehouse.isActive) {
      throw new BadRequestException(`Warehouse ${warehouse.code} is inactive`);
    }
    return true;
  }
}
