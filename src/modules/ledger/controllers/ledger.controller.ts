import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../identity/guards/jwt-auth.guard';
import { LedgerService } from '../services/ledger.service';
import { CreateAccountDto } from '../dto/create-account.dto';
import { TransferDto } from '../dto/transfer.dto';
import { DepositDto } from '../dto/deposit.dto';

@ApiTags('Ledger')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ledger')
export class LedgerController {
  constructor(private readonly ledgerService: LedgerService) {}

  @Post('accounts')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new account' })
  async createAccount(@Request() req: any, @Body() dto: CreateAccountDto) {
    return this.ledgerService.createAccount(req.user.id, dto);
  }

  @Get('accounts')
  @ApiOperation({ summary: 'List all accounts for the authenticated user' })
  async getAccounts(@Request() req: any) {
    return this.ledgerService.getAccounts(req.user.id);
  }

  @Get('accounts/:id')
  @ApiOperation({ summary: 'Get account details' })
  async getAccount(@Request() req: any, @Param('id') accountId: string) {
    return this.ledgerService.getAccountById(req.user.id, accountId);
  }

  @Get('accounts/:id/balance')
  @ApiOperation({ summary: 'Get account balance' })
  async getBalance(@Request() req: any, @Param('id') accountId: string) {
    return this.ledgerService.getBalance(req.user.id, accountId);
  }

  @Post('accounts/:id/deposit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deposit funds into an account' })
  async deposit(@Request() req: any, @Param('id') accountId: string, @Body() dto: DepositDto) {
    return this.ledgerService.deposit(req.user.id, accountId, dto);
  }

  @Post('accounts/:id/transfer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Transfer funds to another account' })
  async transfer(@Request() req: any, @Param('id') accountId: string, @Body() dto: TransferDto) {
    return this.ledgerService.transfer(req.user.id, accountId, dto);
  }

  @Get('accounts/:id/transactions')
  @ApiOperation({ summary: 'Get transaction history for an account' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getTransactions(
    @Request() req: any,
    @Param('id') accountId: string,
    @Query('limit') limit?: number,
  ) {
    return this.ledgerService.getTransactions(req.user.id, accountId, limit);
  }
}
