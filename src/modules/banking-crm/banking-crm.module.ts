import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrmCustomer360Profile } from './entities/crm-customer-360-profile.entity.js';
import { CrmOpportunity } from './entities/crm-opportunity.entity.js';
import { CrmOmnichannelQueue } from './entities/crm-omnichannel-queue.entity.js';
import { CrmServiceTicket } from './entities/crm-service-ticket.entity.js';
import { CrmChatbotConversation } from './entities/crm-chatbot-conversation.entity.js';
import { CrmAgentPerformance } from './entities/crm-agent-performance.entity.js';
import { Customer360Service } from './services/customer-360.service.js';
import { NbaOpportunityService } from './services/nba-opportunity.service.js';
import { QueueService } from './services/queue.service.js';
import { TicketService } from './services/ticket.service.js';
import { ChatbotService } from './services/chatbot.service.js';
import { CrmAuxService } from './services/crm-aux.service.js';
import { Customer360Controller } from './controllers/customer-360.controller.js';
import { NbaOpportunityController } from './controllers/nba-opportunity.controller.js';
import { QueueController } from './controllers/queue.controller.js';
import { TicketController } from './controllers/ticket.controller.js';
import { ChatbotFeedbackController } from './controllers/chatbot-feedback.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CrmCustomer360Profile,
      CrmOpportunity,
      CrmOmnichannelQueue,
      CrmServiceTicket,
      CrmChatbotConversation,
      CrmAgentPerformance,
    ]),
  ],
  providers: [
    Customer360Service,
    NbaOpportunityService,
    QueueService,
    TicketService,
    ChatbotService,
    CrmAuxService,
  ],
  controllers: [
    Customer360Controller,
    NbaOpportunityController,
    QueueController,
    TicketController,
    ChatbotFeedbackController,
  ],
  exports: [
    Customer360Service,
    NbaOpportunityService,
    QueueService,
    TicketService,
    ChatbotService,
    CrmAuxService,
  ],
})
export class BankingCrmModule {}
