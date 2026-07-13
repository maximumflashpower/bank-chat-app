import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { SoxControlService } from '../services/sox-control.service';
import { CreateSoxControlDto } from '../dto/create-sox-control.dto';
import { TestSoxControlDto } from '../dto/test-sox-control.dto';
import { RemediateSoxDeficiencyDto } from '../dto/remediate-sox-deficiency.dto';
import { JwtAuthGuard } from '../../../identity/guards/jwt-auth.guard';
import { RolesGuard } from '../../../identity/guards/roles.guard';
import { Roles } from '../../../identity/decorators/roles.decorator';
import { RoleType } from '../../../identity/entities/role.enum';

@ApiTags('SOX Controls')
@Controller('api/regulatory/sox')
export class SoxController {
  constructor(private readonly soxService: SoxControlService) {}

  /**
   * REG-SOX-001: Create SOX control
   */
  @Post('controls')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear nuevo control SOX' })
  async createControl(@Body() dto: CreateSoxControlDto): Promise<any> {
    return this.soxService.createControl(dto);
  }

  /**
   * REG-SOX-001: List all controls
   */
  @Get('controls')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar todos los controles SOX' })
  @ApiQuery({ name: 'riskCategory', required: false })
  @ApiQuery({ name: 'status', required: false })
  async findAll(
    @Query('riskCategory') riskCategory?: string,
    @Query('status') status?: string,
  ): Promise<any> {
    return this.soxService.findAll(riskCategory, status);
  }

  /**
   * REG-SOX-001: Get single control
   */
  @Get('controls/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Detalle de control específico' })
  async findById(@Param('id') id: string): Promise<any> {
    const control = await this.soxService.findById(id);
    if (!control) {
      return { error: 'Control no encontrado' };
    }
    return control;
  }

  /**
   * REG-SOX-002: Execute test on control
   */
  @Post('test/:controlId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Ejecutar test automático de control' })
  async executeTest(
    @Param('controlId') controlId: string,
    @Body() dto: TestSoxControlDto,
  ): Promise<any> {
    return this.soxService.executeTest(controlId, dto);
  }

  /**
   * REG-SOX-003: Generate deficiency report
   */
  @Get('controls/:id/deficiency-report')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reporte de deficiencia de control' })
  async generateDeficiencyReport(@Param('id') id: string): Promise<any> {
    return this.soxService.generateDeficiencyReport(id);
  }

  /**
   * REG-SOX-004: Generate quarterly assertion package
   */
  @Get('quarterly-assertion')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reporte trimestral para certificación CFO' })
  @ApiQuery({ name: 'quarter' })
  @ApiQuery({ name: 'year' })
  async generateQuarterlyAssertion(
    @Query('quarter') quarter: string,
    @Query('year') year: string,
  ): Promise<any> {
    return this.soxService.generateQuarterlyAssertion(quarter, parseInt(year, 10));
  }

  /**
   * REG-SOX-005: Start remediation workflow
   */
  @Post('remediate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Iniciar workflow de remediación' })
  async startRemediation(@Body() dto: RemediateSoxDeficiencyDto): Promise<any> {
    return this.soxService.startRemediation(dto);
  }

  /**
   * REG-SOX-006: Get ITGC controls
   */
  @Get('itgc-controls')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar controles ITGC específicos' })
  async findItgcControls(): Promise<any> {
    return this.soxService.findItgcControls();
  }
}
