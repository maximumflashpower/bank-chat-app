import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  ParseUUIDPipe,
  Param,
} from '@nestjs/common';
import { InventoryJournalService } from '../services/inventory-journal.service';
import { InventoryLedgerIntegrationService } from '../services/inventory-ledger-integration.service';
import { InventoryFinancialReportingService } from '../services/inventory-financial-reporting.service';
import { GenerateInventoryJournalDto } from '../dto/generate-inventory-journal.dto';
import { CreateInventoryPostingRuleDto } from '../dto/create-inventory-posting-rule.dto';
import { InventoryJournalReportDto } from '../dto/inventory-journal-report.dto';

@Controller('ledger/inventory-journals')
export class InventoryJournalController {
  constructor(
    private readonly journalService: InventoryJournalService,
    private readonly integrationService: InventoryLedgerIntegrationService,
    private readonly reportingService: InventoryFinancialReportingService,
  ) {}

  @Post('generate')
  async generateJournal(@Body() dto: GenerateInventoryJournalDto) {
    return this.journalService.generateJournalFromMovement(dto);
  }

  @Post('posting-rule')
  async createPostingRule(@Body() dto: CreateInventoryPostingRuleDto) {
    return this.journalService.createPostingRule(dto);
  }

  @Get('reconcile/:stockMovementId')
  async reconcile(@Param('stockMovementId', ParseUUIDPipe) stockMovementId: string) {
    return this.journalService.reconcile(stockMovementId);
  }

  @Post('batch-process')
  async batchProcess(@Body() body: { movements: any[] }) {
    return this.integrationService.batchProcessMovements(body.movements);
  }

  @Get('validate-rules')
  async validateRules(@Query('companyProfileId') companyProfileId: string) {
    return this.integrationService.validatePostingRules(companyProfileId);
  }

  @Get('report')
  async getReport(@Query() dto: InventoryJournalReportDto) {
    return this.reportingService.generateFinancialReport(dto);
  }

  @Get('asset-balance')
  async getAssetBalance(@Query('companyProfileId') companyProfileId: string) {
    return this.reportingService.getInventoryAssetBalance(companyProfileId);
  }

  @Get('cogs-total')
  async getCogSTotal(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportingService.getCOGSTotal(startDate, endDate);
  }
}
