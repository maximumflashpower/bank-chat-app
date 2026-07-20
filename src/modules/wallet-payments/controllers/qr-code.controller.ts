import { Controller, Post, Get, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { QrPaymentService } from '../services/qr-payment.service.js';

@Controller('api/v1/qrcode')
@UseGuards(AuthGuard('jwt'))
export class QrCodeController {
  constructor(private readonly qrPaymentService: QrPaymentService) {}

  @Post('generate')
  async generateQr(@Body() body: {
    linkedAccountId: string;
    fixedAmountOptional?: number;
    merchantInfoJson?: Record<string, unknown>;
    validityMinutes?: number;
  }, @Request() req: any) {
    return this.qrPaymentService.generateQr({
      ownerUserId: req.user.id,
      ...body,
    });
  }

  @Post('scan')
  async scanQr(@Body() body: {
    qrId: string;
    amount?: number;
  }, @Request() req: any) {
    return this.qrPaymentService.scanQr({
      qrId: body.qrId,
      scannerUserId: req.user.id,
      amount: body.amount,
    });
  }

  @Get('list')
  async listQrs(@Request() req: any) {
    return this.qrPaymentService.listByOwner(req.user.id);
  }

  @Get(':id/public-profile')
  async getPublicProfile(@Param('id') id: string) {
    return this.qrPaymentService.getPublicProfile(id);
  }

  @Get(':id/merchant-info')
  async getMerchantInfo(@Param('id') id: string) {
    return this.qrPaymentService.getMerchantInfo(id);
  }

  @Get(':id/validity')
  async checkValidity(@Param('id') id: string) {
    return this.qrPaymentService.checkValidity(id);
  }

  @Delete(':id/revoke')
  async revokeQr(@Param('id') id: string) {
    return this.qrPaymentService.revokeQr(id);
  }
}
