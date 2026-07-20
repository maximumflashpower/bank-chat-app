import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { CheckDepositService } from '../services/check-deposit.service';
import { AuthGuard } from '@nestjs/passport';
import { DepositStatus } from '../enums/mobile.enums';

interface DepositDto {
  accountId: string;
  amount: number;
  checkNumber?: string;
  payerName?: string;
  frontImageUrl: string;
  backImageUrl: string;
  customerConfirmedAmount: boolean;
}

@Controller('api/v1/mobile/deposit')
@UseGuards(AuthGuard('jwt'))
export class MobileCheckDepositController {
  constructor(private readonly checkDepositService: CheckDepositService) {}

  @Post('/check')
  async depositCheck(@Body() dto: DepositDto) {
    const customerId = 'customer-from-jwt';
    return this.checkDepositService.submitDeposit({
      customerId,
      ...dto,
    });
  }

  @Get('/:id/status')
  async getStatus(@Param('id') id: string) {
    const customerId = 'customer-from-jwt';
    return this.checkDepositService.getStatus(id, customerId);
  }

  @Get('/history')
  async getHistory() {
    const customerId = 'customer-from-jwt';
    return this.checkDepositService.getDepositHistory(customerId);
  }
}
