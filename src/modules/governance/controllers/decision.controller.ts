import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../identity/guards/jwt-auth.guard';
import { DecisionService } from '../services/decision.service';
import { DecisionQueryDto } from '../dto/decision-query.dto';

@ApiTags('Governance — Decisions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('governance/decisions')
export class DecisionController {
  constructor(private readonly decisionService: DecisionService) {}

  @Get()
  @ApiOperation({ summary: 'Search decision logs' })
  @ApiResponse({ status: 200, description: 'List of decisions' })
  async search(@Query() query: DecisionQueryDto) {
    return this.decisionService.search(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get decision details' })
  @ApiResponse({ status: 200, description: 'Decision details' })
  async findById(@Param('id') id: string) {
    return this.decisionService.findById(id);
  }
}
