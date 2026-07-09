import { Controller, Post, Get, Body, Param, Logger } from '@nestjs/common';
import { AmlService } from '../services/aml.service';

@Controller('api/v1/aml')
export class AmlController {
  private readonly logger = new Logger(AmlController.name);

  constructor(private readonly amlService: AmlService) {}

  /** GET /api/v1/aml/alerts - Listar alertas AML activas */
  @Get('alerts')
  async getActiveAlerts(): Promise<any[]> {
    const alerts = await this.amlService.getActiveAlerts();
    return alerts.map((a) => ({ id: a.id, type: a.alertType, status: a.status, priority: a.priority, riskScore: Number(a.riskScore) }));
  }

  /** POST /api/v1/aml/alerts/{id}/investigate - Abrir investigacion alerta */
  @Post('alerts/:id/investigate')
  async startInvestigation(@Param('id') alertId: string, @Body() body: { analystId: string }): Promise<any> {
    const updated = await this.amlService.startInvestigation(alertId, body.analystId);
    return { alertId: updated.id, status: updated.status, assignedTo: updated.assignedTo };
  }

  /** POST /api/v1/aml/alerts/{id}/resolve - Resolver alerta (false positive/case) */
  @Post('alerts/:id/resolve')
  async resolveAlert(@Param('id') alertId: string, @Body() body: { analystId: string; isFalsePositive: boolean; justification: string }): Promise<any> {
    const resolved = await this.amlService.resolveAsFalsePositive(alertId, body.analystId, body.justification);
    return { alertId: resolved.id, status: resolved.status, falsePositive: resolved.falsePositive };
  }

  /** POST /api/v1/aml/case/create - Crear caso SAR/STR */
  @Post('case/create')
  async createCase(@Body() body: { alertId: string; caseType: string; userId: string; analystId?: string; summary?: string }): Promise<any> {
    const { ComplianceWorkflowService } = require('../services/compliance-workflow.service');
    const workflow = new ComplianceWorkflowService(null); // Will be injected properly in module
    const caseItem = await workflow.createCase({ ...body, analystId: body.analystId || null, summary: body.summary || null });
    return { caseId: caseItem.id, alertId: caseItem.alertId, status: caseItem.status };
  }

  /** GET /api/v1/aml/case/{id} - Detalle caso investigacion */
  @Get('case/:id')
  async getCase(@Param('id') caseId: string): Promise<any> {
    const { ComplianceWorkflowService } = require('../services/compliance-workflow.service');
    const workflow = new ComplianceWorkflowService(null);
    try {
      const cases = await (workflow as any).repo.find({ where: { id: caseId } });
      if (cases.length === 0) return { error: 'Case not found' };
      const c = cases[0];
      return { id: c.id, alertId: c.alertId, caseType: c.caseType, status: c.status, summary: c.summary, evidenceCount: c.evidence?.length || 0 };
    } catch {
      return { error: 'Service not available' };
    }
  }

  /** POST /api/v1/aml/sar/generate - Generar reporte SAR automatico */
  @Post('sar/generate')
  async generateSar(@Body() body: { caseId: string; caseSummary: string }): Promise<{ sarId: string; fileUrl: string; generated: boolean }> {
    const sar = await this.amlService.generateSarReport(body.caseId, body.caseSummary);
    return sar;
  }
}
