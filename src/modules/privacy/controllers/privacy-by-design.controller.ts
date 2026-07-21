import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../identity/guards/jwt-auth.guard';
import { PrivacyByDesignService } from '../services/privacy-by-design.service';

@ApiTags('Privacy by Design')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('v1/privacy/by-design')
export class PrivacyByDesignController {
  constructor(
    private readonly pbdService: PrivacyByDesignService,
  ) {}

  @Get('default-settings')
  @ApiOperation({ summary: 'Obtener configuración de privacidad por defecto (PRIV-PBBDESIGN-001)' })
  @ApiResponse({ status: 200, description: 'Configuración por defecto retornada' })
  async getDefaultSettings() {
    return this.pbdService.getDefaultSettings();
  }

  @Post('validate-minimization')
  @ApiOperation({ summary: 'Validar esquema contra principio de minimización (PRIV-PBBDESIGN-002)' })
  @ApiResponse({ status: 200, description: 'Resultado de validación de minimización' })
  async validateDataMinimization(
    @Body('schemaName') schemaName: string,
    @Body('fields') fields: { name: string; type: string; purpose: string; required: boolean }[],
  ) {
    return this.pbdService.validateDataMinimization(schemaName, fields);
  }

  @Post('tag-purpose')
  @ApiOperation({ summary: 'Etiquetar campos con limitación de propósito (PRIV-PBBDESIGN-003)' })
  @ApiResponse({ status: 200, description: 'Etiquetas de propósito aplicadas' })
  async tagPurposeLimitation(
    @Body('schemaName') schemaName: string,
    @Body('fields') fields: { name: string; allowedPurposes: string[] }[],
  ) {
    return this.pbdService.tagPurposeLimitation(schemaName, fields);
  }
}
