import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { ClassificationService } from '../services/classification.service';
import { AutoClassifyDto, ManualClassifyDto, OverrideClassificationDto } from '../dto/classification.dto';

@Controller('api/v1/datagov/classify')
export class ClassificationController {
  constructor(private readonly classificationService: ClassificationService) {}

  @Get(':entityId')
  async getByEntity(@Param('entityId') entityId: string) {
    return this.classificationService.findByEntity(entityId);
  }

  @Post('auto')
  async autoClassify(@Body() dto: AutoClassifyDto) {
    return this.classificationService.autoClassify(dto.entityType, dto.entityIdentifier, dto.sampleContent);
  }

  @Post()
  async manualClassify(@Body() dto: ManualClassifyDto) {
    return this.classificationService.classify(
      dto.entityType,
      dto.entityIdentifier,
      dto.sensitivityLabel,
      dto.piiType,
      dto.classifiedBy,
    );
  }

  @Put(':id/override')
  async overrideClassification(
    @Param('id') id: string,
    @Body() dto: OverrideClassificationDto,
  ) {
    return this.classificationService.overrideClassification(id, dto.newLabel, dto.stewardId, dto.reason);
  }
}
