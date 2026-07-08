import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Query,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { InventoryJournalService } from '../services/inventory-journal.service';
import { CreateInventoryAccountMappingDto } from '../dto/create-inventory-account-mapping.dto';

@Controller('api/ledger/inventory-mappings')
export class InventoryAccountMappingController {
  constructor(private readonly journalService: InventoryJournalService) {}

  @Post()
  async create(@Body() dto: CreateInventoryAccountMappingDto) {
    return this.journalService.createAccountMapping(dto);
  }

  @Get()
  async findAll(
    @Query('companyProfileId') companyProfileId: string,
    @Query('movementType') movementType?: string,
  ) {
    return movementType
      ? this.journalService.findByCompanyAndMovement(companyProfileId, movementType)
      : [];
  }

  @Get('rules')
  async getRules(@Query('companyProfileId') companyProfileId: string) {
    return this.journalService.findRulesByCompany(companyProfileId);
  }
}
