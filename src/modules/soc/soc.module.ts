import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SocAlert } from './entities/soc-alert.entity';
import { SocIncident } from './entities/soc-incident.entity';
import { SocDashboardService } from './services/soc-dashboard.service';
import { SocDashboardController } from './controllers/soc-dashboard.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([SocAlert, SocIncident]),
  ],
  controllers: [SocDashboardController],
  providers: [SocDashboardService],
  exports: [SocDashboardService],
})
export class SocModule {}
