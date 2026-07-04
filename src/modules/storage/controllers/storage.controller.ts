import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Query,
  HttpCode,
  HttpStatus,
  StreamableFile,
  Header,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody, ApiQuery } from '@nestjs/swagger';
import type { Response, Request } from 'express';
import { createReadStream } from 'fs';
import { JwtAuthGuard } from '../../identity/guards/jwt-auth.guard';
import { StorageService } from '../services/storage.service';

@ApiTags('Storage')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('files')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Upload a file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async uploadFile(
    @Req() req: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.storageService.upload(req.user.id, file);
  }

  @Get('files')
  @ApiOperation({ summary: 'List user files' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async listFiles(
    @Req() req: any,
    @Query('limit') limit?: number,
  ) {
    return this.storageService.listByUser(req.user.id, limit);
  }

  @Get('files/:id')
  @ApiOperation({ summary: 'Get file metadata' })
  async getFileInfo(@Req() req: any, @Param('id') fileId: string) {
    return this.storageService.getFileInfo(req.user.id, fileId);
  }

  @Get('files/:id/raw')
  @ApiOperation({ summary: 'Download/serve the raw file' })
  async downloadFile(
    @Req() req: any,
    @Param('id') fileId: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const file = await this.storageService.getById(req.user.id, fileId);
    const physicalPath = this.storageService.getPhysicalPath(file);
    const stream = createReadStream(physicalPath);
    res.set({
      'Content-Type': file.mimeType,
      'Content-Disposition': `attachment; filename="${file.originalName}"`,
    });
    return new StreamableFile(stream);
  }

  @Delete('files/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a file' })
  async deleteFile(@Req() req: any, @Param('id') fileId: string) {
    return this.storageService.delete(req.user.id, fileId);
  }
}
