import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChangeRequest } from './entities/change-request.entity';
import { FeatureFlag } from './entities/feature-flag.entity';
import { ChangeManagementService } from './services/change-management.service';
import { ChangeManagementController } from './controllers/change-management.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ChangeRequest, FeatureFlag])],
  providers: [ChangeManagementService],
  controllers: [ChangeManagementController],
})
export class ChangeManagementModule {}
