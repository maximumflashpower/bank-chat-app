import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { InventoryItemService } from '../services/inventory-item.service';
import { CreateItemDto } from '../dto/create-item.dto';
import { UpdateItemDto } from '../dto/update-item.dto';

@Controller('api/smb-inventory/items')
export class InventoryItemController {
  constructor(private readonly itemService: InventoryItemService) {}

  @Post()
  async create(@Body() dto: CreateItemDto, @Query('companyProfileId') companyProfileId: string) {
    return this.itemService.create(companyProfileId, dto);
  }

  @Get()
  async findAll(
    @Query('companyProfileId') companyProfileId: string,
    @Query('category') category?: string,
    @Query('activeOnly') activeOnly?: string,
  ) {
    return this.itemService.findAll(companyProfileId, {
      category,
      activeOnly: activeOnly === 'true',
    });
  }

  @Get(':id')
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.itemService.findById(id);
  }

  @Patch(':id')
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateItemDto) {
    return this.itemService.update(id, dto);
  }

  @Patch(':id/deactivate')
  async deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.itemService.deactivate(id);
  }

  @Get('barcode/:barcode')
  async findByBarcode(@Param('barcode') barcode: string, @Query('companyProfileId') companyProfileId: string) {
    return this.itemService.findByBarcode(barcode, companyProfileId);
  }

  @Get('sku/:sku')
  async findBySku(@Param('sku') sku: string, @Query('companyProfileId') companyProfileId: string) {
    return this.itemService.findBySku(sku, companyProfileId);
  }

  @Get('tracking/perishable')
  async findPerishable(@Query('companyProfileId') companyProfileId: string) {
    return this.itemService.findPerishableItems(companyProfileId);
  }

  @Get('tracking/serial')
  async findSerialTracked(@Query('companyProfileId') companyProfileId: string) {
    return this.itemService.findSerialTrackedItems(companyProfileId);
  }

  @Get('tracking/lot')
  async findLotTracked(@Query('companyProfileId') companyProfileId: string) {
    return this.itemService.findLotTrackedItems(companyProfileId);
  }
}
