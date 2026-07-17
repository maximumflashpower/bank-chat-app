import {
  Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SegmentAccountingService } from '../services/segment-accounting.service';
import { SegmentBalance, SegmentTree } from '../dto/segment.types';
import { CreateSegmentDto } from '../dto/create-segment.dto';
import { QuerySegmentBalanceDto } from '../dto/query-segment-balance.dto';
import { SegmentType, SegmentStatus } from '../entities/ledger-segment.entity';
import { JwtAuthGuard } from '../../identity/guards/jwt-auth.guard';

@ApiTags('ledger-segments')
@ApiBearerAuth()
@Controller('v1/ledger/segments')
@UseGuards(JwtAuthGuard)
export class SegmentController {
  constructor(
    private readonly segmentService: SegmentAccountingService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Crear segmento contable' })
  @ApiResponse({ status: 201, description: 'Segmento creado exitosamente' })
  async create(@Body() dto: CreateSegmentDto) {
    return this.segmentService.createSegment(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos los segmentos' })
  async findAll(@Query('type') type?: SegmentType) {
    return type
      ? this.segmentService.findByType(type)
      : this.segmentService.findAll();
  }

  @Get('hierarchy')
  @ApiOperation({ summary: 'Obtener árbol jerárquico de segmentos' })
  async getHierarchy(): Promise<SegmentTree[]> {
    return this.segmentService.getHierarchy();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener segmento por ID' })
  async findById(@Param('id') id: string) {
    return this.segmentService.findById(id);
  }

  @Get(':id/balance')
  @ApiOperation({ summary: 'Obtener balance del segmento' })
  async getBalance(@Param('id') id: string, @Query('rollup') rollup?: string): Promise<SegmentBalance> {
    return rollup === 'true'
      ? this.segmentService.getRollupBalance(id)
      : this.segmentService.getBalance(id);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Actualizar estado del segmento' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: SegmentStatus,
  ) {
    return this.segmentService.updateStatus(id, status);
  }

  @Post('validate-combination')
  @ApiOperation({ summary: 'Validar combinación de dimensiones' })
  async validateCombination(@Body() body: {
    branchId?: string;
    deptId?: string;
    projectId?: string;
  }) {
    await this.segmentService.validateDimensionCombination(body);
    return { valid: true };
  }
}
