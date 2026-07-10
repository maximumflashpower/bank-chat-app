import { ChangeManagementService } from './change-management.service';
import { Repository } from 'typeorm';
import { ChangeRequest } from '../entities/change-request.entity';
import { FeatureFlag } from '../entities/feature-flag.entity';
import { ChangeStatus } from '../entities/change-status.enum';
import { ChangeImpact } from '../entities/change-impact.enum';
import { CreateChangeRequestDto } from '../dto/create-change-request.dto';
import { ReviewChangeDto } from '../dto/review-change.dto';
import { CreateFeatureFlagDto } from '../dto/create-feature-flag.dto';

jest.mock('../entities/change-request.entity');
jest.mock('../entities/feature-flag.entity');

describe('ChangeManagementService', () => {
  let service: ChangeManagementService;
  let mockChangeRepo: Partial<Repository<ChangeRequest>>;
  let mockFlagRepo: Partial<Repository<FeatureFlag>>;

  const now = new Date(2026, 6, 10, 12, 0, 0);

  beforeEach(() => {
    mockChangeRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      count: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    mockFlagRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
    };

    (mockChangeRepo.create as jest.Mock).mockReturnValue({ createdAt: now, updatedAt: now });
    (mockFlagRepo.create as jest.Mock).mockReturnValue({ createdAt: now, updatedAt: now });

    service = new ChangeManagementService(
      mockChangeRepo as Repository<ChangeRequest>,
      mockFlagRepo as Repository<FeatureFlag>,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('createChangeRequest (CHG-MGMT-001)', () => {
    it('debe crear y guardar un change request con valores por defecto', async () => {
      const dto: CreateChangeRequestDto = {
        title: 'DB Migration',
        description: 'Migrate users table',
        impactLevel: ChangeImpact.HIGH,
        rollbackPlan: 'Detailed rollback steps here...',
      };

      const saved: any = {
        id: 'chg-001',
        ...dto,
        status: ChangeStatus.SUBMITTED,
        riskScore: 0,
        featureFlag: null,
        rolloutPct: 0,
        cabApprovedBy: null,
        createdBy: 'user-001',
        implementedAt: null,
        createdAt: now,
        updatedAt: now,
      };

      (mockChangeRepo.create as jest.Mock).mockReturnValue(saved);
      (mockChangeRepo.save as jest.Mock).mockResolvedValue(saved);

      const result = await service.createChangeRequest(dto, 'user-001');

      expect(mockChangeRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        title: 'DB Migration',
        impactLevel: ChangeImpact.HIGH,
        status: ChangeStatus.SUBMITTED,
      }));
      expect(mockChangeRepo.save).toHaveBeenCalled();
      expect(result.id).toBe('chg-001');
    });

    it('debe usar valores por defecto cuando impactLevel y riskScore no se proveen', async () => {
      const dto: CreateChangeRequestDto = {
        title: 'Config Update',
        description: 'Update API timeout',
      };

      const saved: any = {
        id: 'chg-002',
        title: 'Config Update',
        description: 'Update API timeout',
        impactLevel: ChangeImpact.MEDIUM,
        riskScore: 0,
        status: ChangeStatus.SUBMITTED,
        rollbackPlan: null,
        featureFlag: null,
        createdAt: now,
        updatedAt: now,
      };

      (mockChangeRepo.create as jest.Mock).mockReturnValue(saved);
      (mockChangeRepo.save as jest.Mock).mockResolvedValue(saved);

      const result = await service.createChangeRequest(dto, 'user-002');

      expect(result.impactLevel).toBe(ChangeImpact.MEDIUM);
      expect(result.status).toBe(ChangeStatus.SUBMITTED);
    });
  });

  describe('reviewChange (CHG-MGMT-002)', () => {
    it('debe aprobar un change request SUBMITTED', async () => {
      const change: any = {
        id: 'chg-003',
        status: ChangeStatus.SUBMITTED,
        description: 'Original desc',
        createdAt: now,
        updatedAt: now,
      };

      const reviewDto: ReviewChangeDto = {
        status: ChangeStatus.APPROVED,
        reviewComment: 'Looks good',
      };

      (mockChangeRepo.findOne as jest.Mock).mockResolvedValue(change);
      (mockChangeRepo.save as jest.Mock).mockResolvedValue({
        ...change,
        status: ChangeStatus.APPROVED,
        cabApprovedBy: 'reviewer-001',
        description: 'Original desc\n\n[CAB Review]: Looks good',
      });

      const result = await service.reviewChange('chg-003', reviewDto, 'reviewer-001');

      expect(result.status).toBe(ChangeStatus.APPROVED);
      expect(result.cabApprovedBy).toBe('reviewer-001');
      expect(result.description).toContain('[CAB Review]');
    });

    it('debe rechazar un change request', async () => {
      const change: any = {
        id: 'chg-004',
        status: ChangeStatus.SUBMITTED,
        createdAt: now,
        updatedAt: now,
      };

      const reviewDto: ReviewChangeDto = {
        status: ChangeStatus.REJECTED,
      };

      (mockChangeRepo.findOne as jest.Mock).mockResolvedValue(change);
      (mockChangeRepo.save as jest.Mock).mockResolvedValue({
        ...change,
        status: ChangeStatus.REJECTED,
        cabApprovedBy: 'reviewer-001',
      });

      const result = await service.reviewChange('chg-004', reviewDto, 'reviewer-001');

      expect(result.status).toBe(ChangeStatus.REJECTED);
    });

    it('debe lanzar error si el status no es SUBMITTED', async () => {
      const change: any = {
        id: 'chg-005',
        status: ChangeStatus.APPROVED,
        createdAt: now,
        updatedAt: now,
      };

      (mockChangeRepo.findOne as jest.Mock).mockResolvedValue(change);

      await expect(service.reviewChange('chg-005', { status: ChangeStatus.REJECTED }, 'rev'))
        .rejects.toThrow('ya fue revisado');
    });

    it('debe lanzar error si el status de review no es válido', async () => {
      const change: any = {
        id: 'chg-006',
        status: ChangeStatus.SUBMITTED,
        createdAt: now,
        updatedAt: now,
      };

      (mockChangeRepo.findOne as jest.Mock).mockResolvedValue(change);

      await expect(service.reviewChange('chg-006', { status: ChangeStatus.IMPLEMENTED }, 'rev'))
        .rejects.toThrow('approved o rejected');
    });
  });

  describe('assessImpact (CHG-MGMT-003)', () => {
    it('debe calcular riskScore basado en impacto, rollback plan y feature flag', async () => {
      const change: any = {
        id: 'chg-007',
        impactLevel: ChangeImpact.HIGH,
        rollbackPlan: 'Short',
        featureFlag: null,
        riskScore: 3,
        createdAt: now,
        updatedAt: now,
      };

      (mockChangeRepo.findOne as jest.Mock).mockResolvedValue(change);
      (mockChangeRepo.save as jest.Mock).mockResolvedValue({ ...change, riskScore: 10 });

      const result = await service.assessImpact('chg-007');

      expect(result.riskScore).toBe(10);
      expect(result.factors.length).toBeGreaterThan(0);
      expect(result.recommendation).toContain('NO aprobar');
    });

    it('debe recomendar aprobar cuando riskScore < 5', async () => {
      const change: any = {
        id: 'chg-008',
        impactLevel: ChangeImpact.LOW,
        rollbackPlan: 'Very detailed rollback plan with many steps and procedures...',
        featureFlag: 'ff-001',
        riskScore: 0,
        createdAt: now,
        updatedAt: now,
      };

      (mockChangeRepo.findOne as jest.Mock).mockResolvedValue(change);
      (mockChangeRepo.save as jest.Mock).mockResolvedValue({ ...change, riskScore: 0 });

      const result = await service.assessImpact('chg-008');

      expect(result.riskScore).toBeLessThan(5);
      expect(result.recommendation).toContain('Aprobar. Riesgo bajo');
    });

    it('debe cap el riskScore a 10 máximo', async () => {
      const change: any = {
        id: 'chg-009',
        impactLevel: ChangeImpact.HIGH,
        rollbackPlan: null,
        featureFlag: null,
        riskScore: 10,
        createdAt: now,
        updatedAt: now,
      };

      (mockChangeRepo.findOne as jest.Mock).mockResolvedValue(change);
      (mockChangeRepo.save as jest.Mock).mockResolvedValue(change);

      const result = await service.assessImpact('chg-009');

      expect(result.riskScore).toBeLessThanOrEqual(10);
    });
  });

  describe('listChanges (CHG-MGMT-004)', () => {
    it('debe listar todos los change requests sin filtros', async () => {
      const changes: any[] = [
        { id: 'c1', status: ChangeStatus.SUBMITTED, createdAt: new Date(2026, 6, 10) },
        { id: 'c2', status: ChangeStatus.APPROVED, createdAt: new Date(2026, 6, 9) },
      ];

      (mockChangeRepo.find as jest.Mock).mockResolvedValue(changes);

      const result = await service.listChanges();

      expect(result).toEqual(changes);
      expect(mockChangeRepo.find).toHaveBeenCalledWith(expect.objectContaining({
        order: { createdAt: 'DESC' },
      }));
    });

    it('debe filtrar por status', async () => {
      const changes: any[] = [{ id: 'c1', status: ChangeStatus.APPROVED }];

      (mockChangeRepo.find as jest.Mock).mockResolvedValue(changes);

      await service.listChanges({ status: ChangeStatus.APPROVED });

      expect(mockChangeRepo.find).toHaveBeenCalledWith(expect.objectContaining({
        where: { status: ChangeStatus.APPROVED },
      }));
    });
  });

  describe('implementChange (CHG-MGMT-005)', () => {
    it('debe marcar cambio como IMPLEMENTED y activar feature flag si existe', async () => {
      const change: any = {
        id: 'chg-010',
        status: ChangeStatus.APPROVED,
        featureFlag: 'ff-active',
        createdAt: now,
        updatedAt: now,
      };

      const flag: any = {
        flagKey: 'ff-active',
        isEnabled: false,
        rolloutPercentage: 50,
      };

      (mockChangeRepo.findOne as jest.Mock).mockResolvedValue(change);
      (mockFlagRepo.findOne as jest.Mock).mockResolvedValue(flag);
      (mockChangeRepo.save as jest.Mock).mockImplementation((obj) => Promise.resolve({ ...change, ...obj }));
      (mockFlagRepo.save as jest.Mock).mockResolvedValue({ ...flag, isEnabled: true, rolloutPercentage: 100 });

      const result = await service.implementChange('chg-010');

      expect(result.status).toBe(ChangeStatus.IMPLEMENTED);
      expect(result.implementedAt).toBeDefined();
      expect(mockFlagRepo.save).toHaveBeenCalledWith(expect.objectContaining({
        isEnabled: true,
        rolloutPercentage: 100,
      }));
    });

    it('debe lanzar error si el cambio no está APROVED', async () => {
      const change: any = {
        id: 'chg-011',
        status: ChangeStatus.SUBMITTED,
        createdAt: now,
        updatedAt: now,
      };

      (mockChangeRepo.findOne as jest.Mock).mockResolvedValue(change);

      await expect(service.implementChange('chg-011')).rejects.toThrow('no está aprobado');
    });
  });

  describe('rollbackChange (CHG-MGMT-006)', () => {
    it('debe marcar cambio como ROLLED_BACK y desactivar feature flag', async () => {
      const change: any = {
        id: 'chg-012',
        status: ChangeStatus.IMPLEMENTED,
        featureFlag: 'ff-rollback',
        createdAt: now,
        updatedAt: now,
      };

      const flag: any = {
        flagKey: 'ff-rollback',
        isEnabled: true,
        rolloutPercentage: 100,
      };

      (mockChangeRepo.findOne as jest.Mock).mockResolvedValue(change);
      (mockFlagRepo.findOne as jest.Mock).mockResolvedValue(flag);
      (mockChangeRepo.save as jest.Mock).mockImplementation((obj) => Promise.resolve({ ...change, ...obj }));
      (mockFlagRepo.save as jest.Mock).mockResolvedValue({ ...flag, isEnabled: false, rolloutPercentage: 0 });

      const result = await service.rollbackChange('chg-012');

      expect(result.status).toBe(ChangeStatus.ROLLED_BACK);
      expect(mockFlagRepo.save).toHaveBeenCalledWith(expect.objectContaining({
        isEnabled: false,
        rolloutPercentage: 0,
      }));
    });

    it('debe lanzar error si el cambio no está IMPLEMENTED', async () => {
      const change: any = {
        id: 'chg-013',
        status: ChangeStatus.APPROVED,
        createdAt: now,
        updatedAt: now,
      };

      (mockChangeRepo.findOne as jest.Mock).mockResolvedValue(change);

      await expect(service.rollbackChange('chg-013')).rejects.toThrow('no está implementado');
    });
  });

  describe('createFeatureFlag (CHG-MGMT-007)', () => {
    it('debe crear una feature flag nueva', async () => {
      const dto: CreateFeatureFlagDto = {
        flagKey: 'new-feature',
        description: 'Test feature',
        isEnabled: true,
        rolloutPercentage: 10,
        isDarkLaunch: false,
      };

      const saved: any = {
        id: 'ff-001',
        ...dto,
        targetedUsers: [],
        config: {},
        environment: 'prod',
        createdAt: now,
        updatedAt: now,
      };

      (mockFlagRepo.findOne as jest.Mock).mockResolvedValue(null);
      (mockFlagRepo.create as jest.Mock).mockReturnValue(saved);
      (mockFlagRepo.save as jest.Mock).mockResolvedValue(saved);

      const result = await service.createFeatureFlag(dto);

      expect(result.flagKey).toBe('new-feature');
      expect(result.rolloutPercentage).toBe(10);
    });

    it('debe lanzar error si la flag ya existe', async () => {
      const dto: CreateFeatureFlagDto = {
        flagKey: 'existing-flag',
        description: 'Exists',
        isEnabled: true,
      };

      (mockFlagRepo.findOne as jest.Mock).mockResolvedValue({ id: 'ff-existing', flagKey: 'existing-flag' });

      await expect(service.createFeatureFlag(dto)).rejects.toThrow('ya existe');
    });
  });

  describe('updateRollout (CHG-MGMT-008)', () => {
    it('debe actualizar rollout percentage', async () => {
      const flag: any = {
        flagKey: 'ff-rollout',
        isEnabled: false,
        rolloutPercentage: 0,
        createdAt: now,
        updatedAt: now,
      };

      (mockFlagRepo.findOne as jest.Mock).mockResolvedValue(flag);
      (mockFlagRepo.save as jest.Mock).mockResolvedValue({ ...flag, rolloutPercentage: 50, isEnabled: true });

      const result = await service.updateRollout('ff-rollout', 50);

      expect(result.rolloutPercentage).toBe(50);
      expect(result.isEnabled).toBe(true);
    });

    it('debe lanzar error si percentage < 0 o > 100', async () => {
      await expect(service.updateRollout('ff-test', -10)).rejects.toThrow('entre 0 y 100');
      await expect(service.updateRollout('ff-test', 150)).rejects.toThrow('entre 0 y 100');
    });

    it('debe lanzar error si la flag no existe', async () => {
      (mockFlagRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.updateRollout('nonexistent', 50)).rejects.toThrow('no encontrada');
    });
  });

  describe('evaluateFlag (CHG-MGMT-009)', () => {
    it('debe retornar enabled=false si la flag no existe', async () => {
      (mockFlagRepo.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.evaluateFlag('missing-flag', 'user-001');

      expect(result.enabled).toBe(false);
      expect(result.reason).toBe('Flag no existe');
    });

    it('debe retornar enabled=false si la flag está deshabilitada', async () => {
      const flag: any = { flagKey: 'disabled-flag', isEnabled: false, rolloutPercentage: 0, targetedUsers: [] };
      (mockFlagRepo.findOne as jest.Mock).mockResolvedValue(flag);

      const result = await service.evaluateFlag('disabled-flag', 'user-001');

      expect(result.enabled).toBe(false);
      expect(result.reason).toContain('deshabilitado');
    });

    it('debe retornar enabled=true si el usuario está en whitelist', async () => {
      const flag: any = {
        flagKey: 'whitelist-flag',
        isEnabled: true,
        rolloutPercentage: 0,
        targetedUsers: ['user-001', 'user-002'],
        isDarkLaunch: false,
      };
      (mockFlagRepo.findOne as jest.Mock).mockResolvedValue(flag);

      const result = await service.evaluateFlag('whitelist-flag', 'user-001');

      expect(result.enabled).toBe(true);
      expect(result.reason).toContain('whitelist');
    });

    it('debe retornar enabled=false para dark launch sin estar en whitelist', async () => {
      const flag: any = {
        flagKey: 'dark-flag',
        isEnabled: true,
        rolloutPercentage: 50,
        targetedUsers: ['user-admin'],
        isDarkLaunch: true,
      };
      (mockFlagRepo.findOne as jest.Mock).mockResolvedValue(flag);

      const result = await service.evaluateFlag('dark-flag', 'user-001');

      expect(result.enabled).toBe(false);
      expect(result.reason).toContain('Dark launch');
    });

    it('debe usar hash determinista para rollout percentage', async () => {
      const flag: any = {
        flagKey: 'rollout-flag',
        isEnabled: true,
        rolloutPercentage: 50,
        targetedUsers: [],
        isDarkLaunch: false,
      };
      (mockFlagRepo.findOne as jest.Mock).mockResolvedValue(flag);

      const result1 = await service.evaluateFlag('rollout-flag', 'user-stable');
      const result2 = await service.evaluateFlag('rollout-flag', 'user-stable');

      expect(result1.enabled).toBe(result2.enabled);
      expect(result1.reason).toBe(result2.reason);
    });

    it('debe retornar enabled=true cuando rolloutPercentage >= 100', async () => {
      const flag: any = {
        flagKey: 'full-rollout',
        isEnabled: true,
        rolloutPercentage: 100,
        targetedUsers: [],
        isDarkLaunch: false,
      };
      (mockFlagRepo.findOne as jest.Mock).mockResolvedValue(flag);

      const result = await service.evaluateFlag('full-rollout', 'user-anyone');

      expect(result.enabled).toBe(true);
      expect(result.reason).toContain('100%');
    });
  });

  describe('killSwitch (CHG-MGMT-010)', () => {
    it('debe deshabilitar inmediatamente la feature flag', async () => {
      const flag: any = {
        flagKey: 'ff-kill',
        isEnabled: true,
        rolloutPercentage: 75,
        createdAt: now,
        updatedAt: now,
      };

      (mockFlagRepo.findOne as jest.Mock).mockResolvedValue(flag);
      (mockFlagRepo.save as jest.Mock).mockResolvedValue({ ...flag, isEnabled: false, rolloutPercentage: 0 });

      const result = await service.killSwitch('ff-kill');

      expect(result.isEnabled).toBe(false);
      expect(result.rolloutPercentage).toBe(0);
    });

    it('debe lanzar error si la flag no existe', async () => {
      (mockFlagRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.killSwitch('nonexistent')).rejects.toThrow('no encontrada');
    });
  });

  describe('predictChangeFailure (CHG-MOD-001)', () => {
    it('debe calcular failureProbability basado en múltiples factores', async () => {
      const change: any = {
        id: 'chg-risky',
        impactLevel: ChangeImpact.HIGH,
        rollbackPlan: '',
        featureFlag: null,
        riskScore: 8,
        createdAt: now,
        updatedAt: now,
      };

      (mockChangeRepo.findOne as jest.Mock).mockResolvedValue(change);

      const result = await service.predictChangeFailure('chg-risky');

      expect(result.failureProbability).toBeGreaterThanOrEqual(70);
      expect(result.riskFactors.length).toBeGreaterThan(0);
      expect(result.similarPastChanges.length).toBeGreaterThan(0);
      expect(result.modelVersion).toBe('risk-mock-v1.0');
      expect(result.recommendation).toContain('ALTO RIESGO');
    });

    it('debe retornar baja probabilidad cuando los factores son buenos', async () => {
      const change: any = {
        id: 'chg-safe',
        impactLevel: ChangeImpact.LOW,
        rollbackPlan: 'Very detailed plan...',
        featureFlag: 'ff-present',
        riskScore: 2,
        createdAt: now,
        updatedAt: now,
      };

      (mockChangeRepo.findOne as jest.Mock).mockResolvedValue(change);

      const result = await service.predictChangeFailure('chg-safe');

      expect(result.failureProbability).toBeLessThan(40);
      expect(result.recommendation).toContain('BAJO RIESGO');
    });

    it('debe cap el failureProbability a 95 máximo', async () => {
      const change: any = {
        id: 'chg-extreme',
        impactLevel: ChangeImpact.HIGH,
        rollbackPlan: '',
        featureFlag: null,
        riskScore: 10,
        createdAt: now,
        updatedAt: now,
      };

      (mockChangeRepo.findOne as jest.Mock).mockResolvedValue(change);

      const result = await service.predictChangeFailure('chg-extreme');

      expect(result.failureProbability).toBeLessThanOrEqual(95);
    });
  });

  describe('checkAutoRollback (CHG-MOD-002)', () => {
    it('debe retornar no necesita rollback cuando cambio no está implementado', async () => {
      const change: any = {
        id: 'chg-not-implemented',
        status: ChangeStatus.APPROVED,
        createdAt: now,
        updatedAt: now,
      };

      (mockChangeRepo.findOne as jest.Mock).mockResolvedValue(change);

      const result = await service.checkAutoRollback('chg-not-implemented');

      expect(result.shouldRollback).toBe(false);
      expect(result.triggers.length).toBe(0);
    });

    it('debe spys de Math.random para predecible en tests', async () => {
      const change: any = {
        id: 'chg-running',
        status: ChangeStatus.IMPLEMENTED,
        createdAt: now,
        updatedAt: now,
      };

      (mockChangeRepo.findOne as jest.Mock).mockResolvedValue(change);
      const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.5);

      const result = await service.checkAutoRollback('chg-running');

      expect(result.autoRolledBack).toBe(false);
      randomSpy.mockRestore();
    });

    it('debe realizar rollback cuando Math.random > 0.85', async () => {
      const change: any = {
        id: 'chg-failing',
        status: ChangeStatus.IMPLEMENTED,
        createdAt: now,
        updatedAt: now,
      };

      // Mock específico para este test - findOne debe retornar el change
      (mockChangeRepo.findOne as jest.Mock).mockResolvedValue(change);

      // Mockear rollbackChange internamente para que no lance error en segunda llamada
      jest.spyOn(service, 'rollbackChange').mockResolvedValue({
        ...change,
        status: ChangeStatus.ROLLED_BACK,
      });

      const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.95);

      const result = await service.checkAutoRollback('chg-failing');

      expect(result.shouldRollback).toBe(true);
      expect(result.autoRolledBack).toBe(true);
      expect(result.triggers.length).toBeGreaterThan(0);

      randomSpy.mockRestore();
    });
  });

  describe('getChangeVelocity (CHG-MOD-003)', () => {
    it('debe calcular successRate y rollbackRate basado en counts', async () => {
      (mockChangeRepo.count as jest.Mock)
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(80)
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(10);

      const result = await service.getChangeVelocity();

      expect(result.totalChanges).toBe(100);
      expect(result.successRate).toBe(80);
      expect(result.rollbackRate).toBe(10);
      expect(result.trend).toBe('healthy');
    });

    it('debe retornar 0 cuando no hay cambios', async () => {
      (mockChangeRepo.count as jest.Mock).mockResolvedValue(0);

      const result = await service.getChangeVelocity();

      expect(result.successRate).toBe(0);
      expect(result.rollbackRate).toBe(0);
      expect(result.trend).toBe('needs_attention');
    });
  });

  describe('getDeploymentBenchmark (CHG-MOD-004)', () => {
    it('debe contar cambios de la última semana', async () => {
      const recentChanges = 5;
      const qbMock = {
        where: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(recentChanges),
      };

      (mockChangeRepo.createQueryBuilder as jest.Mock).mockReturnValue(qbMock);

      const result = await service.getDeploymentBenchmark();

      expect(result.deploymentsPerWeek).toBe(recentChanges);
      expect(result.eliteTier).toBe('high');
      expect(result.modelVersion).toBe('dora-mock-v1.0');
    });

    it('debe retornar elite cuando >= 7 deploys/week', async () => {
      const qbMock = {
        where: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(10),
      };

      (mockChangeRepo.createQueryBuilder as jest.Mock).mockReturnValue(qbMock);

      const result = await service.getDeploymentBenchmark();

      expect(result.eliteTier).toBe('elite');
    });

    it('debe sugerir incrementar frecuencia cuando < 1 deploy/week', async () => {
      const qbMock = {
        where: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
      };

      (mockChangeRepo.createQueryBuilder as jest.Mock).mockReturnValue(qbMock);

      const result = await service.getDeploymentBenchmark();

      expect(result.recommendation).toContain('Incrementar frecuencia');
    });
  });

  describe('getReleaseOrchestration (CHG-MOD-005)', () => {
    it('debe retornar stages y gates para un change implementado bien configurado', async () => {
      // Rollback plan con >= 50 caracteres para pasar el gate "Rollback Plan Verified"
      const change: any = {
        id: 'chg-full',
        status: ChangeStatus.IMPLEMENTED,
        featureFlag: 'ff-release',
        rollbackPlan: 'Detailed rollback plan with comprehensive steps and procedures documented thoroughly here...',
        riskScore: 2,
        createdAt: now,
        updatedAt: now,
      };

      (mockChangeRepo.findOne as jest.Mock).mockResolvedValue(change);

      const result = await service.getReleaseOrchestration('chg-full');

      expect(result.stages.length).toBeGreaterThan(0);
      expect(result.gates.length).toBeGreaterThan(0);
      
      // Todos los gates deben pasar
      const allGatesPassed = result.gates.every((g: any) => g.passed);
      expect(allGatesPassed).toBe(true);
      expect(result.recommendation).toContain('Listo para deploy');
    });

    it('debe mostrar gates pendientes cuando CAB no aprobó', async () => {
      const change: any = {
        id: 'chg-pending',
        status: ChangeStatus.SUBMITTED,
        featureFlag: null,
        rollbackPlan: '',
        createdAt: now,
        updatedAt: now,
      };

      (mockChangeRepo.findOne as jest.Mock).mockResolvedValue(change);

      const result = await service.getReleaseOrchestration('chg-pending');

      const cabGate = result.gates.find((g: any) => g.name === 'CAB Approved');
      expect(cabGate.passed).toBe(false);
      expect(result.recommendation).toContain('Bloqueado');
    });

    it('debe retornar gate fallido cuando rollback plan es insuficiente', async () => {
      const change: any = {
        id: 'chg-short',
        status: ChangeStatus.APPROVED,
        featureFlag: 'ff-test',
        rollbackPlan: 'Short',
        createdAt: now,
        updatedAt: now,
      };

      (mockChangeRepo.findOne as jest.Mock).mockResolvedValue(change);

      const result = await service.getReleaseOrchestration('chg-short');

      const rollbackGate = result.gates.find((g: any) => g.name === 'Rollback Plan Verified');
      expect(rollbackGate.passed).toBe(false);
    });
  });

  describe('simpleHash (privado)', () => {
    it('debe retornar hash consistente para mismo input', () => {
      // Testeado indirectamente vía evaluateFlag
    });
  });
});
