import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrmChatbotConversation } from '../entities/crm-chatbot-conversation.entity.js';

interface FaqEntry {
  id: string;
  question: string;
  answer: string;
  category: string;
}

@Injectable()
export class ChatbotService {
  private faqKnowledgeBase: FaqEntry[] = [
    { id: 'faq-001', question: 'How do I reset my password?', answer: 'Go to Settings > Security > Reset Password', category: 'tech_support' },
    { id: 'faq-002', question: 'What are the fees for wire transfer?', answer: 'Domestic: $5, International: $25', category: 'fees' },
    { id: 'faq-003', question: 'How do I report a lost card?', answer: 'Call immediately or use the app to freeze your card', category: 'cards' },
  ];

  constructor(
    @InjectRepository(CrmChatbotConversation)
    private repo: Repository<CrmChatbotConversation>,
  ) {}

  async converse(data: {
    conversationToken?: string;
    message: string;
    language?: string;
    customerId?: string;
  }): Promise<{ response: string; resolved: boolean; transferredToHuman: boolean; intent?: string }> {
    const lowerMsg = data.message.toLowerCase();

    const faqMatch = this.faqKnowledgeBase.find(f =>
      lowerMsg.includes(f.question.toLowerCase().split(' ').slice(0, 3).join(' ')),
    );

    if (faqMatch) {
      return {
        response: faqMatch.answer,
        resolved: true,
        transferredToHuman: false,
        intent: faqMatch.category,
      };
    }

    return {
      response: 'I will connect you with an agent who can help with that.',
      resolved: false,
      transferredToHuman: true,
      intent: 'unknown',
    };
  }

  async startConversation(data: { customerId?: string; language?: string }): Promise<CrmChatbotConversation> {
    const conv = new CrmChatbotConversation();
    conv.conversationToken = `CBOT-${Date.now()}-${Math.floor(Math.random()*100000)}`;
    if (data.customerId) {
      conv.customerId = data.customerId;
      conv.isAuthenticated = true;
    }
    conv.languageDetected = data.language || 'es';
    conv.sessionStartedAt = new Date();
    conv.totalMessages = 0;
    conv.resolvedByBot = false;
    conv.transferredToHuman = false;
    return this.repo.save(conv);
  }

  async endConversation(conversationToken: string, resolved: boolean, transferredToHuman: boolean, satisfactionRating?: number): Promise<void> {
    const conv = await this.repo.findOne({ where: { conversationToken } });
    if (conv) {
      await this.repo.update({ id: conv.id }, {
        resolvedByBot: resolved,
        transferredToHuman,
        satisfactionRating,
        sessionEndedAt: new Date(),
      } as any);
    }
  }

  async searchFaq(query: string): Promise<FaqEntry[]> {
    const lowerQuery = query.toLowerCase();
    return this.faqKnowledgeBase.filter(f =>
      f.question.toLowerCase().includes(lowerQuery) || f.answer.toLowerCase().includes(lowerQuery),
    );
  }

  async transferToHuman(conversationToken: string, reason: string): Promise<void> {
    const conv = await this.repo.findOne({ where: { conversationToken } });
    if (conv) {
      await this.repo.update({ id: conv.id }, {
        transferredToHuman: true,
        transferReason: reason,
      } as any);
    }
  }
}
