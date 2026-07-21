// src/modules/loans/controllers/mortgage.controller.ts

import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { MortgageService } from '../services/mortgage.service.js';
import { OrderAppraisalDto, TitleSearchDto } from '../dto/mortgage.dto.js';

@Controller('v1/loans/mortgage')
export class MortgageController {
  constructor(private readonly mortgageService: MortgageService) {}

  @Post('appraisal/order')
  async orderAppraisal(@Body() dto: OrderAppraisalDto) {
    return this.mortgageService.orderAppraisal(dto.applicationId, dto.propertyAddress, dto.propertyType, dto.estimatedValue);
  }

  @Get('appraisal/:id')
  async getAppraisal(@Param('id') id: string) {
    return this.mortgageService.getAppraisalResult(id);
  }

  @Post('title-search')
  async titleSearch(@Body() dto: TitleSearchDto) {
    return this.mortgageService.performTitleSearch(dto.applicationId, dto.propertyAddress);
  }
}
