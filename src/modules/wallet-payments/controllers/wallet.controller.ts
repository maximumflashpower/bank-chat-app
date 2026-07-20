import { Controller, Post, Get, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { WalletService } from '../services/wallet.service.js';
import { WalletProvider } from '../entities/digital-wallet-token.entity.js';

@Controller('api/v1/wallet')
@UseGuards(AuthGuard('jwt'))
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Post('add-card')
  async addCard(@Body() body: {
    cardInstanceId: string;
    walletProvider: WalletProvider;
    deviceIdentifier: string;
    tokenRequestorId: string;
    tokenAuthorizationCode?: string;
  }, @Request() req: any) {
    return this.walletService.provisionToken({
      customerId: req.user.id,
      ...body,
    });
  }

  @Post('tokenize')
  async tokenize(@Body() body: {
    customerId: string;
    cardInstanceId: string;
    walletProvider: WalletProvider;
    deviceIdentifier: string;
    tokenRequestorId: string;
  }) {
    return this.walletService.provisionToken(body);
  }

  @Delete('deactivate/:tokenRef')
  async deactivate(@Param('tokenRef') tokenRef: string) {
    return this.walletService.deactivateByRef(tokenRef);
  }

  @Get('devices')
  async listDevices(@Request() req: any) {
    return this.walletService.listDevices(req.user.id);
  }

  @Post(':tokenId/suspend')
  async suspendToken(@Param('tokenId') tokenId: string) {
    return this.walletService.suspendToken(tokenId);
  }

  @Post(':tokenId/activate')
  async activateToken(@Param('tokenId') tokenId: string) {
    return this.walletService.activateToken(tokenId);
  }

  @Post(':tokenId/spending-limits')
  async setSpendingLimits(@Param('tokenId') tokenId: string, @Body() body: {
    spendingLimitAmount?: number;
    allowedMccList?: string[];
    allowedCountryCodes?: string[];
  }) {
    return this.walletService.setSpendingLimits(tokenId, body);
  }

  @Post(':tokenId/cryptogram')
  async generateCryptogram(@Param('tokenId') tokenId: string) {
    return this.walletService.generateDynamicCryptogram(tokenId);
  }

  @Post(':tokenId/biometric-attest')
  async attestBiometric(@Param('tokenId') tokenId: string, @Body() body: {
    type: string;
    attestationHash: string;
  }) {
    return this.walletService.attestBiometricConsent(tokenId, body);
  }
}
