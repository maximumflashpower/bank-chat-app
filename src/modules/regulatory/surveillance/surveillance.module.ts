import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SurveillanceAlert } from './entities/surveillance-alert.entity';
import { MarketSurveillanceService } from './services/market-surveillance.service';
import { SurveillanceController } from './controllers/surveillance.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SurveillanceAlert])],
  controllers: [SurveillanceController],
  providers: [MarketSurveillanceService],
  exports: [MarketSurveillanceService],
})
export class SurveillanceModule {}
