import { PaymentInstructionService } from './payment-instruction.service';
import { NotFoundException } from '@nestjs/common';

jest.mock('../entities/pay-instruction.entity');

describe('PaymentInstructionService', () => {
  let service: PaymentInstructionService;
  let mockRepo: any;

  beforeEach(() => {
    mockRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn(),
      }),
    };
    service = new PaymentInstructionService(mockRepo);
  });

  describe('create', () => {
    it('should create instruction with pending status and generated number', async () => {
      const created = { id: 'pi-1' };
      mockRepo.create.mockReturnValue(created);
      mockRepo.save.mockResolvedValue(created);

      const result = await service.create({ amountOriginal: 5000 } as any);

      expect(result).toEqual(created);
      const arg = mockRepo.create.mock.calls[0][0];
      expect(arg.instructionNumber).toMatch(/^PI-\d{6}-\d{5}$/);
      expect(arg.approvalStatus).toBe('pending');
      expect(arg.currentApproverLevel).toBe(1);
      expect(arg.statusHistory).toHaveLength(1);
      expect(arg.statusHistory[0].status).toBe('created');
    });

    it('should set 1 approval level for amounts <= 100000', async () => {
      mockRepo.create.mockReturnValue({});
      mockRepo.save.mockResolvedValue({});

      await service.create({ amountOriginal: 50000 } as any);

      expect(mockRepo.create.mock.calls[0][0].totalApprovalLevels).toBe(1);
    });

    it('should set 2 approval levels for amounts > 100000', async () => {
      mockRepo.create.mockReturnValue({});
      mockRepo.save.mockResolvedValue({});

      await service.create({ amountOriginal: 500000 } as any);

      expect(mockRepo.create.mock.calls[0][0].totalApprovalLevels).toBe(2);
    });

    it('should set 3 approval levels for amounts > 1000000', async () => {
      mockRepo.create.mockReturnValue({});
      mockRepo.save.mockResolvedValue({});

      await service.create({ amountOriginal: 5000000 } as any);

      expect(mockRepo.create.mock.calls[0][0].totalApprovalLevels).toBe(3);
    });
  });

  describe('findById', () => {
    it('should return instruction when found', async () => {
      const instr = { id: 'pi-1' };
      mockRepo.findOne.mockResolvedValue(instr);
      expect(await service.findById('pi-1')).toEqual(instr);
    });

    it('should return null when not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      expect(await service.findById('missing')).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should apply status filter when provided', async () => {
      mockRepo.createQueryBuilder().getMany.mockResolvedValue([]);
      await service.findAll({ status: 'pending' });
      expect(mockRepo.createQueryBuilder().where).toHaveBeenCalledWith('instr.approvalStatus = :status', { status: 'pending' });
    });

    it('should apply from date filter when provided', async () => {
      mockRepo.createQueryBuilder().getMany.mockResolvedValue([]);
      const fromDate = new Date('2026-01-01');
      await service.findAll({ from: fromDate });
      expect(mockRepo.createQueryBuilder().andWhere).toHaveBeenCalledWith('instr.createdAt >= :from', { from: fromDate });
    });

    it('should apply to date filter when provided', async () => {
      mockRepo.createQueryBuilder().getMany.mockResolvedValue([]);
      const toDate = new Date('2026-12-31');
      await service.findAll({ to: toDate });
      expect(mockRepo.createQueryBuilder().andWhere).toHaveBeenCalledWith('instr.createdAt <= :to', { to: toDate });
    });

    it('should order by createdAt DESC', async () => {
      mockRepo.createQueryBuilder().getMany.mockResolvedValue([]);
      await service.findAll();
      expect(mockRepo.createQueryBuilder().orderBy).toHaveBeenCalledWith('instr.createdAt', 'DESC');
    });

    it('should return empty array when no instructions', async () => {
      mockRepo.createQueryBuilder().getMany.mockResolvedValue([]);
      expect(await service.findAll()).toEqual([]);
    });
  });

  describe('approve', () => {
    it('should increment approver level and set approving status', async () => {
      const instr = { id: 'pi-1', currentApproverLevel: 1, totalApprovalLevels: 3, statusHistory: [{ status: 'created' }] };
      mockRepo.findOne.mockResolvedValue(instr);

      await service.approve('pi-1', { authorizedBy: 'user-1' } as any);

      const arg = mockRepo.update.mock.calls[0][1];
      expect(arg.currentApproverLevel).toBe(2);
      expect(arg.approvalStatus).toBe('approving');
      expect(arg.authorizedBy).toBe('user-1');
      expect(arg.authorizedAt).toBeInstanceOf(Date);
    });

    it('should set approved status when reaching final level', async () => {
      const instr = { id: 'pi-1', currentApproverLevel: 2, totalApprovalLevels: 3, statusHistory: [] };
      mockRepo.findOne.mockResolvedValue(instr);

      await service.approve('pi-1', { authorizedBy: 'user-1' } as any);

      const arg = mockRepo.update.mock.calls[0][1];
      expect(arg.currentApproverLevel).toBe(3);
      expect(arg.approvalStatus).toBe('approved');
    });

    it('should append to statusHistory', async () => {
      const instr = { id: 'pi-1', currentApproverLevel: 1, totalApprovalLevels: 2, statusHistory: [{ status: 'created' }] };
      mockRepo.findOne.mockResolvedValue(instr);

      await service.approve('pi-1', { authorizedBy: 'user-1' } as any);

      const arg = mockRepo.update.mock.calls[0][1];
      expect(arg.statusHistory).toHaveLength(2);
      expect(arg.statusHistory[1].status).toBe('approved_level_2');
    });

    it('should throw NotFoundException when instruction not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.approve('missing', { authorizedBy: 'x' } as any)).rejects.toThrow(NotFoundException);
    });
  });

  describe('reject', () => {
    it('should set status to rejected', async () => {
      await service.reject('pi-1', 'fraud suspected');
      const arg = mockRepo.update.mock.calls[0][1];
      expect(arg.approvalStatus).toBe('rejected');
      expect(arg.statusHistory).toHaveLength(1);
      expect(arg.statusHistory[0].status).toBe('rejected');
    });
  });

  describe('cancel', () => {
    it('should set status to cancelled', async () => {
      mockRepo.findOne.mockResolvedValue({ id: 'pi-1', approvalStatus: 'pending', statusHistory: [] });
      await service.cancel('pi-1');
      const arg = mockRepo.update.mock.calls[0][1];
      expect(arg.approvalStatus).toBe('cancelled');
    });

    it('should throw Error when instruction is executing', async () => {
      mockRepo.findOne.mockResolvedValue({ id: 'pi-1', approvalStatus: 'executing', statusHistory: [] });
      await expect(service.cancel('pi-1')).rejects.toThrow('Cannot cancel instruction already in execution');
    });

    it('should throw Error when instruction is completed', async () => {
      mockRepo.findOne.mockResolvedValue({ id: 'pi-1', approvalStatus: 'completed', statusHistory: [] });
      await expect(service.cancel('pi-1')).rejects.toThrow('Cannot cancel instruction already in execution');
    });

    it('should throw NotFoundException when instruction not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.cancel('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('execute', () => {
    it('should set status to executing and generate bank reference', async () => {
      mockRepo.findOne.mockResolvedValue({ id: 'pi-1', approvalStatus: 'approved', statusHistory: [] });

      await service.execute('pi-1', {} as any);

      const arg = mockRepo.update.mock.calls[0][1];
      expect(arg.approvalStatus).toBe('executing');
      expect(arg.bankingChannelReference).toMatch(/^BNK-\d+-/);
      expect(arg.statusHistory).toHaveLength(1);
      expect(arg.statusHistory[0].status).toBe('executing');
    });

    it('should throw Error when instruction is not approved', async () => {
      mockRepo.findOne.mockResolvedValue({ id: 'pi-1', approvalStatus: 'pending', statusHistory: [] });
      await expect(service.execute('pi-1', {} as any)).rejects.toThrow('Instruction must be approved before execution');
    });

    it('should throw NotFoundException when instruction not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.execute('missing', {} as any)).rejects.toThrow(NotFoundException);
    });
  });
});
