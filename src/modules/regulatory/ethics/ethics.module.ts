import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EthicsCase } from './entities/ethics-case.entity';
import { ConflictOfInterest } from './entities/conflict-of-interest.entity';
import { GiftEntertainmentLog } from './entities/gift-entertainment-log.entity';
import { EthicsService } from './services/ethics.service';
import { EthicsController } from './controllers/ethics.controller';

@Module({
  imports: [TypeOrmModule.forFeature([EthicsCase, ConflictOfInterest, GiftEntertainmentLog])],
  controllers: [EthicsController],
  providers: [EthicsService],
  exports: [EthicsService],
})
export class EthicsModule {}
