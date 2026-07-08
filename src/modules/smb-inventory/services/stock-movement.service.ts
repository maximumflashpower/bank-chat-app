import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SmbStockMovement } from '../entities/smb-stock-movement.entity';
import { SmbStockLevel } from '../entities/smb-stock-level.entity';
import { SmbInventoryItem } from '../entities/smb-inventory-item.entity';
import { ReceiveGoodsDto } from '../dto/receive-goods.dto';
import { CreateTransferDto } from '../dto/create-transfer.dto';
import { AdjustInventoryDto } from '../dto/adjust-inventory.dto';

@Injectable()
export class StockMovementService {
  constructor(
    @InjectRepository(SmbStockMovement)
    private movementRepo: Repository<SmbStockMovement>,
    @InjectRepository(SmbStockLevel)
    private levelRepo: Repository<SmbStockLevel>,
    @InjectRepository(SmbInventoryItem)
    private itemRepo: Repository<SmbInventoryItem>,
  ) {}

  async receiveGoods(dto: ReceiveGoodsDto, createdBy?: string): Promise<SmbStockMovement> {
    const item = await this.itemRepo.findOne({ where: { id: dto.itemId } });
    if (!item) throw new NotFoundException(`Item ${dto.itemId} not found`);

    const unitCost = dto.unitCost ?? item.standardCost ?? 0;
    const totalCost = unitCost * dto.quantity;

    const movement = this.movementRepo.create({
      movementType: 'RECEIVE',
      itemId: dto.itemId,
      warehouseId: dto.warehouseId,
      quantity: dto.quantity,
      unitCost,
      totalCost,
      reference: dto.reference,
      lotNumber: dto.lotNumber,
      serialNumber: dto.serialNumber,
      createdBy,
    });
    await this.movementRepo.save(movement);

    await this.updateStockLevel(dto.itemId, dto.warehouseId, dto.quantity, unitCost, 'receive');

    return movement;
  }

  async transfer(dto: CreateTransferDto, createdBy?: string): Promise<SmbStockMovement> {
    if (dto.fromWarehouseId === dto.toWarehouseId) {
      throw new BadRequestException('Source and destination warehouses must differ');
    }

    const fromLevel = await this.levelRepo.findOne({
      where: { itemId: dto.itemId, warehouseId: dto.fromWarehouseId },
    });
    if (!fromLevel || fromLevel.onHand < dto.quantity) {
      throw new BadRequestException('Insufficient stock for transfer');
    }

    const movement = this.movementRepo.create({
      movementType: 'TRANSFER',
      itemId: dto.itemId,
      warehouseId: dto.fromWarehouseId,
      toWarehouseId: dto.toWarehouseId,
      quantity: dto.quantity,
      unitCost: fromLevel.movingAvgCost,
      totalCost: fromLevel.movingAvgCost * dto.quantity,
      reference: dto.reference,
      lotNumber: dto.lotNumber,
      createdBy,
    });
    await this.movementRepo.save(movement);

    await this.updateStockLevel(dto.itemId, dto.fromWarehouseId, -dto.quantity, fromLevel.movingAvgCost, 'transfer_out');
    await this.updateStockLevel(dto.itemId, dto.toWarehouseId, dto.quantity, fromLevel.movingAvgCost, 'transfer_in');

    return movement;
  }

  async sale(itemId: string, warehouseId: string, quantity: number, reference?: string, createdBy?: string): Promise<SmbStockMovement> {
    const level = await this.levelRepo.findOne({ where: { itemId, warehouseId } });
    if (!level || level.onHand < quantity) {
      throw new BadRequestException('Insufficient stock for sale');
    }

    const movement = this.movementRepo.create({
      movementType: 'SALE',
      itemId,
      warehouseId,
      quantity,
      unitCost: level.movingAvgCost,
      totalCost: level.movingAvgCost * quantity,
      reference,
      createdBy,
    });
    await this.movementRepo.save(movement);

    await this.updateStockLevel(itemId, warehouseId, -quantity, level.movingAvgCost, 'sale');

    return movement;
  }

  async returnGoods(itemId: string, warehouseId: string, quantity: number, unitCost?: number, reference?: string, createdBy?: string): Promise<SmbStockMovement> {
    const level = await this.levelRepo.findOne({ where: { itemId, warehouseId } });
    const cost = unitCost ?? level?.movingAvgCost ?? 0;

    const movement = this.movementRepo.create({
      movementType: 'RETURN',
      itemId,
      warehouseId,
      quantity,
      unitCost: cost,
      totalCost: cost * quantity,
      reference,
      createdBy,
    });
    await this.movementRepo.save(movement);

    await this.updateStockLevel(itemId, warehouseId, quantity, cost, 'return');

    return movement;
  }

  async adjust(dto: AdjustInventoryDto, createdBy?: string): Promise<SmbStockMovement> {
    const movement = this.movementRepo.create({
      movementType: 'ADJUSTMENT',
      itemId: dto.itemId,
      warehouseId: dto.warehouseId,
      quantity: dto.adjustmentQuantity,
      reference: dto.reference ?? dto.reason,
      lotNumber: dto.lotNumber,
      createdBy,
    });
    await this.movementRepo.save(movement);

    await this.updateStockLevel(dto.itemId, dto.warehouseId, dto.adjustmentQuantity, undefined, 'adjust');

    return movement;
  }

  async findById(id: string): Promise<SmbStockMovement> {
    const movement = await this.movementRepo.findOne({ where: { id } });
    if (!movement) throw new NotFoundException(`Movement ${id} not found`);
    return movement;
  }

  async findMovements(filters: {
    itemId?: string;
    warehouseId?: string;
    movementType?: string;
  }): Promise<SmbStockMovement[]> {
    const qb = this.movementRepo.createQueryBuilder('m');
    if (filters.itemId) qb.andWhere('m.itemId = :itemId', { itemId: filters.itemId });
    if (filters.warehouseId) qb.andWhere('m.warehouseId = :warehouseId', { warehouseId: filters.warehouseId });
    if (filters.movementType) qb.andWhere('m.movementType = :movementType', { movementType: filters.movementType });
    return qb.orderBy('m.createdAt', 'DESC').getMany();
  }

  private async updateStockLevel(
    itemId: string,
    warehouseId: string,
    quantityDelta: number,
    unitCost: number | undefined,
    operation: string,
  ): Promise<void> {
    let level = await this.levelRepo.findOne({ where: { itemId, warehouseId } });

    if (!level) {
      level = this.levelRepo.create({
        itemId,
        warehouseId,
        onHand: 0,
        committed: 0,
        incoming: 0,
        available: 0,
        movingAvgCost: 0,
        lastCost: 0,
        totalValue: 0,
      });
    }

    level.onHand = Number(level.onHand) + quantityDelta;

    if (operation === 'receive' || operation === 'transfer_in' || operation === 'return') {
      if (unitCost !== undefined && unitCost > 0) {
        const totalExisting = Number(level.onHand) - quantityDelta;
        const totalNew = quantityDelta * unitCost;
        const totalCombined = (totalExisting * Number(level.movingAvgCost)) + totalNew;
        const newOnHand = level.onHand;
        level.movingAvgCost = newOnHand > 0 ? totalCombined / newOnHand : unitCost;
        level.lastCost = unitCost;
      }
      if (operation === 'receive') {
        level.incoming = Math.max(0, level.incoming - quantityDelta);
      }
    }

    if (operation === 'sale') {
      level.committed = Math.max(0, Number(level.committed) - Math.abs(quantityDelta));
    }

    level.available = Number(level.onHand) - Number(level.committed);
    level.totalValue = Number(level.onHand) * Number(level.movingAvgCost);
    level.lastMovementDate = new Date();

    await this.levelRepo.save(level);
  }
}

// Patch: add findById method
