import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CalendarService } from '../services/calendar.service';

@ApiTags('regulatory-calendar')
@Controller('api/regulatory/calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Post()
  @ApiOperation({ summary: 'Create calendar event' })
  async createEvent(@Body() body: any, @Body('userId') userId: string) {
    return this.calendarService.createEvent(
      body.eventTitle,
      body.eventType,
      body.filingType,
      new Date(body.startTime),
      userId,
      body.options,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get calendar event by ID' })
  async findById(@Param('id') id: string) {
    return this.calendarService.findById(id);
  }

  @Get('/range')
  @ApiOperation({ summary: 'Get events in date range' })
  async findByDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.calendarService.findByDateRange(new Date(startDate), new Date(endDate));
  }

  @Get('/upcoming')
  @ApiOperation({ summary: 'Get upcoming events' })
  async findUpcoming(@Query('days') days: number = 7) {
    return this.calendarService.findUpcoming(Number(days));
  }

  @Put('/:id/status')
  @ApiOperation({ summary: 'Update event status' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: 'pending' | 'confirmed' | 'completed' | 'cancelled',
  ) {
    return this.calendarService.updateStatus(id, status);
  }

  @Post('/:id/reminders')
  @ApiOperation({ summary: 'Mark reminders as sent' })
  async markRemindersSent(
    @Param('id') id: string,
    @Body('recipient') recipient: string,
    @Body('method') method: 'email' | 'notification' | 'sms',
  ) {
    return this.calendarService.markRemindersSent(id, recipient, method);
  }

  @Post('/:id/checklist')
  @ApiOperation({ summary: 'Add checklist item' })
  async addChecklistItem(
    @Param('id') id: string,
    @Body('item') item: string,
    @Body('userId') userId: string,
  ) {
    return this.calendarService.addChecklistItem(id, item, userId);
  }

  @Put('/:id/checklist/:itemId/complete')
  @ApiOperation({ summary: 'Complete checklist item' })
  async completeChecklistItem(
    @Param('id') id: string,
    @Param('itemId') itemId: number,
    @Body('userId') userId: string,
  ) {
    return this.calendarService.completeChecklistItem(id, Number(itemId), userId);
  }
}
