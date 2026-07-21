import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { NostroReconciliationService } from '../services/nostro-reconciliation.service';

@ApiTags('correspondent')
@Controller('api/v1/nostro')
export class NostroReconciliationController {
  constructor(private readonly reconService: NostroReconciliationService) {}

  @Post('/reconcile/run')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ejecutar reconciliación automática Nostro' })
  async runReconciliation(@Body() body: { nostroAccountId: string; cutoffDate: string }) {
    return this.reconService.autoMatchTransactions(body.nostroAccountId, new Date(body.cutoffDate));
  }

  @Get('/reconcile/status/:jobId')
  @ApiOperation({ summary: 'Estado job de reconciliación batch' })
  async getStatus(@Param('jobId') jobId: string) {
    // Stub - requeriría tracking de jobs
    return { jobId, status: 'completed', processed: 0, matched: 0 };
  }

  @Get('/suspense/items')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Items pendientes de reconciliación colgados' })
  async getSuspenseItems(@Query('accountId') accountId?: string) {
    if (accountId) {
      return this.reconService.getSuspenseItems(accountId);
    }
    // TODO: retornar todos
    return [];
  }

  @Post('/suspense/:itemId/resolve')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Resolver item suspense manualmente' })
  async resolveSuspense(
    @Param('itemId') itemId: string,
    @Body() body: { action: string; notes: string; resolvedByUserId: string },
  ) {
    return this.reconService.resolveSuspenseItem(itemId, body.action, body.notes, body.resolvedByUserId);
  }

  @Get('/unmatched/:accountId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Transacciones sin match' })
  async getUnmatched(@Param('accountId') accountId: string) {
    return this.reconService.getUnmatchedTransactions(accountId);
  }

  @Get('/summary/:accountId')
  @ApiOperation({ summary: 'Resumen de reconciliación' })
  async getSummary(@Param('accountId') accountId: string, @Query('asOfDate') asOfDate: string) {
    return this.reconService.getReconciliationSummary(accountId, new Date(asOfDate));
  }
}
