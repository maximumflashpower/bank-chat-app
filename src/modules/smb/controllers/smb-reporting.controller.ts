import { Controller, Get, Query, Post, Body, UseGuards, Request } from '@nestjs/common';
import { SmbReportingService } from '../services/smb-reporting.service';
import { InventoryValuationReportDto } from '../dto/inventory-valuation-report.dto';
import { StockMovementHistoryDto } from '../dto/stock-movement-history.dto';
import { InventoryAgingDto } from '../dto/inventory-aging.dto';
import { JwtAuthGuard } from '../../identity/guards/jwt-auth.guard';
import { RolesGuard } from '../../identity/guards/roles.guard';
import { Roles } from '../../identity/decorators/roles.decorator';
import { RoleType } from '../../identity/entities/role.enum';

@Controller('v1/smb/reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SmbReportingController {
  constructor(private readonly reportingService: SmbReportingService) {}

  @Get('inventory-valuation')
  @Roles(RoleType.MANAGER)
  async getInventoryValuation(@Query() dto: InventoryValuationReportDto) {
    return this.reportingService.getInventoryValuation(dto);
  }

  @Get('stock-movements')
  @Roles(RoleType.MANAGER)
  async getStockMovements(@Query() dto: StockMovementHistoryDto) {
    return this.reportingService.getStockMovementHistory(dto);
  }

  @Get('inventory-aging')
  @Roles(RoleType.MANAGER)
  async getInventoryAging(@Query() dto: InventoryAgingDto) {
    return this.reportingService.getInventoryAging(dto);
  }

  @Get('inventory-summary')
  @Roles(RoleType.MANAGER)
  async getInventorySummary(
    @Query('companyProfileId') companyProfileId: string,
    @Query('warehouseId') warehouseId?: string,
  ) {
    return this.reportingService.getInventorySummary(companyProfileId, warehouseId);
  }

  @Get('ias2')
  @Roles(RoleType.MANAGER)
  async getIas2Report(@Query('companyProfileId') companyProfileId: string) {
    return this.reportingService.getIas2Report(companyProfileId);
  }

  @Post('snapshots')
  @Roles(RoleType.ADMIN)
  async saveSnapshot(
    @Body() body: {
      reportType: string;
      companyProfileId: string;
      reportDate: string;
      reportData: Record<string, unknown>;
      warehouseId?: string;
      generatedByUserId?: string;
      jurisdictionCode?: string;
    },
  ) {
    return this.reportingService.saveSnapshot(
      body.reportType,
      body.companyProfileId,
      body.reportDate,
      body.reportData,
      body.warehouseId,
      body.generatedByUserId,
      body.jurisdictionCode,
    );
  }

  @Get('snapshots')
  @Roles(RoleType.MANAGER)
  async getSnapshots(
    @Query('companyProfileId') companyProfileId: string,
    @Query('reportType') reportType?: string,
  ) {
    return this.reportingService.getSnapshotHistory(companyProfileId, reportType);
  }
}
