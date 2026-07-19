import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FraudService } from '../services/fraud.service';

@ApiTags('Cards — Fraud Detection')
@ApiBearerAuth()
@Controller('v1/cards/fraud')
export class FraudController {
  constructor(private readonly fraudService: FraudService) {}

  @Post('analyze')
  @ApiOperation({ summary: 'Analizar transacción en tiempo real' })
  async analyze(@Body() data: any) {
    return this.fraudService.analyzeTransaction(data as any);
  }

  @Get('velocity/:cardId')
  @ApiOperation({ summary: 'Calcular velocity risk' })
  async velocityRisk(@Param('cardId') cardId: string, @Query('lastHour') lastHour?: string, @Query('lastDay') lastDay?: string) {
    return this.fraudService.calculateVelocityRisk(
      cardId,
      lastHour ? parseInt(lastHour) : 0,
      lastDay ? parseInt(lastDay) : 0,
    );
  }

  @Get('profile/:cardId')
  @ApiOperation({ summary: 'Perfil de riesgo del cliente' })
  async getProfile(@Param('cardId') cardId: string, @Query('days') days?: string) {
    return this.fraudService.getRiskProfile(cardId, days ? parseInt(days) : 7);
  }

  @Post('update-score/:cardId')
  @ApiOperation({ summary: 'Actualizar score de fraude' })
  async updateScore(@Param('cardId') cardId: string, @Body() body: { previousScore: number; newScore: number }) {
    return this.fraudService.updateFraudScore(cardId, body.previousScore, body.newScore);
  }
}
