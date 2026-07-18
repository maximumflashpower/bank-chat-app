import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AcquisitionService } from '../services/acquisition.service';
import { GoodwillService } from '../services/goodwill.service';
import { CreateAcquisitionDto } from '../dto/create-acquisition.dto';
import { PurchasePriceAllocationDto, ImpairmentTestDto } from '../dto/ppa.dto';

@ApiTags('Consolidation — Acquisitions')
@ApiBearerAuth()
@Controller('consolidation/acquisitions')
export class AcquisitionController {
  constructor(
    private readonly acqService: AcquisitionService,
    private readonly goodwillService: GoodwillService,
  ) {}

  @Get('summary')
  async getSummary() { return this.goodwillService.getGoodwillSummary(); }

  @Get('by-status/:status')
  async getByStatus(@Param('status') status: string) {
    return this.acqService.getAcquisitionsByStatus(status as any);
  }

  @Get()
  async findAll(@Query('page') page: number = 1, @Query('limit') limit: number = 20) {
    return this.acqService.findAll(page, limit);
  }

  @Get(':id')
  async findById(@Param('id') id: string) { return this.acqService.findById(id); }

  @Post()
  async create(@Body() dto: CreateAcquisitionDto) { return this.acqService.create(dto); }

  @Post(':id/ppa')
  async performPPA(@Param('id') id: string, @Body() dto: PurchasePriceAllocationDto) {
    return this.acqService.performPurchasePriceAllocation(id, dto.fairValueAssets, dto.fairValueLiabilities);
  }

  @Post(':id/calculate-goodwill')
  async calculateGoodwill(@Param('id') id: string) {
    return this.goodwillService.calculateGoodwill(id);
  }

  @Post(':id/impairment-test')
  async testImpairment(@Param('id') id: string, @Body() dto: ImpairmentTestDto) {
    return this.goodwillService.testImpairment(id, dto.carryingValue, dto.recoverableAmount);
  }

  @Post(':id/synergies')
  async recordSynergies(@Param('id') id: string, @Body() body: { synergyAmount: number }) {
    return this.acqService.recordSynergies(id, body.synergyAmount);
  }

  @Put(':id/status')
  async updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.acqService.updateStatus(id, body.status as any);
  }

  @Put(':id/terminate')
  async terminate(@Param('id') id: string, @Body() body: { reason: string }) {
    return this.acqService.terminate(id, body.reason);
  }
}
