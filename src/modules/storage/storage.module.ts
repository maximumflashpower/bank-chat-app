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
        limits: {
          fileSize: 10 * 1024 * 1024,  // 10MB max per file
          files: 1,                    // 1 file per request
          fields: 20,                  // max 20 form fields
          fieldNameSize: 100,          // max field name length
          fieldSize: 1024 * 1024,      // max field value size (1MB)
          parts: 21,                   // max parts (files + fields)
        },
      }),
    }),
  ],
  controllers: [StorageController],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
