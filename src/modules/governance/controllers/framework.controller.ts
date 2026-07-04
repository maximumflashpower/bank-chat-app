import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  Patch,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../identity/guards/jwt-auth.guard';
import { FrameworkService } from '../services/framework.service';
import { FrameworkMapDto } from '../dto/framework-map.dto';

@ApiTags('Governance — Frameworks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('governance/frameworks')
export class FrameworkController {
  constructor(private readonly frameworkService: FrameworkService) {}

  @Get()
  @ApiOperation({ summary: 'List framework mappings' })
  @ApiResponse({ status: 200, description: 'List of framework mappings' })
  async findAll(@Query('framework') frameworkName?: string) {
    return this.frameworkService.findAll(frameworkName);
  }

  @Post('map')
  @ApiOperation({ summary: 'Map a policy to a compliance framework' })
  @ApiResponse({ status: 201, description: 'Mapping created' })
  async mapToFramework(@Body() dto: FrameworkMapDto, @Request() req: any) {
    return this.frameworkService.mapToFramework(dto, req.user.id);
  }

  @Get('gap-analysis/:framework')
  @ApiOperation({ summary: 'Gap analysis for a framework' })
  @ApiResponse({ status: 200, description: 'Gap analysis report' })
  async gapAnalysis(@Param('framework') framework: string) {
    return this.frameworkService.gapAnalysis(framework);
  }

  @Patch(':id/coverage')
  @ApiOperation({ summary: 'Update coverage percentage' })
  @ApiResponse({ status: 200, description: 'Coverage updated' })
  async updateCoverage(@Param('id') id: string, @Body() body: { coveragePct: number }) {
    return this.frameworkService.updateCoverage(id, body.coveragePct);
  }
}
