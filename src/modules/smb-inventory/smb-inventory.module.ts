import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SmbInventoryItem } from './entities/smb-inventory-item.entity';
import { SmbWarehouse } from './entities/smb-warehouse.entity';
import { SmbStockMovement } from './entities/smb-stock-movement.entity';
import { SmbStockLevel } from './entities/smb-stock-level.entity';
import { InventoryItemService } from './services/inventory-item.service';
import { WarehouseService } from './services/warehouse.service';
import { StockMovementService } from './services/stock-movement.service';
import { ValuationService } from './services/valuation.service';
import { ReorderService } from './services/reorder.service';
import { InventoryReportService } from './services/inventory-report.service';
import { InventoryItemController } from './controllers/inventory-item.controller';
import { StockMovementController } from './controllers/stock-movement.controller';
import { InventoryReportController } from './controllers/inventory-report.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SmbInventoryItem,
      SmbWarehouse,
      SmbStockMovement,
      SmbStockLevel,
    ]),
  ],
  controllers: [
    InventoryItemController,
    StockMovementController,
    InventoryReportController,
  ],
  providers: [
    InventoryItemService,
    WarehouseService,
    StockMovementService,
    ValuationService,
    ReorderService,
    InventoryReportService,
  ],
  exports: [
    InventoryItemService,
    StockMovementService,
    ValuationService,
    ReorderService,
  ],
})
export class SmbInventoryModule {}
