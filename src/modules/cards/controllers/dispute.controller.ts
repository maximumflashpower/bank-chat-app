import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DisputeService } from '../services/dispute.service';
import { DisputeType } from '../entities/card-dispute.entity';

@ApiTags('Cards — Disputes')
@ApiBearerAuth()
@Controller('v1/cards/disputes')
export class DisputeController {
  constructor(private readonly disputeService: DisputeService) {}

  @Post('open')
  @ApiOperation({ summary: 'Abrir disputa' })
  async open(@Body() data: { cardId: string; transactionId: string; disputeType: DisputeType; disputeAmount: number; description: string }) {
    return this.disputeService.openDispute(data);
  }

  @Get('card/:cardId')
  @ApiOperation({ summary: 'Disputas por tarjeta' })
  async findByCard(@Param('cardId') cardId: string) {
    return this.disputeService.findByCard(cardId);
  }

  @Get(':disputeId')
  @ApiOperation({ summary: 'Detalle disputa' })
  async findById(@Param('disputeId') disputeId: string) {
    return this.disputeService.findById(disputeId);
  }

  @Post(':disputeId/evidence')
  @ApiOperation({ summary: 'Agregar evidencia' })
  async addEvidence(@Param('disputeId') disputeId: string, @Body() body: { documentUrl: string }) {
    return this.disputeService.addEvidence(disputeId, body.documentUrl);
  }

  @Post(':disputeId/resolve')
  @ApiOperation({ summary: 'Resolver disputa' })
  async resolve(@Param('disputeId') disputeId: string, @Body() body: { result: 'won' | 'lost' | 'invalid'; notes: string }) {
    return this.disputeService.resolve(disputeId, body.result, body.notes);
  }

  @Post(':disputeId/escalate')
  @ApiOperation({ summary: 'Escalar a chargeback' })
  async escalate(@Param('disputeId') disputeId: string) {
    return this.disputeService.escalateToChargeback(disputeId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Estadísticas de disputas' })
  async getStats(@Body() body?: { days?: number }) {
    return this.disputeService.getStatistics(body?.days ?? 30);
  }
}
