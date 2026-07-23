import { Controller, Get, Post, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { CommissionService } from '../services/commission.service';
import { PremiumService } from '../services/premium.service';

@ApiTags('insurance')
@Controller('v1/insurance')
export class AgentController {
  constructor(
    private readonly commissionService: CommissionService,
    private readonly premiumService: PremiumService,
  ) {}

  @Get('/agents/:id/portfolio')
  @ApiOperation({ summary: 'Cartera de agente' })
  @ApiParam({ name: 'id' })
  async getPortfolio(@Param('id') id: string) {
    return this.commissionService.getPortfolio(id);
  }

  @Get('/commissions')
  @ApiOperation({ summary: 'Comisiones por agente' })
  async getCommissions(@Query('agentId') agentId: string) {
    return this.commissionService.findByAgent(agentId);
  }

  @Post('/commissions/:id/pay')
  @ApiOperation({ summary: 'Pagar comisión' })
  @ApiParam({ name: 'id' })
  async payCommission(@Param('id') id: string) {
    return this.commissionService.payCommission(id);
  }

  @Get('/loss-ratio')
  @ApiOperation({ summary: 'Loss ratio monitor (claims/premiums)' })
  async getLossRatio(@Query('productId') productId?: number) {
    return this.premiumService.getLossRatio(productId ? Number(productId) : undefined);
  }

  @Post('/premiums/overdue/mark')
  @ApiOperation({ summary: 'Marcar primas vencidas' })
  async markOverdue() {
    const count = await this.premiumService.markOverdue();
    return { markedOverdue: count };
  }
}
