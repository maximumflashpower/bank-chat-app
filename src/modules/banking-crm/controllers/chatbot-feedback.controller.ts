import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ChatbotService } from '../services/chatbot.service.js';
import { CrmAuxService } from '../services/crm-aux.service.js';

@Controller('api/v1/crm')
@UseGuards(AuthGuard('jwt'))
export class ChatbotFeedbackController {
  constructor(
    private readonly chatbotService: ChatbotService,
    private readonly crmAuxService: CrmAuxService,
  ) {}

  @Post('chatbot/converse')
  async converse(@Body() body: {
    conversationToken?: string;
    message: string;
    language?: string;
    customerId?: string;
  }) {
    return this.chatbotService.converse(body);
  }

  @Post('chatbot/start')
  async startConversation(@Body() body: { customerId?: string; language?: string }) {
    const result = await this.chatbotService.startConversation(body);
    return { conversationToken: result.conversationToken };
  }

  @Post('chatbot/end')
  async endConversation(@Body() body: {
    conversationToken: string;
    resolved: boolean;
    transferredToHuman: boolean;
    satisfactionRating?: number;
  }) {
    await this.chatbotService.endConversation(body.conversationToken, body.resolved, body.transferredToHuman, body.satisfactionRating);
    return { ended: true };
  }

  @Get('chatbot/faq')
  async searchFaq(@Query('q') query: string): Promise<any[]> {
    return this.chatbotService.searchFaq(query);
  }

  @Post('feedback/submit')
  async submitFeedback(@Body() body: {
    ticketId: string;
    npsScore: number;
    csatRating: number;
    feedbackText?: string;
  }) {
    await this.crmAuxService.submitFeedback(body.ticketId, body.npsScore, body.csatRating, body.feedbackText);
    return { submitted: true };
  }

  @Get('feedback/dashboard')
  async getFeedbackDashboard(@Query('periodMonth') periodMonth?: string) {
    return this.crmAuxService.getFeedbackDashboard(periodMonth);
  }

  @Get('agent/performance')
  async getAgentPerformance(@Query('agentId') agentId: string, @Query('periodMonth') periodMonth: string) {
    return this.crmAuxService.getAgentPerformance(agentId, periodMonth);
  }

  @Post('agent/quality-audit')
  async recordQualityAudit(@Body() body: { agentId: string; score: number; periodMonth: string }) {
    await this.crmAuxService.recordQualityAudit(body.agentId, body.score, body.periodMonth);
    return { recorded: true };
  }

  @Get('campaigns/active')
  async getActiveCampaigns() {
    return { campaigns: [] };
  }

  @Post('campaign/target-list')
  async generateTargetList(@Body() body: { segment: string; productInterest: string; limit: number }) {
    return this.crmAuxService.generateTargetList(body.segment, body.productInterest, body.limit);
  }

  @Post('campaign/attribution')
  async trackAttribution(@Body() body: { campaignId: string; customerId: string; action: string }) {
    await this.crmAuxService.trackCampaignAttribution(body.campaignId, body.customerId, body.action);
    return { tracked: true };
  }

  @Get('interaction/log/:customerId')
  async getInteractionLog(@Param('customerId') customerId: string) {
    return this.crmAuxService.getCustomerJourney(customerId);
  }

  @Post('sentiment/analyze')
  async analyzeSentiment(@Body() body: { text: string }) {
    return this.crmAuxService.analyzeSentiment(body.text);
  }

  @Post('proactive-outreach')
  async triggerOutreach(@Body() body: { customerId: string; triggerEvent: string }) {
    return this.crmAuxService.triggerProactiveOutreach(body.customerId, body.triggerEvent);
  }

  @Post('kb/article')
  async createKbArticle(@Body() body: { title: string; content: string; category: string }) {
    return this.crmAuxService.createKbArticle(body.title, body.content, body.category);
  }

  @Get('agent-script/:scenario')
  async getAgentScript(@Param('scenario') scenario: string) {
    return this.crmAuxService.getAgentScript(decodeURIComponent(scenario));
  }

  @Get('workforce/forecast')
  async forecastStaffing(@Query('periodMonth') periodMonth: string) {
    return this.crmAuxService.forecastStaffing(periodMonth);
  }

  @Post('integration/sync')
  async syncExternalCrm(@Body() body: { provider: 'salesforce' | 'hubspot'; direction: 'inbound' | 'outbound' }) {
    return this.crmAuxService.syncExternalCrm(body.provider, body.direction);
  }

  @Post('audit/log')
  async logCrmAction(@Body() body: {
    actorId: string;
    action: string;
    entityType: string;
    entityId: string;
    details?: Record<string, unknown>;
  }) {
    await this.crmAuxService.logCrmAction(body);
    return { logged: true };
  }

  @Post('churn-intervention/:customerId')
  async proactiveChurnIntervention(@Param('customerId') customerId: string) {
    return this.crmAuxService.proactiveChurnIntervention(customerId);
  }

  @Post('complaint/:ticketId/escalate')
  async handleComplaint(@Param('ticketId') ticketId: string, @Body() body: { escalationLevel: 'internal' | 'supervisor' | 'regulatory' }) {
    await this.crmAuxService.handleComplaint(ticketId, body.escalationLevel);
    return { escalated: true };
  }
}
