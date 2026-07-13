import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SoarPlaybookService } from '../services/soar-playbook.service';
import { CreatePlaybookDto } from '../dto/create-playbook.dto';
import { RunPlaybookDto } from '../dto/run-playbook.dto';

@ApiTags('SOAR')
@Controller('api/v1/soar')
export class SoarPlaybookController {
  constructor(private readonly soarService: SoarPlaybookService) {}

  @Get('playbooks')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List available SOAR playbooks' })
  @ApiResponse({ status: 200, description: 'Playbook list' })
  async getPlaybooks() {
    return this.soarService.findAll();
  }

  @Post('playbooks/create')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new SOAR playbook' })
  @ApiResponse({ status: 201, description: 'Playbook created' })
  async createPlaybook(@Body() dto: CreatePlaybookDto) {
    return this.soarService.createPlaybook(dto);
  }

  @Post('playbooks/run')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Execute SOAR playbook manually' })
  @ApiResponse({ status: 200, description: 'Playbook execution result' })
  async runPlaybook(
    @Body() dto: RunPlaybookDto,
    @Request() req: any,
  ) {
    return this.soarService.runPlaybook(dto.playbookId, dto.incidentId, req.user?.id);
  }

  @Get('playbooks/:id/executions')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get execution history for a playbook' })
  @ApiResponse({ status: 200, description: 'Recent executions' })
  async getExecutions(@Param('id') playbookId: string) {
    return this.soarService.getRecentExecutions();
  }

  @Get('playbooks/:id/success-rate')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Calculate playbook success rate' })
  @ApiResponse({ status: 200, description: 'Success rate percentage' })
  async getSuccessRate(@Param('id') playbookId: string) {
    const rate = await this.soarService.calculateSuccessRate(playbookId);
    return { playbookId, successRatePct: rate };
  }
}
