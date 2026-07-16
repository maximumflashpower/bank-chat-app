import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { LineageService } from '../services/lineage.service';

@Controller('v1/datagov/lineage')
export class LineageController {
  constructor(private readonly lineageService: LineageService) {}

  @Get(':entityId')
  async getLineage(@Param('entityId') entityId: string) {
    return this.lineageService.traceLineage(entityId);
  }

  @Get(':entityId/graph')
  async getGraph(@Param('entityId') entityId: string) {
    return this.lineageService.buildLineageGraph(entityId);
  }

  @Get(':entityId/impact')
  async getImpact(@Param('entityId') entityId: string) {
    return this.lineageService.analyzeImpact(entityId);
  }

  @Post()
  async register(@Body() dto: {
    entityIdentifier: string;
    sourceSystem: string;
    targetSystem: string;
    transformations?: Record<string, unknown>[];
    crossesBorder?: boolean;
    countriesInvolved?: string[];
    containsPii?: boolean;
    flowDescription?: string;
  }) {
    return this.lineageService.registerLineage(dto);
  }

  @Get('cross-border/all')
  async getCrossBorder() {
    return this.lineageService.detectCrossBorderTransfers();
  }
}
