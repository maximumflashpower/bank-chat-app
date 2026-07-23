import { Controller, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { DashboardService } from '../services/dashboard.service';
import { AuthGuard } from '@nestjs/passport';

interface WidgetConfigDto {
  isVisible?: boolean;
  displayOrder?: number;
  sizePreference?: string;
  configurationJson?: Record<string, any>;
  dataCacheJson?: Record<string, any>;
}

@Controller('v1/mobile')
@UseGuards(AuthGuard('jwt'))
export class MobileDashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('/dashboard')
  async getDashboard() {
    const userId = 'user-from-jwt';
    return this.dashboardService.getUnifiedDashboard(userId);
  }

  @Put('/dashboard/widgets/:widgetId')
  async updateWidget(
    @Param('widgetId') widgetId: string,
    @Body() updates: WidgetConfigDto,
  ) {
    const userId = 'user-from-jwt';
    return this.dashboardService.updateWidgetConfiguration(userId, widgetId, updates);
  }

  @Put('/dashboard/widgets/reorder')
  async reorderWidgets(@Body() reorderedIds: string[]) {
    const userId = 'user-from-jwt';
    return this.dashboardService.reorderWidgets(userId, reorderedIds);
  }
}
