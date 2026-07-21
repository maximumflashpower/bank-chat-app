import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../identity/guards/jwt-auth.guard';
import { RolesGuard } from '../../identity/guards/roles.guard';
import { Roles } from '../../identity/decorators/roles.decorator';
import { RoleType } from '../../identity/entities/role.enum';
import { SmbBankingService } from '../services/smb-banking.service';
import { BankConnectDto } from '../dto/bank-connect.dto';

@Controller('v1/smb/banking')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BankingController {
  constructor(
    private bankingService: SmbBankingService,
  ) {}

  @Post('connect-account')
  @Roles(RoleType.ADMIN)
  async connectAccount(@Body() dto: BankConnectDto): Promise<any> {
    return this.bankingService.connectAccount(dto);
  }

  @Get('transactions')
  @Roles(RoleType.CUSTOMER, RoleType.MANAGER, RoleType.AUDITOR)
  async getTransactions(@Query('accountId') accountId: string): Promise<any> {
    return this.bankingService.importTransactions(accountId);
  }

  @Post('match/auto')
  @Roles(RoleType.MANAGER)
  async autoMatch(@Body() body: { accountId: string }): Promise<any> {
    return this.bankingService.autoMatch(body.accountId);
  }

  @Get('unmatched-items')
  @Roles(RoleType.AUDITOR)
  async listUnmatched(@Query('accountId') accountId: string): Promise<any[]> {
    return this.bankingService.listUnmatched(accountId);
  }

  @Get('cash-forecast')
  @Roles(RoleType.MANAGER)
  async cashForecast(@Query('companyProfileId') companyProfileId: string): Promise<any> {
    return this.bankingService.cashForecast(companyProfileId);
  }
}
