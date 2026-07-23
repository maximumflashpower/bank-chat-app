import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { InventoryTaxService } from '../services/inventory-tax.service';
import { CalculateInventorySalesTaxDto } from '../dto/calculate-inventory-sales-tax.dto';
import { SyncProductMappingDto } from '../dto/sync-product-mapping.dto';

@Controller('tax/inventory')
export class InventoryTaxController {
  constructor(private readonly inventoryTaxService: InventoryTaxService) {}

  @Post('calculate')
  async calculateSalesTax(@Body() dto: CalculateInventorySalesTaxDto) {
    return this.inventoryTaxService.calculateSalesTax(dto);
  }

  @Post('sync-mappings')
  async syncProductMappings(@Body() dto: SyncProductMappingDto) {
    return this.inventoryTaxService.syncProductMappings(
      dto.skus || [],
      dto.countryCode,
    );
  }

  @Get('lines/movement/:stockMovementId')
  async getTaxLinesByMovement(@Param('stockMovementId', ParseUUIDPipe) stockMovementId: string) {
    return this.inventoryTaxService.findTaxLinesByMovement(stockMovementId);
  }

  @Get('lines/calculation/:calcResultId')
  async getTaxLinesByCalculation(@Param('calcResultId', ParseUUIDPipe) calcResultId: string) {
    return this.inventoryTaxService.findTaxLinesByCalculation(calcResultId);
  }

  @Get('summary')
  async getTaxSummary(
    @Query('companyProfileId') companyProfileId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.inventoryTaxService.getTaxSummary(
      companyProfileId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }
}
