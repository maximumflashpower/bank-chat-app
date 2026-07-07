import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../identity/guards/jwt-auth.guard';
import { RolesGuard } from '../../identity/guards/roles.guard';
import { Roles } from '../../identity/decorators/roles.decorator';
import { RoleType } from '../../identity/entities/role.enum';
import { MonthEndCloseService } from '../services/month-end-close.service';

@Controller('api/v1/accounting/close')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CloseController {
  constructor(
    private closeService: MonthEndCloseService,
  ) {}

  @Post('start-month-end')
  @Roles(RoleType.MANAGER)
  async startMonthEnd(@Body() body: { year: number; month: number }): Promise<any> {
    return this.closeService.startMonthEnd(body.year, body.month);
  }

  @Get('status')
  @Roles(RoleType.MANAGER)
  async getStatus(@Body() body: { periodId: string }): Promise<any> {
    return this.closeService.getStatus(body.periodId);
  }

  @Get('tasks-pending')
  @Roles(RoleType.MANAGER)
  async getPendingTasks(@Body() body: { periodId: string }): Promise<any[]> {
    return this.closeService.getPendingTasks(body.periodId);
  }

  @Post('task/:id/complete')
  @Roles(RoleType.MANAGER)
  async completeTask(@Param('id') taskId: string): Promise<void> {
    await this.closeService.markTaskComplete(taskId);
  }
}
