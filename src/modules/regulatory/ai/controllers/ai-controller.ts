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
import { AiRegulatoryService } from '../services/ai-regulatory.service';
import { AlgorithmicTradingService } from '../services/algorithmic-trading.service';
import { ModelGovernanceService } from '../services/model-governance.service';
import { MlBiasDetectionService } from '../services/ml-bias-detection.service';
import { JwtAuthGuard } from '../../../identity/guards/jwt-auth.guard';
import { RolesGuard } from '../../../identity/guards/roles.guard';
import { Roles } from '../../../identity/decorators/roles.decorator';
import { RoleType } from '../../../identity/entities/role.enum';

@ApiTags('AI Regulatory')
@Controller('api/regulatory/ai')
export class AiController {
  constructor(
    private readonly aiService: AiRegulatoryService,
    private readonly algoService: AlgorithmicTradingService,
    private readonly govService: ModelGovernanceService,
    private readonly biasService: MlBiasDetectionService,
  ) {}

  /**
   * REG-MOD-001: Scan AI system compliance
   */
  @Post('systems/scan')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN, RoleType.AUDITOR)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Scanner de cumplimiento regulatorio para sistemas AI' })
  async scanAiSystem(@Body() config: any): Promise<any> {
    return this.aiService.scanAiSystem(config);
  }

  @Get('systems/:id/audit')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generar audit trail de sistema AI' })
  async generateAudit(@Param('id') id: string): Promise<any> {
    return this.aiService.generateAuditTrail(id);
  }

  /**
   * REG-MOD-002: Algorithmic trading oversight
   */
  @Post('trading/oversee')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supervisión y circuit-breakers para trading algorítmico' })
  async overseeAlgoTrade(@Body() strategy: any): Promise<any> {
    return this.algoService.overseeAlgoTrade(strategy);
  }

  /**
   * REG-MOD-003: AI model governance
   */
  @Post('models/govern')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Gobernanza de ciclo de vida de modelo AI' })
  async governModel(@Body() metadata: any): Promise<any> {
    return this.govService.governModelLifecycle(metadata);
  }

  @Post('models/:id/recertify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Programar recertificación de modelo AI' })
  async scheduleRecertification(@Param('id') id: string): Promise<any> {
    return this.govService.scheduleRecertification(id);
  }

  /**
   * REG-MOD-004: ML bias detection
   */
  @Post('models/bias-scan')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN, RoleType.AUDITOR)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Detección de sesgo en modelos ML' })
  async detectBias(@Body() predictions: any): Promise<any> {
    return this.biasService.detectBias(predictions);
  }
}
