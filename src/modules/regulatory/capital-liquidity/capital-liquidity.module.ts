import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CapitalRatio } from './entities/capital-ratio.entity';
import { LiquidityRatio } from './entities/liquidity-ratio.entity';
import { CapitalService } from './services/capital-service.service';
import { LiquidityService } from './services/liquidity-service.service';
import { BaselCalculatorService } from './services/basel-calculator.service';
import { CapitalLiquidityController } from './controllers/capital-liquidity.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([CapitalRatio, LiquidityRatio]),
  ],
  controllers: [CapitalLiquidityController],
  providers: [CapitalService, LiquidityService, BaselCalculatorService],
  exports: [CapitalService, LiquidityService, BaselCalculatorService],
})
export class CapitalLiquidityModule {}
