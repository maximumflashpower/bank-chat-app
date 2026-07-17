import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../identity/guards/jwt-auth.guard';
import { RolesGuard } from '../../identity/guards/roles.guard';
import { Roles } from '../../identity/decorators/roles.decorator';
import { RoleType } from '../../identity/entities/role.enum';
import { SmbReportService } from '../services/smb-report.service';

@Controller('v1/smb/reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(
    private reportService: SmbReportService,
  ) {}

  @Get('trial-balance')
  @Roles(RoleType.AUDITOR)
  async trialBalance(): Promise<any> {
    return this.reportService.trialBalance();
  }

  @Get('profit-loss')
  @Roles(RoleType.MANAGER, RoleType.CUSTOMER)
  async profitLoss(@Query('from') from?: string, @Query('to') to?: string): Promise<any> {
    return this.reportService.profitLoss(from, to);
  }

  @Get('balance-sheet')
  @Roles(RoleType.MANAGER, RoleType.CUSTOMER)
  async balanceSheet(): Promise<any> {
    return this.reportService.balanceSheet();
  }

  @Get('cash-flow-statement')
  @Roles(RoleType.MANAGER, RoleType.CUSTOMER)
  async cashFlowStatement(): Promise<any> {
    return this.reportService.cashFlowStatement();
  }
}
