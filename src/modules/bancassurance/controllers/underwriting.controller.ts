import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { UnderwritingService } from '../services/underwriting.service';
import { UnderwritingEvaluateDto } from '../dto/underwriting-evaluate.dto';
import { UnderwritingDecision } from '../entities/underwriting-assessment.entity';

@ApiTags('insurance')
@Controller('v1/insurance/underwriting')
export class UnderwritingController {
  constructor(private readonly underwritingService: UnderwritingService) {}

  @Post('/evaluate')
  @ApiOperation({ summary: 'Evaluación de riesgo (underwriter)' })
  async evaluate(@Body() dto: UnderwritingEvaluateDto) {
    return this.underwritingService.evaluate(dto);
  }

  @Post('/:id/decision')
  @ApiOperation({ summary: 'Decisión final de underwriting' })
  @ApiParam({ name: 'id' })
  async makeDecision(
    @Param('id') id: string,
    @Body('decision') decision: UnderwritingDecision,
    @Body('notes') notes?: string,
  ) {
    return this.underwritingService.makeDecision(id, decision, notes);
  }

  @Get('/quote/:quoteId')
  @ApiOperation({ summary: 'Assessments por cotización' })
  async findByQuote(@Param('quoteId') quoteId: string) {
    return this.underwritingService.findByQuote(quoteId);
  }

  @Get('/policy/:policyId')
  @ApiOperation({ summary: 'Assessments por póliza' })
  async findByPolicy(@Param('policyId') policyId: string) {
    return this.underwritingService.findByPolicy(policyId);
  }
}
