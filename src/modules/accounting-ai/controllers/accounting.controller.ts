import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../identity/guards/jwt-auth.guard';
import { RolesGuard } from '../../identity/guards/roles.guard';
import { Roles } from '../../identity/decorators/roles.decorator';
import { RoleType } from '../../identity/entities/role.enum';
import { OcrExtractionService } from '../services/ocr-extraction.service';
import { JournalSuggestionService } from '../services/journal-suggestion.service';
import { RecurringEntryService } from '../services/recurring-entry.service';
import { MlModelService } from '../services/ml-model.service';
import { UploadDocumentDto } from '../dto/upload-document.dto';
import { ApproveEntryDto } from '../dto/approve-entry.dto';
import { RejectEntryDto } from '../dto/reject-entry.dto';
import { RecurringSetupDto } from '../dto/recurring-setup.dto';

@Controller('api/v1/accounting')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AccountingController {
  constructor(
    private ocrService: OcrExtractionService,
    private journalService: JournalSuggestionService,
    private recurringService: RecurringEntryService,
    private mlModelService: MlModelService,
  ) {}

  @Post('upload/document')
  @Roles(RoleType.MANAGER)
  async uploadDocument(@Body() dto: UploadDocumentDto): Promise<any> {
    return this.ocrService.processDocument(dto);
  }

  @Get('ocr/status/:taskId')
  async getOcrStatus(@Param('taskId') taskId: string): Promise<any> {
    return this.ocrService.findById(taskId);
  }

  @Get('suggested-entries')
  @Roles(RoleType.MANAGER)
  async getSuggestedEntries(): Promise<any[]> {
    return this.journalService.listPending();
  }

  @Put('suggested-entry/:id/approve')
  @Roles(RoleType.MANAGER)
  async approveEntry(@Param('id') id: string, @Body() dto: ApproveEntryDto): Promise<void> {
    await this.journalService.approve(id, dto);
  }

  @Put('suggested-entry/:id/reject')
  @Roles(RoleType.MANAGER)
  async rejectEntry(@Param('id') id: string, @Body() dto: RejectEntryDto): Promise<void> {
    await this.journalService.reject(id, dto);
  }

  @Get('recurring/setup')
  @Roles(RoleType.ADMIN)
  async getRecurringTemplates(): Promise<any[]> {
    return this.recurringService.findAll();
  }

  @Post('recurring/generate')
  @Roles(RoleType.ADMIN)
  async generateRecurring(): Promise<{ generated: number }> {
    return this.recurringService.generateDueEntries();
  }

  @Get('ml-models/accounting-performance')
  @Roles(RoleType.ADMIN)
  async getMlPerformance(): Promise<any> {
    return this.mlModelService.getPerformance();
  }
}
