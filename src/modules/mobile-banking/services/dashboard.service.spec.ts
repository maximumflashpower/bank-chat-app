import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { Repository } from 'typeorm';
import { MobileWidgetConfig } from '../entities/mobile-widget-config.entity';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('DashboardService', () => {
  let service: DashboardService;
  let widgetRepo: Repository<MobileWidgetConfig>;

  const mockWidget = {
    id: 'widget-1',
    userId: 'user-1',
    widgetType: 'account_summary',
    displayOrder: 1,
    isVisible: true,
    sizePreference: 'medium',
    configurationJson: {},
    dataCacheJson: { balance: 5000 },
    lastRefreshedAt: new Date(),
    updatedAt: new Date(),
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: getRepositoryToken(MobileWidgetConfig),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    widgetRepo = module.get<Repository<MobileWidgetConfig>>(getRepositoryToken(MobileWidgetConfig));
  });

  describe('getUnifiedDashboard', () => {
    it('should return user widgets ordered by displayOrder', async () => {
      jest.spyOn(widgetRepo, 'find').mockResolvedValue([mockWidget, { ...mockWidget, id: 'widget-2', displayOrder: 2 }]);

      const result = await service.getUnifiedDashboard('user-1');

      expect(result.userId).toBe('user-1');
      expect(result.widgets).toHaveLength(2);
      expect(result.widgets[0].displayOrder).toBe(1);
      expect(result.widgets[0].data).toEqual({ balance: 5000 });
      expect(widgetRepo.find).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        order: { displayOrder: 'ASC' },
      });
    });

    it('should return empty array if no widgets configured', async () => {
      jest.spyOn(widgetRepo, 'find').mockResolvedValue([]);

      const result = await service.getUnifiedDashboard('user-1');

      expect(result.widgets).toHaveLength(0);
    });
  });

  describe('updateWidgetConfiguration', () => {
    it('should update widget configuration successfully', async () => {
      jest.spyOn(widgetRepo, 'findOne').mockResolvedValue(mockWidget as any);
      jest.spyOn(widgetRepo, 'save').mockResolvedValue({ ...mockWidget, isVisible: false } as any);

      const result = await service.updateWidgetConfiguration('user-1', 'widget-1', { isVisible: false });

      expect(result.isVisible).toBe(false);
      expect(widgetRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'widget-1', userId: 'user-1' },
      });
      expect(widgetRepo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if widget not found', async () => {
      jest.spyOn(widgetRepo, 'findOne').mockResolvedValue(null);

      await expect(service.updateWidgetConfiguration('user-1', 'widget-999', { isVisible: false }))
        .rejects.toThrow('Widget not found');
    });
  });

  describe('reorderWidgets', () => {
    it('should reorder widgets by provided IDs', async () => {
      const widgets = [
        { ...mockWidget, id: 'widget-2', displayOrder: 1 },
        { ...mockWidget, id: 'widget-1', displayOrder: 0 },
      ];
      jest.spyOn(widgetRepo, 'find').mockResolvedValue(widgets);
      jest.spyOn(widgetRepo, 'save').mockResolvedValue([...widgets] as any);

      const result = await service.reorderWidgets('user-1', ['widget-1', 'widget-2']);

      expect(result).toHaveLength(2);
      expect(widgetRepo.save).toHaveBeenCalled();
      expect(result[0].id).toBe('widget-1');
      expect(result[0].displayOrder).toBe(0);
    });
  });
});
