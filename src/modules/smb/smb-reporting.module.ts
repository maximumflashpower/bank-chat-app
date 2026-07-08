import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SmbReportingController } from './controllers/smb-reporting.controller';
import { SmbReportingService } from './services/smb-reporting.service';
import { SmbReportSnapshot } from './entities/smb-report-snapshot.entity';
import { SmbInventoryItem } from '../smb-inventory/entities/smb-inventory-item.entity';
import { SmbStockLevel } from '../smb-inventory/entities/smb-stock-level.entity';
import { SmbStockMovement } from '../smb-inventory/entities/smb-stock-movement.entity';
import { ValuationService } from '../smb-inventory/services/valuation.service';
import { SmbWarehouse } from '../smb-inventory/entities/smb-warehouse.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SmbReportSnapshot,
      SmbInventoryItem,
      SmbStockLevel,
      SmbStockMovement,
      SmbWarehouse,
    ]),
  ],
  controllers: [SmbReportingController],
  providers: [SmbReportingService, ValuationService],
  exports: [SmbReportingService],
})
export class SmbReportingModule {}
