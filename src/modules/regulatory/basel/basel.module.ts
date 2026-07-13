import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BaselReport } from './entities/basel-report.entity';
import { BaselReportingService } from './services/basel-reporting.service';
import { BaselController } from './controllers/basel.controller';

@Module({
  imports: [TypeOrmModule.forFeature([BaselReport])],
  controllers: [BaselController],
  providers: [BaselReportingService],
  exports: [BaselReportingService],
})
export class BaselModule {}
