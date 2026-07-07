import { Controller, Post, Put, Get, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../identity/guards/jwt-auth.guard';
import { ChartOfAccountsService } from '../services/chart-of-accounts.service';
import { FiscalPeriodService } from '../services/fiscal-period.service';
import { ReconciliationService } from '../services/reconciliation.service';
import { FinancialReportsService } from '../services/financial-reports.service';
import { CreateChartOfAccountsDto } from '../dto/create-chart-of-accounts.dto';
import { ClosePeriodDto } from '../dto/close-period.dto';
import { ReopenPeriodDto } from '../dto/reopen-period.dto';
import { ReconcileAutoDto } from '../dto/reconcile-auto.dto';

@ApiTags('Ledger - Accounting')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/ledger')
export class LedgerAccountingController {
  constructor(
    private readonly coaService: ChartOfAccountsService,
    private readonly periodService: FiscalPeriodService,
    private readonly reconcileService: ReconciliationService,
    private readonly reportsService: FinancialReportsService,
  ) {}

  // Chart of Accounts
  @Post('chart-of-accounts/create')
  @ApiOperation({ summary: 'Crear cuenta contable' })
  async createCoa(@Body() dto: CreateChartOfAccountsDto) {
    return this.coaService.create(dto);
  }

  @Get('chart-of-accounts')
  @ApiOperation({ summary: 'Listar plan de cuentas jerárquico' })
  async getCoaHierarchy() {
    return this.coaService.getHierarchy();
  }

  @Get('account/balance/:accountId')
  @ApiOperation({ summary: 'Saldo cuenta por periodo' })
  async getAccountBalance(@Param('accountId') accountId: string) {
    return this.coaService.getBalancesForAccount(accountId);
  }

  // Fiscal Periods
  @Get('periods')
  @ApiOperation({ summary: 'Estado de periodos' })
  async listPeriods() {
    return this.periodService.findAll();
  }

  @Get('periods/open')
  @ApiOperation({ summary: 'Listar periodos abiertos' })
  async getOpenPeriods() {
    return this.periodService.findOpenPeriods();
  }

  @Post('period/close')
  @ApiOperation({ summary: 'Cerrar periodo fiscal' })
  async closePeriod(@Body() dto: ClosePeriodDto, @Request() req: any) {
    return this.periodService.close(dto, req.user.id);
  }

  @Post('period/reopen')
  @ApiOperation({ summary: 'Reabrir periodo fiscal' })
  async reopenPeriod(@Body() dto: ReopenPeriodDto, @Request() req: any) {
    return this.periodService.reopen(dto, req.user.id);
  }

  // Reconciliation
  @Post('reconcile/auto')
  @ApiOperation({ summary: 'Ejecutar conciliación automática' })
  async autoReconcile(@Body() dto: ReconcileAutoDto, @Request() req: any) {
    return this.reconcileService.create(dto, req.user.id);
  }

  @Get('reconcile/exceptions')
  @ApiOperation({ summary: 'Listar excepciones de conciliación' })
  async listExceptions(@Query('status') status?: string) {
    return this.reconcileService.getExceptions(status as any);
  }

  @Post('reconcile/:id/resolve')
  @ApiOperation({ summary: 'Resolver excepción manual' })
  async resolveException(@Param('id') id: string, @Request() req: any) {
    return this.reconcileService.certify(id, req.user.id);
  }

  // Financial Reports (stubs)
  @Get('trial-balance')
  @ApiOperation({ summary: 'Balance de comprobación' })
  async trialBalance(@Query('periodId') periodId: string) {
    return this.reportsService.trialBalance(periodId);
  }

  @Get('general-ledger/:accountId')
  @ApiOperation({ summary: 'Libro mayor detallado' })
  async generalLedger(@Param('accountId') accountId: string, @Query('dateFrom') dateFrom: string, @Query('dateTo') dateTo: string) {
    return this.reportsService.generalLedger(accountId, new Date(dateFrom), new Date(dateTo));
  }

  @Get('balance-sheet')
  @ApiOperation({ summary: 'Balance sheet generation' })
  async balanceSheet(@Query('asOfDate') asOfDate: string) {
    return this.reportsService.balanceSheet(new Date(asOfDate));
  }

  @Get('income-statement')
  @ApiOperation({ summary: 'Income statement P&L' })
  async incomeStatement(@Query('fromDate') fromDate: string, @Query('toDate') toDate: string) {
    return this.reportsService.incomeStatement(new Date(fromDate), new Date(toDate));
  }

  @Get('cash-flow')
  @ApiOperation({ summary: 'Cash flow statement' })
  async cashFlow(@Query('fromDate') fromDate: string, @Query('toDate') toDate: string, @Query('method') method: 'direct' | 'indirect') {
    return this.reportsService.cashFlowStatement(new Date(fromDate), new Date(toDate), method);
  }

  @Post('xbrl/export')
  @ApiOperation({ summary: 'Exportar XBRL regulatorio' })
  async xbrlExport(@Body('type') type: 'balance-sheet' | 'income-statement', @Body('periodId') periodId: string) {
    return this.reportsService.xbrlExport(type, periodId);
  }
}
