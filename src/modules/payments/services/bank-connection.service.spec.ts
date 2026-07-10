import { BankConnectionService } from './bank-connection.service';
import { NotFoundException } from '@nestjs/common';

jest.mock('../entities/bank-connection-config.entity');

describe('BankConnectionService', () => {
  let service: BankConnectionService;
  let mockRepo: any;

  beforeEach(() => {
    mockRepo = { create: jest.fn(), save: jest.fn(), find: jest.fn(), findOne: jest.fn(), update: jest.fn() };
    service = new BankConnectionService(mockRepo);
  });

  describe('create', () => {
    it('should create with DISCONNECTED status and defaults', async () => {
      const created = { id: 'conn-1' };
      mockRepo.create.mockReturnValue(created);
      mockRepo.save.mockResolvedValue(created);

      const result = await service.create({ bankName: 'HSBC' });

      expect(result).toEqual(created);
      const arg = mockRepo.create.mock.calls[0][0];
      expect(arg.connectionStatus).toBe('DISCONNECTED');
      expect(arg.pollFrequencyMinutes).toBe(15);
      expect(arg.failoverEnabled).toBe(true);
      expect(arg.bankName).toBe('HSBC');
    });
  });

  describe('findAll', () => {
    it('should return all connections', async () => {
      const conns = [{ id: 'conn-1' }];
      mockRepo.find.mockResolvedValue(conns);
      expect(await service.findAll()).toEqual(conns);
    });
  });

  describe('findById', () => {
    it('should return connection when found', async () => {
      const conn = { id: 'conn-1' };
      mockRepo.findOne.mockResolvedValue(conn);
      expect(await service.findById('conn-1')).toEqual(conn);
    });

    it('should return null when not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      expect(await service.findById('missing')).toBeNull();
    });
  });

  describe('updateStatus', () => {
    it('should update status to ACTIVE with lastSuccessfulPoll', async () => {
      await service.updateStatus('conn-1', 'ACTIVE');
      const arg = mockRepo.update.mock.calls[0][1];
      expect(arg.connectionStatus).toBe('ACTIVE');
      expect(arg.lastSuccessfulPoll).toBeInstanceOf(Date);
    });

    it('should not set lastSuccessfulPoll for non-ACTIVE status', async () => {
      await service.updateStatus('conn-1', 'ERROR');
      const arg = mockRepo.update.mock.calls[0][1];
      expect(arg.connectionStatus).toBe('ERROR');
      expect(arg.lastSuccessfulPoll).toBeUndefined();
    });
  });

  describe('testConnection', () => {
    it('should activate connection when test succeeds', async () => {
      mockRepo.findOne.mockResolvedValue({ id: 'conn-1' });
      jest.spyOn(Math, 'random').mockReturnValue(0.5);

      const result = await service.testConnection({ connectionId: 'conn-1' } as any);

      expect(result.success).toBe(true);
      expect(result.status).toBe('ACTIVE');
      expect(result.responseTime).toBeGreaterThan(0);
      expect(mockRepo.update).toHaveBeenCalledWith('conn-1', expect.objectContaining({ connectionStatus: 'ACTIVE' }));
    });

    it('should set ERROR status when test fails', async () => {
      mockRepo.findOne.mockResolvedValue({ id: 'conn-1' });
      jest.spyOn(Math, 'random').mockReturnValue(0.05);

      const result = await service.testConnection({ connectionId: 'conn-1' } as any);

      expect(result.success).toBe(false);
      expect(result.responseTime).toBe(0);
      expect(result.status).toBe('ERROR');
      expect(mockRepo.update).toHaveBeenCalledWith('conn-1', expect.objectContaining({ connectionStatus: 'ERROR' }));
    });

    it('should throw NotFoundException when connection not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.testConnection({ connectionId: 'missing' } as any)).rejects.toThrow(NotFoundException);
    });
  });

  describe('checkDailyVolume', () => {
    it('should return withinLimit=true when amount under remaining', async () => {
      mockRepo.findOne.mockResolvedValue({ id: 'conn-1', dailyVolumeLimit: 100000, remainingDailyVolume: 50000 });

      const result = await service.checkDailyVolume('conn-1', 30000);

      expect(result.withinLimit).toBe(true);
      expect(result.remaining).toBe(50000);
      expect(result.dailyLimit).toBe(100000);
    });

    it('should return withinLimit=false when amount exceeds remaining', async () => {
      mockRepo.findOne.mockResolvedValue({ id: 'conn-1', dailyVolumeLimit: 100000, remainingDailyVolume: 50000 });

      const result = await service.checkDailyVolume('conn-1', 60000);

      expect(result.withinLimit).toBe(false);
    });

    it('should default to 0 when dailyVolumeLimit is null', async () => {
      mockRepo.findOne.mockResolvedValue({ id: 'conn-1', dailyVolumeLimit: null, remainingDailyVolume: null });

      const result = await service.checkDailyVolume('conn-1', 100);

      expect(result.dailyLimit).toBe(0);
      expect(result.remaining).toBe(0);
      expect(result.withinLimit).toBe(false);
    });

    it('should throw NotFoundException when connection not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.checkDailyVolume('missing', 100)).rejects.toThrow(NotFoundException);
    });
  });

  describe('resetDailyLimits', () => {
    it('should reset remainingDailyVolume for connections with limits', async () => {
      const conns = [
        { id: 'c1', dailyVolumeLimit: 100000, remainingDailyVolume: 50000 },
        { id: 'c2', dailyVolumeLimit: 200000, remainingDailyVolume: 0 },
        { id: 'c3', dailyVolumeLimit: null, remainingDailyVolume: 0 },
      ];
      mockRepo.find.mockResolvedValue(conns);

      const result = await service.resetDailyLimits();

      expect(result).toBe(2);
      expect(mockRepo.update).toHaveBeenCalledTimes(2);
      expect(mockRepo.update).toHaveBeenCalledWith('c1', { remainingDailyVolume: 100000 });
      expect(mockRepo.update).toHaveBeenCalledWith('c2', { remainingDailyVolume: 200000 });
    });

    it('should return 0 when no connections have limits', async () => {
      mockRepo.find.mockResolvedValue([{ id: 'c1', dailyVolumeLimit: null }]);
      expect(await service.resetDailyLimits()).toBe(0);
      expect(mockRepo.update).not.toHaveBeenCalled();
    });
  });
});
