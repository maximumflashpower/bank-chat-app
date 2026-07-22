import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConsumerProtectionMonitor } from './entities/consumer-protection-monitor.entity';
import { ConsumerProtectionCase } from './entities/consumer-protection-case.entity';
import { ConsumerProtectionService } from './services/consumer-protection.service';
import { ConsumerProtectionController } from './controllers/consumer-protection.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ConsumerProtectionMonitor, ConsumerProtectionCase])],
  controllers: [ConsumerProtectionController],
  providers: [ConsumerProtectionService],
  exports: [ConsumerProtectionService],
})
export class ConsumerProtectionModule {}
