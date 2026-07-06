import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataPipeline } from './entities/data-pipeline.entity';
import { DataCatalogEntry } from './entities/data-catalog-entry.entity';
import { DataPipelineService } from './services/data-pipeline.service';
import { DataPipelineController } from './controllers/data-pipeline.controller';

@Module({
  imports: [TypeOrmModule.forFeature([DataPipeline, DataCatalogEntry])],
  providers: [DataPipelineService],
  controllers: [DataPipelineController],
})
export class DataPipelineModule {}
