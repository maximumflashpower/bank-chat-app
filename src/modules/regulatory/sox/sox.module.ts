import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SoxControl } from './entities/sox-control.entity';
import { SoxControlService } from './services/sox-control.service';
import { SoxController } from './controllers/sox.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SoxControl])],
  controllers: [SoxController],
  providers: [SoxControlService],
  exports: [SoxControlService],
})
export class SoxModule {}
