import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { memoryStorage } from 'multer';
import { StorageController } from './controllers/storage.controller';
import { StorageService } from './services/storage.service';
import { StoredFile } from './entities/stored-file.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([StoredFile]),
    MulterModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: () => ({
        storage: memoryStorage(),
      }),
    }),
  ],
  controllers: [StorageController],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
