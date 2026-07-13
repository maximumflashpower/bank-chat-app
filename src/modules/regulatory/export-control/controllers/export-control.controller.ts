import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ExportControlService } from '../services/export-control.service';
import { CheckExportLicenseDto } from '../dto/check-export-license.dto';
import { JwtAuthGuard } from '../../../identity/guards/jwt-auth.guard';
import { RolesGuard } from '../../../identity/guards/roles.guard';
import { Roles } from '../../../identity/decorators/roles.decorator';
import { RoleType } from '../../../identity/entities/role.enum';

@ApiTags('Export Control')
@Controller('api/regulatory/export')
export class ExportController {
  constructor(private readonly exportService: ExportControlService) {}

  /**
   * REG-EXPORT-001: Check export control license
   */
  @Post('license/check')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Verificar licencia de exportación (países sancionados)' })
  async checkExportLicense(@Body() dto: CheckExportLicenseDto): Promise<any> {
    return this.exportService.checkExportLicense(dto);
  }

  /**
   * REG-EXPORT-002: Classify dual-use goods
   */
  @Post('classify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Clasificar bienes de uso dual' })
  async classifyGoods(@Body() body: { itemDescription: string; classification: string }): Promise<any> {
    return this.exportService.classifyGoods(body.itemDescription, body.classification);
  }

  /**
   * List all licenses
   */
  @Get('licenses')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar todas las licencias de exportación' })
  async findAll(): Promise<any> {
    return this.exportService.findAll();
  }

  /**
   * Get single license
   */
  @Get('licenses/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Detalle de licencia específica' })
  async findById(@Param('id') id: string): Promise<any> {
    const license = await this.exportService.findById(id);
    if (!license) {
      return { error: 'Licencia no encontrada' };
    }
    return license;
  }
}
