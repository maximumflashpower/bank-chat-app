import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TokenService } from '../services/token.service';
import { WalletProvider } from '../entities/card-token.entity';

@ApiTags('Cards — Tokens')
@ApiBearerAuth()
@Controller('v1/cards/tokens')
export class TokenController {
  constructor(private readonly tokenService: TokenService) {}

  @Post('tokenize')
  @ApiOperation({ summary: 'Tokenizar tarjeta para wallet' })
  async tokenize(@Body() data: { cardId: string; walletProvider: WalletProvider; tokenValue: string; deviceId?: string; deviceName?: string }) {
    return this.tokenService.tokenizeCard(data);
  }

  @Get('card/:cardId')
  @ApiOperation({ summary: 'Listar tokens de tarjeta' })
  async findByCard(@Param('cardId') cardId: string) {
    return this.tokenService.findByCard(cardId);
  }

  @Post(':tokenId/revoke')
  @ApiOperation({ summary: 'Revocar token' })
  async revoke(@Param('tokenId') tokenId: string) {
    return this.tokenService.revokeToken(tokenId);
  }

  @Post(':tokenId/suspend')
  @ApiOperation({ summary: 'Suspender token' })
  async suspend(@Param('tokenId') tokenId: string) {
    return this.tokenService.suspendToken(tokenId);
  }

  @Post(':tokenId/reactivate')
  @ApiOperation({ summary: 'Reactivar token' })
  async reactivate(@Param('tokenId') tokenId: string) {
    return this.tokenService.reactivateToken(tokenId);
  }
}
