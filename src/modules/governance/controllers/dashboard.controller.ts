import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../identity/guards/jwt-auth.guard';
import { GovernanceEngineService } from '../services/governance-engine.service';
import { EvaluateRequestDto } from '../dto/evaluate-request.dto';

@ApiTags('Governance — Dashboard & Engine')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('governance')
export class DashboardController {
  constructor(private readonly engineService: GovernanceEngineService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Governance dashboard summary' })
  @ApiResponse({ status: 200, description: 'Dashboard data' })
  async getDashboard() {
    return this.engineService.getDashboard();
  }

  @Post('evaluate')
  @ApiOperation({ summary: 'Evaluate a request against active policies' })
  @ApiResponse({ status: 200, description: 'Evaluation result' })
  async evaluate(@Body() dto: EvaluateRequestDto, @Request() req: any) {
    return this.engineService.evaluate(dto, req.user?.id);
  }

  @Post('bbc/compose')
  @ApiOperation({ summary: 'BBC-POLICY-V3-001: Compose policies (modular reuse)' })
  @ApiResponse({ status: 200, description: 'Composed policy' })
  async composePolicies(@Body() body: { parentPolicyId: string; childPolicyIds: string[] }) {
    return this.engineService.composePolicies(body.parentPolicyId, body.childPolicyIds);
  }

  @Post('bbc/generate')
  @ApiOperation({ summary: 'BBC-POLICY-V3-002: Dynamic policy generation' })
  @ApiResponse({ status: 200, description: 'Generated policy' })
  async generateDynamicPolicy(@Body() body: { domain: string; rules: string[]; conditions?: Record<string, any> }) {
    return this.engineService.generateDynamicPolicy(body);
  }

  @Get('bbc/impact/:policyId')
  @ApiOperation({ summary: 'BBC-POLICY-V3-003: Policy impact analysis' })
  @ApiResponse({ status: 200, description: 'Impact analysis' })
  async analyzePolicyImpact(@Param('policyId') policyId: string) {
    return this.engineService.analyzePolicyImpact(policyId);
  }

  @Post('bbc/federated-eval')
  @ApiOperation({ summary: 'BBC-POLICY-V3-004: Federated policy evaluation' })
  @ApiResponse({ status: 200, description: 'Federated evaluation result' })
  async federatedEvaluate(@Body() body: { input: Record<string, any>; policyIds: string[] }) {
    return this.engineService.federatedEvaluate(body.input, body.policyIds);
  }

  @Get('bbc/heatmap')
  @ApiOperation({ summary: 'BBC-POLICY-V3-005: Policy heatmap visualization' })
  @ApiResponse({ status: 200, description: 'Policy heatmap' })
  async getPolicyHeatmap() {
    return this.engineService.getPolicyHeatmap();
  }

  @Post('ai/recommend-policy')
  @ApiOperation({ summary: 'GOV-MOD-001: AI policy recommendation' })
  @ApiResponse({ status: 200, description: 'Policy recommendations' })
  async recommendPolicy(@Body() body: { domain: string; frequentViolations: string[] }) {
    return this.engineService.recommendPolicy(body);
  }

  @Post('ai/predict-risk')
  @ApiOperation({ summary: 'GOV-MOD-002: Predictive compliance risk' })
  @ApiResponse({ status: 200, description: 'Predicted risk' })
  async predictComplianceRisk(@Body() body: { totalPolicies: number; violationRate: number; driftCount: number; attestationRate: number }) {
    return this.engineService.predictComplianceRisk(body);
  }
}
