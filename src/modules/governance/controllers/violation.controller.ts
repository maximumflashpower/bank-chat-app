import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../identity/guards/jwt-auth.guard';
import { ViolationService } from '../services/violation.service';
import { ResolveViolationDto } from '../dto/resolve-violation.dto';
import { Severity } from '../entities/severity.enum';

@ApiTags('Governance — Violations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('governance/violations')
export class ViolationController {
  constructor(private readonly violationService: ViolationService) {}

  @Get()
  @ApiOperation({ summary: 'List violations' })
  @ApiResponse({ status: 200, description: 'List of violations' })
  async findAll(
    @Query('status') status?: string,
    @Query('severity') severity?: string,
    @Query('policyId') policyId?: string,
  ) {
    return this.violationService.findAll({ status, severity, policyId });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get violation details' })
  @ApiResponse({ status: 200, description: 'Violation details' })
  async findOne(@Param('id') id: string) {
    return this.violationService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Manually create a violation' })
  @ApiResponse({ status: 201, description: 'Violation created' })
  async create(
    @Body() body: {
      policyId: string;
      entityType: string;
      entityId: string;
      violationDetail: string;
      severity: Severity;
    }
  ) {
    return this.violationService.create({
      policyId: body.policyId,
      entityType: body.entityType,
      entityId: body.entityId,
      violationDetail: body.violationDetail,
      severity: body.severity,
    });
  }

  @Post(':id/resolve')
  @ApiOperation({ summary: 'Resolve or waive a violation' })
  @ApiResponse({ status: 200, description: 'Violation resolved' })
  async resolve(@Param('id') id: string, @Body() dto: ResolveViolationDto) {
    return this.violationService.resolve(id, dto);
  }

  @Post(':id/assign')
  @ApiOperation({ summary: 'Assign violation to a user' })
  @ApiResponse({ status: 200, description: 'Violation assigned' })
  async assign(@Param('id') id: string, @Body() body: { assigneeId: string }) {
    return this.violationService.assign(id, body.assigneeId);
  }
}
