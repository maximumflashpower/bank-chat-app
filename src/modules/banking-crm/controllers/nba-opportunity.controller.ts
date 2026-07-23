import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NbaOpportunityService } from '../services/nba-opportunity.service.js';
import { OpportunityType, OpportunityStage } from '../entities/crm-opportunity.entity.js';

@Controller('v1/crm')
@UseGuards(AuthGuard('jwt'))
export class NbaOpportunityController {
  constructor(private readonly nbaService: NbaOpportunityService) {}

  @Get('next-best-action/:customerId')
  async getNextBestAction(@Param('customerId') customerId: string) {
    return this.nbaService.getNextBestAction(customerId);
  }

  @Post('opportunity/create')
  async createOpportunity(@Body() body: {
    customerId: string;
    productSuggested: string;
    opportunityType: OpportunityType;
    advisorId: string;
    estimatedValue?: number;
  }) {
    const result = await this.nbaService.createOpportunity(body);
    return { created: true, opportunityId: result.id };
  }

  @Get('opportunities/pipeline')
  async getPipeline(@Query('advisorId') advisorId?: string) {
    return this.nbaService.getPipeline(advisorId);
  }

  @Put('opportunity/:id/stage')
  async advanceStage(@Param('id') id: string, @Body() body: { stage: OpportunityStage }) {
    await this.nbaService.advanceStage(id, body.stage);
    return { updated: true };
  }

  @Put('opportunity/:id/result')
  async setResult(@Param('id') id: string, @Body() body: { result: 'accepted' | 'rejected' | 'pending' }) {
    await this.nbaService.setResult(id, body.result);
    return { updated: true };
  }

  @Get('customer/:customerId/product-overlap')
  async getProductOverlap(@Param('customerId') customerId: string, @Query('product') product: string) {
    return this.nbaService.getProductOverlap(customerId, product);
  }

  @Post('opportunity/:id/learn')
  async learnFromOutcome(@Param('id') id: string, @Body() body: { outcome: 'accepted' | 'declined'; feedback: string }) {
    await this.nbaService.learnFromOutcome(id, body.outcome, body.feedback);
    return { recorded: true };
  }

  @Get('customer/:customerId/previous-offers')
  async checkPreviousOffers(@Param('customerId') customerId: string, @Query('product') product: string) {
    return this.nbaService.checkPreviousOffers(customerId, product);
  }
}
