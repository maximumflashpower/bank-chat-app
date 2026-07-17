// src/modules/loans/controllers/collateral.controller.ts

import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { CollateralService } from '../services/collateral.service.js';
import { RegisterCollateralDto } from '../dto/register-collateral.dto.js';

@Controller('v1/loans')
export class CollateralController {
  constructor(private readonly collateralService: CollateralService) {}

  @Post(':loanId/collateral/register')
  async register(@Param('loanId') loanId: string, @Body() dto: RegisterCollateralDto) {
    dto.loanId = loanId;
    return this.collateralService.register(dto);
  }

  @Get(':loanId/collateral')
  async findByLoan(@Param('loanId') loanId: string) {
    return this.collateralService.findByLoan(loanId);
  }
}
