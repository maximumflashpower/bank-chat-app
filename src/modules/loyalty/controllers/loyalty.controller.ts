import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { EnrollmentService } from '../services/enrollment.service';
import { ProgramService } from '../services/program.service';
import { PointTransactionService } from '../services/point-transaction.service';
import { EnrollDto } from '../dto/enroll.dto';
import { CreateProgramDto } from '../dto/create-program.dto';

@ApiTags('loyalty')
@Controller('v1/loyalty')
export class LoyaltyController {
  constructor(
    private readonly enrollmentService: EnrollmentService,
    private readonly programService: ProgramService,
    private readonly pointTransactionService: PointTransactionService,
  ) {}

  @Get('/enrolled')
  @ApiOperation({ summary: 'Listar programas inscritos del usuario' })
  async getEnrolled(@Query('customerId') customerId: string) {
    return this.enrollmentService.findByCustomerId(customerId);
  }

  @Post('/join-program')
  @ApiOperation({ summary: 'Unirse a programa de lealtad' })
  async joinProgram(@Body() dto: EnrollDto) {
    return this.enrollmentService.enroll(dto);
  }

  @Post('/leave-program')
  @ApiOperation({ summary: 'Salir de programa de lealtad' })
  async leaveProgram(@Body('enrollmentId') enrollmentId: string) {
    throw new Error('Implement terminate logic');
  }

  @Get('/balance/:customerId')
  @ApiOperation({ summary: 'Obtener balance de puntos' })
  @ApiParam({ name: 'customerId' })
  @ApiQuery({ name: 'programId', required: false })
  async getBalance(@Param('customerId') customerId: string, @Query('programId') programId?: string) {
    return this.enrollmentService.getBalance(customerId, programId);
  }

  @Get('/activity/:customerId')
  @ApiOperation({ summary: 'Histórico de movimientos de puntos' })
  async getActivity(@Param('customerId') customerId: string) {
    // Placeholder - debería consultar todas las transacciones del cliente
    return [];
  }

  @Get('/programs')
  @ApiOperation({ summary: 'Listar todos los programas' })
  async listPrograms() {
    return this.programService.findAll();
  }

  @Post('/programs')
  @ApiOperation({ summary: 'Crear nuevo programa' })
  async createProgram(@Body() dto: CreateProgramDto) {
    return this.programService.create(dto);
  }

  @Get('/points/transaction')
  @ApiOperation({ summary: 'Listar transacciones de puntos' })
  async listTransactions(@Query('enrollmentId') enrollmentId: string) {
    return this.pointTransactionService.findByEnrollment(enrollmentId);
  }
}
