import {
  Controller,
  Get,
  Post,
  Body,
  Query,
} from '@nestjs/common';
import { InventoryReportService } from '../services/inventory-report.service';
import { ValuationService } from '../services/valuation.service';
import { ReorderService } from '../services/reorder.service';
import { GeneratePoDto } from '../dto/generate-po.dto';

@Controller('api/smb-inventory/reports')
export class InventoryReportController {
  constructor(
    private readonly reportService: InventoryReportService,
    private readonly valuationService: ValuationService,
    private readonly reorderService: ReorderService,
  ) {}

  @Get('summary')
  async getSummary(@Query('companyProfileId') companyProfileId: string) {
    return this.reportService.generateSummary(companyProfileId);
  }

  @Get('movements/history')
  async getMovementHistory(
    @Query('companyProfileId') companyProfileId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportService.generateMovementHistory(
      companyProfileId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('warehouse-distribution')
  async getWarehouseDistribution(@Query('companyProfileId') companyProfileId: string) {
    return this.reportService.generateWarehouseDistribution(companyProfileId);
  }

  @Get('abc-analysis')
  async getAbcAnalysis(@Query('companyProfileId') companyProfileId: string) {
    return this.reportService.generateAbcAnalysis(companyProfileId);
  }

  @Get('aging')
  async getAgingReport(@Query('companyProfileId') companyProfileId: string) {
    return this.reportService.generateAgingReport(companyProfileId);
  }

  @Get('valuation')
  async getValuation(@Query('companyProfileId') companyProfileId: string) {
    return this.valuationService.generateValuationReport(companyProfileId);
  }

  @Get('cogs')
  async getCogs(
    @Query('companyProfileId') companyProfileId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.valuationService.calculateCogs(
      companyProfileId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('variance')
  async getVariance(@Query('companyProfileId') companyProfileId: string) {
    return this.valuationService.generateVarianceReport(companyProfileId);
  }

  @Get('ias2')
  async getIas2Report(@Query('companyProfileId') companyProfileId: string) {
    return this.valuationService.generateIas2Report(companyProfileId);
  }

  @Post('reorder/recommendations')
  async getReorderRecommendations(
    @Query('companyProfileId') companyProfileId: string,
    @Body() dto?: GeneratePoDto,
  ) {
    return this.reorderService.generateReorderRecommendations(companyProfileId, dto);
  }

  @Get('reorder/critical')
  async getCriticalItems(@Query('companyProfileId') companyProfileId: string) {
    return this.reorderService.findCriticalItems(companyProfileId);
  }

  @Get('reorder/dead-stock')
  async getDeadStock(
    @Query('companyProfileId') companyProfileId: string,
    @Query('daysThreshold') daysThreshold?: string,
  ) {
    return this.reorderService.findDeadStock(
      companyProfileId,
      daysThreshold ? parseInt(daysThreshold, 10) : 90,
    );
  }

  @Get('reorder/excess-stock')
  async getExcessStock(@Query('companyProfileId') companyProfileId: string) {
    return this.reorderService.findExcessStock(companyProfileId);
  }
}
