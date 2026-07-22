import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegulatoryStressTest } from './entities/regulatory-stress-test.entity';
import { StressTestService } from './services/stress-test.service';
import { StressTestController } from './controllers/stress-test.controller';

@Module({
  imports: [TypeOrmModule.forFeature([RegulatoryStressTest])],
  controllers: [StressTestController],
  providers: [StressTestService],
  exports: [StressTestService],
})
export class StressTestingModule {}
