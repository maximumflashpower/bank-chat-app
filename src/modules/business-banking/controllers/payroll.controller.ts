import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PayrollService } from '../services/payroll.service';

@ApiTags('Business — Payroll')
@ApiBearerAuth()
@Controller('v1/business/payroll')
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @Post('batch/create')
  @ApiOperation({ summary: 'Crear batch de nómina' })
  async createBatch(@Body() data: any) {
    return this.payrollService.createBatch(data as any);
  }

  @Get('batch/:batchId')
  @ApiOperation({ summary: 'Detalle batch' })
  async findById(@Param('batchId') batchId: string) {
    return this.payrollService.findById(batchId);
  }

  @Get('batches/:sourceAccountId')
  @ApiOperation({ summary: 'Listar batches por cuenta origen' })
  async findByAccount(@Param('sourceAccountId') sourceAccountId: string) {
    return this.payrollService.findByAccount(sourceAccountId);
  }

  @Post('batch/:batchId/validate')
  @ApiOperation({ summary: 'Validar batch' })
  async validateBatch(@Param('batchId') batchId: string) {
    return this.payrollService.validateBatch(batchId);
  }

  @Post('batch/:batchId/execute')
  @ApiOperation({ summary: 'Ejecutar batch' })
  async executeBatch(@Param('batchId') batchId: string) {
    return this.payrollService.executeBatch(batchId);
  }

  @Post('batch/:batchId/cancel')
  @ApiOperation({ summary: 'Cancelar batch' })
  async cancelBatch(@Param('batchId') batchId: string) {
    return this.payrollService.cancelBatch(batchId);
  }

  @Get('batch/:batchId/nacha')
  @ApiOperation({ summary: 'Generar archivo NACHA' })
  async generateNacha(@Param('batchId') batchId: string) {
    const content = await this.payrollService.generateNachaFile(batchId);
    return { content };
  }

  @Get('batch/:batchId/report')
  @ApiOperation({ summary: 'Reporte de batch' })
  async getReport(@Param('batchId') batchId: string) {
    return this.payrollService.getBatchReport(batchId);
  }
}
