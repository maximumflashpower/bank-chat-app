import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../identity/guards/jwt-auth.guard';
import { RolesGuard } from '../../identity/guards/roles.guard';
import { Roles } from '../../identity/decorators/roles.decorator';
import { RoleType } from '../../identity/entities/role.enum';
import { FxService } from '../services/fx-service';
import { FxRateQueryDto } from '../dto/fx-rate-query.dto';
import { FxConvertDto } from '../dto/fx-convert.dto';

@Controller('v1/payments/foreign-exchange')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FxController {
  constructor(
    private fxService: FxService,
  ) {}

  @Post('rate-query')
  async queryRate(@Body() dto: FxRateQueryDto): Promise<any> {
    return this.fxService.queryRate(dto.fromCurrency, dto.toCurrency, dto.amount);
  }

  @Post('convert')
  @Roles(RoleType.MANAGER)
  async convert(@Body() dto: FxConvertDto): Promise<any> {
    return this.fxService.convert(dto.fromCurrency, dto.toCurrency, dto.amount, dto.instructionId, dto.authorizedBy);
  }

  @Get('exposure-report')
  @Roles(RoleType.MANAGER)
  async getExposureReport(): Promise<any> {
    return this.fxService.getExposureReport();
  }
}
