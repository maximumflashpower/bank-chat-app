import { RoleType } from '../../../identity/entities/role.enum';
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
import { RegulatoryExamService } from '../services/regulatory-exam.service';
import { CreateExamDto } from '../dto/create-exam.dto';
import { UpdateExamStatusDto } from '../dto/update-exam-status.dto';
import { CompileExamPackageDto } from '../dto/compile-exam-package.dto';
import { JwtAuthGuard } from '../../../identity/guards/jwt-auth.guard';
import { RolesGuard } from '../../../identity/guards/roles.guard';
import { Roles } from '../../../identity/decorators/roles.decorator';

@ApiTags('Regulatory Exams')
@Controller('regulatory/exams')
export class RegulatoryExamController {
  constructor(private readonly examService: RegulatoryExamService) {}

  /**
   * REG-EXAM-001: Create regulatory exam
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear nuevo examen regulatorio' })
  @ApiResponse({ status: 201, description: 'Examen creado correctamente' })
  async create(@Body() dto: CreateExamDto): Promise<any> {
    return this.examService.createExam(dto);
  }

  /**
   * REG-EXAM-001: List all exams
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar exámenes regulatorios' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'agency', required: false })
  async findAll(
    @Query('status') status?: string,
    @Query('agency') agency?: string,
  ): Promise<any> {
    return this.examService.findAll(status, agency);
  }

  /**
   * REG-EXAM-001: Get single exam
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Detalle de examen específico' })
  async findById(@Param('id') id: string): Promise<any> {
    const exam = await this.examService.findById(id);
    if (!exam) {
      return { error: 'Examen no encontrado' };
    }
    return exam;
  }

  /**
   * REG-EXAM-002: Update exam status
   */
  @Put(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar estado del examen' })
  @ApiResponse({ status: 200, description: 'Estado actualizado' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateExamStatusDto,
  ): Promise<any> {
    return this.examService.updateStatus(id, dto);
  }

  /**
   * REG-EXAM-003: Compile exam package
   */
  @Post('compile-package')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Compilar paquete de documentos para examen' })
  async compilePackage(@Body() dto: CompileExamPackageDto): Promise<any> {
    return this.examService.compileExamPackage(dto);
  }

  /**
   * REG-EXAM-002: Get deadline warnings
   */
  @Get('deadlines/warnings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Alertas de vencimiento próximos' })
  @ApiQuery({ name: 'days', required: false })
  async getDeadlines(@Query('days') days?: string): Promise<any> {
    const threshold = days ? parseInt(days, 10) : 7;
    return this.examService.getDeadlineWarnings(threshold);
  }

  /**
   * REG-EXAM-004: Archive exam
   */
  @Put(':id/archive')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Archivar examen terminado' })
  async archiveExam(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<any> {
    const resolvedBy = req.user?.id || 'system';
    return this.examService.archiveExam(id, resolvedBy);
  }
}
