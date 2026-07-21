import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MobileWidgetConfig } from '../entities/mobile-widget-config.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(MobileWidgetConfig)
    private readonly widgetRepo: Repository<MobileWidgetConfig>,
  ) {}

  async getUnifiedDashboard(userId: string) {
    const widgets = await this.widgetRepo.find({
      where: { userId },
      order: { displayOrder: 'ASC' },
    });

    return {
      userId,
      widgets: widgets.map((w) => ({
        id: w.id,
        type: w.widgetType,
        isVisible: w.isVisible,
        size: w.sizePreference,
        displayOrder: w.displayOrder,
        data: w.dataCacheJson || null,
      })),
      lastRefreshed: new Date(),
    };
  }

  async updateWidgetConfiguration(
    userId: string,
    widgetId: string,
    updates: Partial<Pick<
      MobileWidgetConfig,
      'isVisible' | 'displayOrder' | 'sizePreference' | 'configurationJson' | 'dataCacheJson'
    >>,
  ): Promise<MobileWidgetConfig> {
    const widget = await this.widgetRepo.findOne({
      where: { id: widgetId, userId },
    });

    if (!widget) {
      throw new NotFoundException('Widget not found');
    }

    Object.assign(widget, updates);
    return this.widgetRepo.save(widget);
  }

  async reorderWidgets(
    userId: string,
    reorderedIds: string[],
  ): Promise<MobileWidgetConfig[]> {
    const widgets = await this.widgetRepo.find({
      where: { userId },
    });

    const widgetMap = new Map(widgets.map((w) => [w.id, w]));

    for (let i = 0; i < reorderedIds.length; i++) {
      const widget = widgetMap.get(reorderedIds[i]);
      if (widget) {
        widget.displayOrder = i;
      }
    }

    await this.widgetRepo.save(Array.from(widgetMap.values()));

    return Array.from(widgetMap.values()).sort((a, b) => a.displayOrder - b.displayOrder);
  }
}
