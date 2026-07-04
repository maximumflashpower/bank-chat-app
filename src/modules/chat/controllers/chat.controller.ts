import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../identity/guards/jwt-auth.guard';
import { ChatService } from '../services/chat.service';
import { CreateConversationDto } from '../dto/create-conversation.dto';
import { SendMessageDto } from '../dto/send-message.dto';

@ApiTags('Chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('conversations')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new conversation' })
  async createConversation(
    @Request() req: any,
    @Body() dto: CreateConversationDto,
  ) {
    return this.chatService.createConversation(req.user.id, dto);
  }

  @Get('conversations')
  @ApiOperation({
    summary:
      'List user conversations with last message preview and unread count',
  })
  async getConversations(@Request() req: any) {
    return this.chatService.getUserConversations(req.user.id);
  }

  @Get('conversations/:id/messages')
  @ApiOperation({ summary: 'Get messages in a conversation (paginated)' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({
    name: 'before',
    required: false,
    description: 'Message UUID for cursor pagination',
  })
  async getMessages(
    @Request() req: any,
    @Param('id') conversationId: string,
    @Query('limit') limit?: number,
    @Query('before') before?: string,
  ) {
    return this.chatService.getMessages(
      req.user.id,
      conversationId,
      limit,
      before,
    );
  }

  @Post('conversations/:id/messages')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Send a message in a conversation' })
  async sendMessage(
    @Request() req: any,
    @Param('id') conversationId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatService.sendMessage(req.user.id, conversationId, dto);
  }

  @Patch('conversations/:id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark conversation messages as read' })
  async markAsRead(@Request() req: any, @Param('id') conversationId: string) {
    return this.chatService.markAsRead(req.user.id, conversationId);
  }

  @Post('conversations/:id/participants/:userId')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Add a participant to a group/channel (admin only)',
  })
  async addParticipant(
    @Request() req: any,
    @Param('id') conversationId: string,
    @Param('userId') targetUserId: string,
  ) {
    return this.chatService.addParticipant(
      req.user.id,
      conversationId,
      targetUserId,
    );
  }

  @Patch('conversations/:id/participants/:userId/remove')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a participant from a conversation' })
  async removeParticipant(
    @Request() req: any,
    @Param('id') conversationId: string,
    @Param('userId') targetUserId: string,
  ) {
    return this.chatService.removeParticipant(
      req.user.id,
      conversationId,
      targetUserId,
    );
  }

  @Patch('messages/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Edit a message (sender only)' })
  async editMessage(
    @Request() req: any,
    @Param('id') messageId: string,
    @Body('content') content: string,
  ) {
    return this.chatService.editMessage(req.user.id, messageId, content);
  }

  @Delete('messages/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft-delete a message' })
  async deleteMessage(@Request() req: any, @Param('id') messageId: string) {
    return this.chatService.deleteMessage(req.user.id, messageId);
  }
}
