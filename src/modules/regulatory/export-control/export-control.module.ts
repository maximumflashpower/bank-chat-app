import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExportControlLicense } from './entities/export-control-license.entity';
import { ExportControlService } from './services/export-control.service';
import { ExportController } from './controllers/export-control.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ExportControlLicense])],
  controllers: [ExportController],
  providers: [ExportControlService],
  exports: [ExportControlService],
})
export class ExportControlModule {}
