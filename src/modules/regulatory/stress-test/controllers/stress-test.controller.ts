import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { StressTestService } from '../services/stress-test.service';
import { CreateScenarioDto, RunStressTestDto, ReviewStressTestDto } from '../dto/create-scenario.dto';

@ApiTags('Regulatory — Stress Testing')
@Controller('api/v1/regulatory/stress-test')
export class StressTestController {
  constructor(private readonly stressTestService: StressTestService) {}

  @Get('/scenarios')
  @ApiOperation({ summary: 'Listar escenarios de stress test disponibles' })
  async getScenarios() {
    return this.stressTestService.getScenarios();
  }

  @Get('/:id/results')
  @ApiOperation({ summary: 'Resultados de stress test' })
  async getResults(@Param('id') id: string) {
    return this.stressTestService.getById(id);
  }

  @Post('/scenario/create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear escenario custom de stress test' })
  async createScenario(@Body() dto: CreateScenarioDto) {
    return this.stressTestService.createScenario(dto);
  }

  @Post('/run')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Ejecutar stress testing escenario' })
  async runStressTest(@Body() dto: RunStressTestDto) {
    return this.stressTestService.runStressTest(dto);
  }

  @Post('/:id/reverse')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reverse stress testing — break-point detection' })
  async reverseStressTest(@Param('id') id: string) {
    return this.stressTestService.reverseStressTest(id);
  }

  @Post('/:id/review')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revisar resultados de stress test' })
  async reviewResults(@Param('id') id: string, @Body() dto: ReviewStressTestDto) {
    dto.stressTestId = id;
    return this.stressTestService.reviewResults(dto);
  }

  @Post('/:id/submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Someter resultados al regulador' })
  async submitToRegulator(@Param('id') id: string) {
    return this.stressTestService.submitToRegulator(id);
  }
}
