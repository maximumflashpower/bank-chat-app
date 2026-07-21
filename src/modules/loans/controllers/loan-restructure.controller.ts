// src/modules/loans/controllers/loan-restructure.controller.ts

import { Controller, Post, Put, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../identity/guards/jwt-auth.guard.js';
import { LoanRestructureService } from '../services/loan-restructure.service.js';
import { RestructureLoanDto } from '../dto/restructure-loan.dto.js';

@ApiTags('Loans - Restructuring')
@Controller('api/v1/loans/restructures')
@UseGuards(JwtAuthGuard)
export class LoanRestructureController {
  constructor(private readonly restructureService: LoanRestructureService) {}

  /**
   * L2-FIN-077: Propuesta de reestructuración
   */
  @Post('/propose')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Proponer reestructuración de préstamo' })
  async proposeRestructure(
    @Body('loanId') loanId: string,
    @Body() dto: RestructureLoanDto,
  ): Promise<any> {
    return this.restructureService.proposeRestructure(loanId, dto);
  }

  /**
   * L2-FIN-077: Aprobar reestructuración
   */
  @Put('/:id/approve')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Aprobar reestructuración' })
  async approveRestructure(
    @Param('id') restructureId: string,
    @Body('approvedBy') approvedBy: string,
    @Body('conditions') conditions?: Record<string, any>,
  ): Promise<any> {
    return this.restructureService.approveRestructure(restructureId, approvedBy, conditions);
  }

  /**
   * L2-FIN-077: Rechazar reestructuración
   */
  @Put('/:id/reject')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Rechazar reestructuración' })
  async rejectRestructure(
    @Param('id') restructureId: string,
    @Body('rejectedBy') rejectedBy: string,
    @Body('reason') reason: string,
  ): Promise<any> {
    return this.restructureService.rejectRestructure(restructureId, rejectedBy, reason);
  }

  /**
   * L2-FIN-077: Aplicar reestructuración aprobada
   */
  @Post('/:id/apply')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Aplicar reestructuración al préstamo' })
  async applyRestructure(@Param('id') restructureId: string): Promise<any> {
    return this.restructureService.applyRestructure(restructureId);
  }

  /**
   * L2-FIN-077: Obtener reestructuras por préstamo
   */
  @Get('/loan/:loanId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reestructuras de un préstamo' })
  async getByLoanId(@Param('loanId') loanId: string): Promise<any> {
    return this.restructureService.getByLoanId(loanId);
  }

  /**
   * L2-FIN-077: Listar reestructuras pendientes
   */
  @Get('/pending')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reestructuras pendientes de aprobación' })
  async getPendingRestructures(): Promise<any> {
    return this.restructureService.getPendingRestructures();
  }
}
