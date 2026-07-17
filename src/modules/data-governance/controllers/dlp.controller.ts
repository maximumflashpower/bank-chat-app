import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { DlpService } from '../services/dlp.service';
import { CreateDlpRuleDto, EvaluateContentDto, ApproveExceptionDto } from '../dto/dlp.dto';

@Controller('v1/datagov/dlp')
export class DlpController {
  constructor(private readonly dlpService: DlpService) {}

  @Get('rules')
  async getRules() {
    return this.dlpService.getActions();
  }

  @Post('rules/create')
  async createRule(@Body() dto: CreateDlpRuleDto) {
    return this.dlpService.createRule(dto);
  }

  @Post('scan')
  async scanContent(@Body() dto: EvaluateContentDto) {
    return this.dlpService.evaluateContent(dto.content, dto.channel, dto.userId);
  }

  @Get('violations')
  async getViolations() {
    return this.dlpService.getAllViolations();
  }

  @Post('violations/:violationId/approve')
  async approveException(
    @Param('violationId') violationId: string,
    @Body() dto: ApproveExceptionDto,
  ) {
    return this.dlpService.approveException(violationId, dto.approvalId, dto.justification);
  }
}
