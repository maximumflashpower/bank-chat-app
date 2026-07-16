import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { CatalogService } from '../services/catalog.service';
import { RegisterDatasetDto, SearchCatalogDto } from '../dto/catalog.dto';

@Controller('v1/datagov/catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('search')
  async search(@Query('query') query: string, @Query('tags') tags?: string) {
    const tagArray = tags ? tags.split(',') : undefined;
    return this.catalogService.search(query || '', tagArray);
  }

  @Post('register')
  async register(@Body() dto: RegisterDatasetDto) {
    return this.catalogService.register(dto);
  }

  @Post(':id/schema')
  async autoImportSchema(@Param('id') id: string, @Body('schema') schema: Record<string, unknown>) {
    return this.catalogService.autoImportSchema(id, schema);
  }

  @Put(':id/assign')
  async assignOwner(
    @Param('id') id: string,
    @Body('ownerId') ownerId?: string,
    @Body('stewardId') stewardId?: string,
  ) {
    return this.catalogService.assignOwnerSteward(id, ownerId, stewardId);
  }

  @Put(':id/pii-flag')
  async flagPII(
    @Param('id') id: string,
    @Body('piiPresent') piiPresent: boolean,
    @Body('classificationLabel') classificationLabel?: string,
  ) {
    return this.catalogService.flagPII(id, piiPresent, classificationLabel);
  }

  @Get('popular')
  async getPopular() {
    return this.catalogService.getPopularityStats();
  }
}
