jest.mock('../entities/dpia.entity');
jest.mock('../entities/processing-activity.entity');

import { DpiaService } from './dpia.service';
import { DpiaStatus } from '../entities/dpia-status.enum';
import { DpiaRiskLevel } from '../entities/dpia-risk-level.enum';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('DpiaService', () => {
  let service: DpiaService;
  let dpiaRepo: any;
  let activityRepo: any;

  beforeEach(() => {
    dpiaRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    activityRepo = {
      findOne: jest.fn(),
      update: jest.fn(),
    };
    service = new DpiaService(dpiaRepo, activityRepo);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createDpia', () => {
    it('should create DPIA when activity exists', async () => {
      activityRepo.findOne.mockResolvedValue({ id: 'act-1' });
      const mockCreated = { id: 'd1', activityId: 'act-1', status: DpiaStatus.DRAFT };
      dpiaRepo.create.mockReturnValue(mockCreated);
      dpiaRepo.save.mockResolvedValue(mockCreated);

      const dto = { activityId: 'act-1', riskLevel: DpiaRiskLevel.MEDIUM, createdBy: 'u1' };
      const result = await service.createDpia(dto);
      expect(result).toBe(mockCreated);
      expect(dpiaRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        activityId: 'act-1',
        riskLevel: DpiaRiskLevel.MEDIUM,
        consultedDpo: false,
        status: DpiaStatus.DRAFT,
      }));
    });

    it('should throw NotFoundException when activity not found', async () => {
      activityRepo.findOne.mockResolvedValue(null);
      await expect(service.createDpia({ activityId: 'nonexistent', riskLevel: DpiaRiskLevel.LOW, createdBy: 'u1' }))
        .rejects.toThrow(NotFoundException);
    });

    it('should set optional fields to null when not provided', async () => {
      activityRepo.findOne.mockResolvedValue({ id: 'act-1' });
      dpiaRepo.create.mockReturnValue({ id: 'd1' });
      dpiaRepo.save.mockResolvedValue({ id: 'd1' });
      await service.createDpia({ activityId: 'act-1', riskLevel: DpiaRiskLevel.LOW, createdBy: 'u1' });
      expect(dpiaRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        riskDescription: null,
        mitigationMeasures: null,
        residualRisk: null,
        dpoOpinion: null,
      }));
    });
  });

  describe('getById', () => {
    it('should return DPIA with activity relation', async () => {
      const mockDpia = { id: 'd1', activity: { id: 'act-1' } };
      dpiaRepo.findOne.mockResolvedValue(mockDpia);
      const result = await service.getById('d1');
      expect(result).toBe(mockDpia);
      expect(dpiaRepo.findOne).toHaveBeenCalledWith({ where: { id: 'd1' }, relations: { activity: true } });
    });

    it('should throw NotFoundException when not found', async () => {
      dpiaRepo.findOne.mockResolvedValue(null);
      await expect(service.getById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('evaluateRisk', () => {
    it('should update risk fields', async () => {
      const dpia = { id: 'd1', status: DpiaStatus.DRAFT, riskLevel: null, riskDescription: null, mitigationMeasures: null, residualRisk: null };
      dpiaRepo.findOne.mockResolvedValue(dpia);
      dpiaRepo.save.mockImplementation((e: any) => Promise.resolve(e));

      const result = await service.evaluateRisk('d1', DpiaRiskLevel.HIGH, 'desc', 'mitigation', DpiaRiskLevel.MEDIUM);
      expect(result.riskLevel).toBe(DpiaRiskLevel.HIGH);
      expect(result.riskDescription).toBe('desc');
      expect(result.mitigationMeasures).toBe('mitigation');
      expect(result.residualRisk).toBe(DpiaRiskLevel.MEDIUM);
    });

    it('should throw BadRequestException when DPIA is already approved', async () => {
      dpiaRepo.findOne.mockResolvedValue({ id: 'd1', status: DpiaStatus.APPROVED });
      await expect(service.evaluateRisk('d1', DpiaRiskLevel.LOW, 'd', 'm'))
        .rejects.toThrow(BadRequestException);
    });

    it('should not set residualRisk when not provided', async () => {
      const dpia = { id: 'd1', status: DpiaStatus.DRAFT, residualRisk: 'existing' };
      dpiaRepo.findOne.mockResolvedValue(dpia);
      dpiaRepo.save.mockImplementation((e: any) => Promise.resolve(e));
      const result = await service.evaluateRisk('d1', DpiaRiskLevel.LOW, 'd', 'm');
      expect(result.residualRisk).toBe('existing');
    });
  });

  describe('consultDpo', () => {
    it('should set consultedDpo true and status IN_REVIEW', async () => {
      const dpia = { id: 'd1', riskLevel: DpiaRiskLevel.HIGH, consultedDpo: false, status: DpiaStatus.DRAFT };
      dpiaRepo.findOne.mockResolvedValue(dpia);
      dpiaRepo.save.mockImplementation((e: any) => Promise.resolve(e));
      const result = await service.consultDpo('d1', 'DPO approves with conditions');
      expect(result.consultedDpo).toBe(true);
      expect(result.dpoOpinion).toBe('DPO approves with conditions');
      expect(result.status).toBe(DpiaStatus.IN_REVIEW);
    });
  });

  describe('reviewDpia', () => {
    it('should approve DPIA and mark activity as dpoApproved', async () => {
      const dpia = { id: 'd1', activityId: 'act-1', status: DpiaStatus.IN_REVIEW, riskLevel: DpiaRiskLevel.LOW, consultedDpo: false };
      dpiaRepo.findOne.mockResolvedValue(dpia);
      dpiaRepo.save.mockImplementation((e: any) => Promise.resolve(e));
      activityRepo.update.mockResolvedValue({ affected: 1 });

      const result = await service.reviewDpia('d1', { status: DpiaStatus.APPROVED });
      expect(result.status).toBe(DpiaStatus.APPROVED);
      expect(activityRepo.update).toHaveBeenCalledWith({ id: 'act-1' }, { dpoApproved: true });
    });

    it('should throw BadRequestException approving high-risk without DPO consultation', async () => {
      dpiaRepo.findOne.mockResolvedValue({ id: 'd1', riskLevel: DpiaRiskLevel.HIGH, consultedDpo: false, status: DpiaStatus.IN_REVIEW });
      await expect(service.reviewDpia('d1', { status: DpiaStatus.APPROVED }))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when already approved', async () => {
      dpiaRepo.findOne.mockResolvedValue({ id: 'd1', status: DpiaStatus.APPROVED });
      await expect(service.reviewDpia('d1', { status: DpiaStatus.REJECTED }))
        .rejects.toThrow(BadRequestException);
    });

    it('should update optional fields when provided', async () => {
      const dpia = { id: 'd1', status: DpiaStatus.DRAFT, consultedDpo: false, dpoOpinion: null, residualRisk: null };
      dpiaRepo.findOne.mockResolvedValue(dpia);
      dpiaRepo.save.mockImplementation((e: any) => Promise.resolve(e));
      const result = await service.reviewDpia('d1', { consultedDpo: true, dpoOpinion: 'ok', residualRisk: DpiaRiskLevel.LOW });
      expect(result.consultedDpo).toBe(true);
      expect(result.dpoOpinion).toBe('ok');
      expect(result.residualRisk).toBe(DpiaRiskLevel.LOW);
    });
  });

  describe('listDpias', () => {
    it('should return all DPIAs without filter', async () => {
      const mockDpias = [{ id: 'd1' }];
      dpiaRepo.find.mockResolvedValue(mockDpias);
      const result = await service.listDpias();
      expect(result).toBe(mockDpias);
      expect(dpiaRepo.find).toHaveBeenCalledWith({ where: {}, relations: { activity: true }, order: { createdAt: 'DESC' } });
    });

    it('should filter by status', async () => {
      dpiaRepo.find.mockResolvedValue([]);
      await service.listDpias(DpiaStatus.DRAFT);
      expect(dpiaRepo.find).toHaveBeenCalledWith({ where: { status: DpiaStatus.DRAFT }, relations: { activity: true }, order: { createdAt: 'DESC' } });
    });
  });

  describe('listHighRiskPending', () => {
    it('should return high-risk DPIAs in DRAFT status', async () => {
      const mockDpias = [{ id: 'd1', riskLevel: DpiaRiskLevel.HIGH }];
      dpiaRepo.find.mockResolvedValue(mockDpias);
      const result = await service.listHighRiskPending();
      expect(result).toBe(mockDpias);
      expect(dpiaRepo.find).toHaveBeenCalledWith({
        where: { riskLevel: DpiaRiskLevel.HIGH, status: DpiaStatus.DRAFT },
        relations: { activity: true },
        order: { createdAt: 'ASC' },
      });
    });
  });

  describe('notifySupervisoryAuthority', () => {
    it('should set supervisoryAuthorityNotified true for high-risk with DPO consultation', async () => {
      const dpia = { id: 'd1', riskLevel: DpiaRiskLevel.HIGH, consultedDpo: true, supervisoryAuthorityNotified: false };
      dpiaRepo.findOne.mockResolvedValue(dpia);
      dpiaRepo.save.mockImplementation((e: any) => Promise.resolve(e));
      const result = await service.notifySupervisoryAuthority('d1');
      expect(result.supervisoryAuthorityNotified).toBe(true);
    });

    it('should throw BadRequestException when risk is not high', async () => {
      dpiaRepo.findOne.mockResolvedValue({ id: 'd1', riskLevel: DpiaRiskLevel.LOW, consultedDpo: true });
      await expect(service.notifySupervisoryAuthority('d1')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when DPO not consulted', async () => {
      dpiaRepo.findOne.mockResolvedValue({ id: 'd1', riskLevel: DpiaRiskLevel.HIGH, consultedDpo: false });
      await expect(service.notifySupervisoryAuthority('d1')).rejects.toThrow(BadRequestException);
    });
  });
});
