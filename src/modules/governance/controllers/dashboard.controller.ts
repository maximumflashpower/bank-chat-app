import {
  Controller,
  Get,
  Post,
  Body,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../identity/guards/jwt-auth.guard';
import { GovernanceEngineService } from '../services/governance-engine.service';
import { EvaluateRequestDto } from '../dto/evaluate-request.dto';

@ApiTags('Governance — Dashboard & Engine')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('governance')
export class DashboardController {
  constructor(private readonly engineService: GovernanceEngineService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Governance dashboard summary' })
  @ApiResponse({ status: 200, description: 'Dashboard data' })
  async getDashboard() {
    return this.engineService.getDashboard();
  }

  @Post('evaluate')
  @ApiOperation({ summary: 'Evaluate a request against active policies' })
  @ApiResponse({ status: 200, description: 'Evaluation result' })
  async evaluate(@Body() dto: EvaluateRequestDto, @Request() req: any) {
    return this.engineService.evaluate(dto, req.user?.id);
  }
}
