// src/modules/loans/controllers/margin-call.controller.ts

import { Controller, Post, Get, Put, Body, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../identity/guards/jwt-auth.guard.js';
import { MarginCallService } from '../services/margin-call.service.js';
import { TriggerMarginCallDto } from '../dto/margin-call.dto.js';

@ApiTags('Loans - Margin Calls')
@Controller('api/v1/loans/margin-calls')
@UseGuards(JwtAuthGuard)
export class MarginCallController {
  constructor(private readonly marginCallService: MarginCallService) {}

  @Post('/monitor/run')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Ejecutar monitor LTV global' })
  async runMonitoring(): Promise<void> {
    await this.marginCallService.monitorLtvAndTriggerMarginCalls();
  }

  @Post('/trigger')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Disparar margin call manual' })
  async triggerMarginCall(@Body() dto: TriggerMarginCallDto): Promise<any> {
    return this.marginCallService.manualTriggerMarginCall(dto);
  }

  @Put('/:id/acknowledge')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Aceptación de margin call por cliente' })
  async acknowledgeMarginCall(
    @Param('id') marginCallId: string,
    @Body('acknowledgedBy') acknowledgedBy: string,
  ): Promise<any> {
    return this.marginCallService.acknowledgeMarginCall(marginCallId, acknowledgedBy);
  }

  @Put('/:id/resolve')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Resolver margin call con acción' })
  async resolveMarginCall(
    @Param('id') marginCallId: string,
    @Body() body: { actionTaken: string; resolution?: string; resolvedBy: string },
  ): Promise<any> {
    return this.marginCallService.resolveMarginCall(
      marginCallId,
      body as any,
      body.resolvedBy,
    );
  }

  @Post('/:id/liquidate')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ejecutar liquidación forzosa' })
  async executeLiquidation(
    @Param('id') marginCallId: string,
    @Body('executedBy') executedBy: string,
  ): Promise<any> {
    return this.marginCallService.executeLiquidation(marginCallId, executedBy);
  }

  @Get('/loan/:loanId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Margin calls de un préstamo' })
  async getByLoanId(@Param('loanId') loanId: string): Promise<any> {
    return this.marginCallService.getByLoanId(loanId);
  }

  @Get('/active')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Margin calls activos pendientes' })
  async getActiveMarginCalls(): Promise<any> {
    return this.marginCallService.getActiveMarginCalls();
  }

  @Get('/expired')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Margin calls expirados sin resolver' })
  async getExpiredMarginCalls(): Promise<any> {
    return this.marginCallService.getExpiredMarginCalls();
  }
}
