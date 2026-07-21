import { Controller, Get, Post, Put, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RewardsService } from '../services/rewards.service';
import { RewardType } from '../entities/card-rewards.entity';

@ApiTags('Cards — Rewards')
@ApiBearerAuth()
@Controller('v1/cards/rewards')
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  @Post('initialize')
  @ApiOperation({ summary: 'Inicializar rewards para tarjeta' })
  async initialize(@Body() data: { cardId: string; rewardType?: RewardType }) {
    return this.rewardsService.initializeForCard(data.cardId, data.rewardType ?? RewardType.POINTS);
  }

  @Get('card/:cardId')
  @ApiOperation({ summary: 'Obtener balance rewards' })
  async getRewards(@Param('cardId') cardId: string) {
    return this.rewardsService.findByCard(cardId);
  }

  @Post('earn')
  @ApiOperation({ summary: 'Ganar puntos por transacción' })
  async earn(@Body() data: { cardId: string; transactionAmount: number; multiplier?: number }) {
    return this.rewardsService.earnPoints(data.cardId, data.transactionAmount, data.multiplier ?? 1);
  }

  @Post('confirm-pending')
  @ApiOperation({ summary: 'Confirmar pending points' })
  async confirmPending(@Body() data: { cardId: string }) {
    return this.rewardsService.confirmPending(data.cardId);
  }

  @Post('redeem')
  @ApiOperation({ summary: 'Redimir puntos' })
  async redeem(@Body() data: { cardId: string; points: number; redemptionValue: number }) {
    return this.rewardsService.redeemPoints(data.cardId, data.points, data.redemptionValue);
  }

  @Put('tier')
  @ApiOperation({ summary: 'Cambiar tier de rewards' })
  async upgradeTier(@Body() data: { cardId: string; newTier: string }) {
    return this.rewardsService.upgradeTier(data.cardId, data.newTier);
  }

  @Post('cashback')
  @ApiOperation({ summary: 'Calcular cashback' })
  async calculateCashback(@Body() data: { cardId: string; percentage?: number }) {
    return this.rewardsService.calculateCashback(data.cardId, data.percentage ?? 1.5);
  }
}
