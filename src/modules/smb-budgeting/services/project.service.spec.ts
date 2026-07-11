import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectService } from './project.service';
import { ProjectRegistry } from '../entities/project-registry.entity';
import { ProjectStatus } from '../entities/project-status.enum';
import { ProjectRisk } from '../entities/project-risk.enum';
import { NotFoundException } from '@nestjs/common';

describe('ProjectService', () => {
  let service: ProjectService;
  let repo: Repository<ProjectRegistry>;

  const mockProject = {
    id: 'project-uuid-1',
    companyId: 'company-uuid-1',
    projectName: 'Website Redesign',
    description: 'Complete redesign',
    status: ProjectStatus.INITIATING,
    riskLevel: ProjectRisk.MEDIUM,
    startDate: new Date('2026-01-01'),
    endDate: new Date('2026-06-30'),
    budgetedAmount: 50000,
    actualCost: 0,
    profitabilityPercentage: 0,
    projectManager: 'Jane Doe',
    milestones: {},
    stakeholders: ['Jane', 'John'],
    notes: 'Important project',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectService,
        {
          provide: getRepositoryToken(ProjectRegistry),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            delete: jest.fn()
          }
        }
      ]
    }).compile();

    service = module.get<ProjectService>(ProjectService);
    repo = module.get<Repository<ProjectRegistry>>(getRepositoryToken(ProjectRegistry));
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('should create a project successfully', async () => {
      const dto = {
        companyId: 'company-uuid-1',
        projectName: 'Website Redesign',
        description: 'Complete redesign',
        startDate: '2026-01-01',
        endDate: '2026-06-30',
        budgetedAmount: 50000
      };

      jest.spyOn(repo, 'create').mockReturnValue(mockProject as any);
      jest.spyOn(repo, 'save').mockImplementation(async (entity: any) => entity);

      const result = await service.create(dto);

      expect(repo.create).toHaveBeenCalledWith({});
      expect(result.projectName).toBe('Website Redesign');
    });

    it('should default status to INITIATING', async () => {
      const dto = { companyId: 'c1', projectName: 'Test', description: 'Desc' };

      jest.spyOn(repo, 'create').mockReturnValue({} as any);
      jest.spyOn(repo, 'save').mockImplementation(async (entity: any) => entity);

      await service.create(dto);

      expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({
        status: ProjectStatus.INITIATING
      }));
    });
  });

  describe('findAll', () => {
    it('should return all projects for a company', async () => {
      jest.spyOn(repo, 'find').mockResolvedValue([mockProject] as any);
      const result = await service.findAll('company-uuid-1');
      expect(result).toHaveLength(1);
    });
  });

  describe('findById', () => {
    it('should return project by id', async () => {
      jest.spyOn(repo, 'findOne').mockResolvedValue(mockProject as any);
      const result = await service.findById('project-uuid-1');
      expect(result).toEqual(mockProject);
    });

    it('should throw NotFoundException if not found', async () => {
      jest.spyOn(repo, 'findOne').mockResolvedValue(null);
      await expect(service.findById('nope')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update project fields', async () => {
      jest.spyOn(repo, 'findOne').mockResolvedValue(mockProject as any);
      jest.spyOn(repo, 'save').mockImplementation(async (entity: any) => entity);
      const result = await service.update('project-uuid-1', { projectName: 'Updated' });
      expect(result.projectName).toBe('Updated');
    });
  });

  describe('updateStatus', () => {
    it('should update project status', async () => {
      jest.spyOn(repo, 'findOne').mockResolvedValue(mockProject as any);
      jest.spyOn(repo, 'save').mockImplementation(async (entity: any) => entity);
      const result = await service.updateStatus('project-uuid-1', ProjectStatus.EXECUTING);
      expect(result.status).toBe(ProjectStatus.EXECUTING);
    });
  });

  describe('getProfitability', () => {
    it('should calculate profitability correctly', async () => {
      const project = { ...mockProject, budgetedAmount: 50000, actualCost: 30000 };
      jest.spyOn(repo, 'findOne').mockResolvedValue(project as any);
      const result = await service.getProfitability('project-uuid-1');
      expect(result.budgeted).toBe(50000);
      expect(result.actual).toBe(30000);
      expect(result.variance).toBe(20000);
      expect(result.profitabilityPercentage).toBe(40);
    });

    it('should handle zero budget', async () => {
      const project = { ...mockProject, budgetedAmount: 0, actualCost: 0 };
      jest.spyOn(repo, 'findOne').mockResolvedValue(project as any);
      const result = await service.getProfitability('project-uuid-1');
      expect(result.profitabilityPercentage).toBe(0);
    });
  });

  describe('updateBudget', () => {
    it('should update project budget', async () => {
      jest.spyOn(repo, 'findOne').mockResolvedValue(mockProject as any);
      jest.spyOn(repo, 'save').mockImplementation(async (entity: any) => entity);
      const result = await service.updateBudget('project-uuid-1', 75000);
      expect(result.budgetedAmount).toBe(75000);
    });
  });

  describe('logExpense', () => {
    it('should add expense to actualCost', async () => {
      jest.spyOn(repo, 'findOne').mockResolvedValue(mockProject as any);
      jest.spyOn(repo, 'save').mockImplementation(async (entity: any) => entity);
      const result = await service.logExpense('project-uuid-1', 5000);
      expect(result.actualCost).toBe(5000);
    });

    it('should accumulate expenses', async () => {
      const project = { ...mockProject, actualCost: 10000 };
      jest.spyOn(repo, 'findOne').mockResolvedValue(project as any);
      jest.spyOn(repo, 'save').mockImplementation(async (entity: any) => entity);
      const result = await service.logExpense('project-uuid-1', 5000);
      expect(result.actualCost).toBe(15000);
    });
  });

  describe('delete', () => {
    it('should delete project', async () => {
      jest.spyOn(repo, 'delete').mockResolvedValue({ affected: 1 } as any);
      await service.delete('project-uuid-1');
      expect(repo.delete).toHaveBeenCalledWith('project-uuid-1');
    });
  });
});
