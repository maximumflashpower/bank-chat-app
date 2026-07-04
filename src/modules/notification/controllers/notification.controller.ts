import {
  Controller,
  Get,
  Patch,
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
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../identity/guards/jwt-auth.guard';
import { NotificationService } from '../services/notification.service';
import { NotificationStatus } from '../entities/notification-status.enum';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({
    summary:
      'List user notifications with pagination and optional status filter',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: NotificationStatus })
  async list(
    @Request() req: any,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('status') status?: NotificationStatus,
  ) {
    return this.notificationService.getUserNotifications(req.user.id, {
      limit,
      offset,
      status,
    });
  }

  @Get('unread/count')
  @ApiOperation({ summary: 'Get unread notification count' })
  async unreadCount(@Request() req: any) {
    return this.notificationService.getUnreadCount(req.user.id);
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a notification as read' })
  async markAsRead(@Request() req: any, @Param('id') id: string) {
    return this.notificationService.markAsRead(req.user.id, id);
  }

  @Patch('read/all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllAsRead(@Request() req: any) {
    return this.notificationService.markAllAsRead(req.user.id);
  }

  @Patch(':id/archive')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Archive a notification' })
  async archive(@Request() req: any, @Param('id') id: string) {
    return this.notificationService.archive(req.user.id, id);
  }
}
