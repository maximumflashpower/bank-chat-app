import { Controller, Post, Get, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../identity/guards/jwt-auth.guard';
import { JournalEntryService } from '../services/journal-entry.service';
import { CreateJournalEntryDto } from '../dto/create-journal-entry.dto';
import { QueryJournalEntriesDto } from '../dto/query-journal-entries.dto';

@ApiTags('Ledger - Journal Entries')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/ledger/journal-entry')
export class JournalEntryController {
  constructor(private readonly journalEntryService: JournalEntryService) {}

  @Post('create')
  @ApiOperation({ summary: 'Crear asiento contable doble entrada' })
  async create(@Body() dto: CreateJournalEntryDto, @Request() req: any) {
    return this.journalEntryService.create(dto, req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Ver asiento detalle' })
  async findById(@Param('id') id: string) {
    return this.journalEntryService.findById(id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar asientos con filtros' })
  async query(@Query() dto: QueryJournalEntriesDto) {
    return this.journalEntryService.query(dto);
  }

  @Post(':id/post')
  @ApiOperation({ summary: 'Postear asiento (draft → posted)' })
  async post(@Param('id') id: string, @Request() req: any) {
    return this.journalEntryService.post(id, req.user.id);
  }

  @Post(':id/reverse')
  @ApiOperation({ summary: 'Revertir asiento via contra-entry' })
  async reverse(@Param('id') id: string, @Request() req: any) {
    return this.journalEntryService.reverse(id, req.user.id);
  }
}
