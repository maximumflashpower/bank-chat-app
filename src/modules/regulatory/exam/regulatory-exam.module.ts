import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegExam } from './entities/reg-exam.entity';
import { RegulatoryExamService } from './services/regulatory-exam.service';
import { RegulatoryExamController } from './controllers/regulatory-exam.controller';

@Module({
  imports: [TypeOrmModule.forFeature([RegExam])],
  controllers: [RegulatoryExamController],
  providers: [RegulatoryExamService],
  exports: [RegulatoryExamService],
})
export class RegulatoryExamModule {}
