import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { RedemptionService } from '../services/redemption.service';
import { RedeemDto, CashbackRedemptionDto } from '../dto/redeem.dto';
import { RedemptionType } from '../entities/loyalty-redemption-catalog.entity';

@ApiTags('loyalty')
@Controller('api/v1/loyalty/redeem')
export class RedemptionController {
  constructor(private readonly redemptionService: RedemptionService) {}

  @Post('/purchase')
  @ApiOperation({ summary: 'Canje instantáneo' })
  async redeemPurchase(@Body() dto: RedeemDto) {
    return this.redemptionService.redeem(dto);
  }

  @Post('/giftcard')
  @ApiOperation({ summary: 'Tarjeta regalo digital' })
  async redeemGiftCard(@Body() dto: RedeemDto) {
    const result = await this.redemptionService.redeem(dto);
    return { ...result, giftCardSent: true };
  }

  @Post('/travel')
  @ApiOperation({ summary: 'Reservas vuelos/hoteles' })
  async redeemTravel(@Body() dto: RedeemDto) {
    const result = await this.redemptionService.redeem(dto);
    return { ...result, bookingConfirmed: true };
  }

  @Post('/donation')
  @ApiOperation({ summary: 'Donar a ONGs' })
  async redeemDonation(@Body() dto: RedeemDto) {
    const result = await this.redemptionService.redeem(dto);
    return { ...result, donationReceiptGenerated: true };
  }

  @Post('/cashback')
  @ApiOperation({ summary: 'Convertir a saldo cuenta' })
  async redeemCashback(@Body() dto: CashbackRedemptionDto) {
    return this.redemptionService.redeemCashback(dto);
  }

  @Get('/catalog')
  @ApiOperation({ summary: 'Catálogo completo de recompensas' })
  async getCatalog(@Query('programId') programId?: string, @Query('type') type?: RedemptionType) {
    return this.redemptionService.getCatalog(programId, type);
  }
}
