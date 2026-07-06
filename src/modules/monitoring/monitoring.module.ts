import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MonitorMetric } from './entities/monitor-metric.entity';
import { AlertRule } from './entities/alert-rule.entity';
import { MonitoringService } from './services/monitoring.service';
import { MonitoringController } from './controllers/monitoring.controller';

@Module({
  imports: [TypeOrmModule.forFeature([MonitorMetric, AlertRule])],
  providers: [MonitoringService],
  controllers: [MonitoringController],
})
export class MonitoringModule {}
