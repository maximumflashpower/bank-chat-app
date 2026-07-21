// src/modules/loans/controllers/credit-scoring.controller.ts

import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../identity/guards/jwt-auth.guard.js';
import { CreditScoringService } from '../services/credit-scoring.service.js';
import { CalculateCreditScoreDto } from '../dto/create-credit-score.dto.js';

@ApiTags('Loans - Credit Scoring')
@Controller('api/v1/loans/scoring')
@UseGuards(JwtAuthGuard)
export class CreditScoringController {
  constructor(private readonly scoringService: CreditScoringService) {}

  @Post('/calculate')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Calcular credit score completo' })
  @ApiResponse({ status: 201, description: 'Score calculado exitosamente' })
  async calculateScore(@Body() dto: CalculateCreditScoreDto): Promise<any> {
    return this.scoringService.calculateAndSaveScore(dto);
  }

  @Get('/history/:userId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Historial de credit scores del usuario' })
  @ApiResponse({ status: 200, description: 'Lista de scores históricos' })
  async getScoreHistory(@Param('userId') userId: string): Promise<any> {
    return this.scoringService.findByUserId(userId);
  }

  @Get('/latest/:userId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Credit score más reciente' })
  @ApiResponse({ status: 200, description: 'Score más reciente o null' })
  async getLatestScore(@Param('userId') userId: string): Promise<any> {
    return this.scoringService.getLatestScore(userId);
  }
}
