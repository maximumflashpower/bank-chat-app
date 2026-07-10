import { DataPipelineService } from './data-pipeline.service';
import { Repository } from 'typeorm';
import { DataPipeline } from '../entities/data-pipeline.entity';
import { DataCatalogEntry } from '../entities/data-catalog-entry.entity';
import { PipelineStatus } from '../entities/pipeline-status.enum';
import { CreatePipelineDto } from '../dto/create-pipeline.dto';
import { SearchCatalogDto } from '../dto/search-catalog.dto';

jest.mock('../entities/data-pipeline.entity');
jest.mock('../entities/data-catalog-entry.entity');

describe('DataPipelineService', () => {
  let service: DataPipelineService;
  let mockPipelineRepo: Partial<Repository<DataPipeline>>;
  let mockCatalogRepo: Partial<Repository<DataCatalogEntry>>;

  const now = new Date(2026, 6, 10, 12, 0, 0);

  beforeEach(() => {
    mockPipelineRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    mockCatalogRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    (mockPipelineRepo.create as jest.Mock).mockReturnValue({});
    (mockCatalogRepo.create as jest.Mock).mockReturnValue({});

    service = new DataPipelineService(
      mockPipelineRepo as Repository<DataPipeline>,
      mockCatalogRepo as Repository<DataCatalogEntry>,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('createPipeline (BBC-DLP-V3-001)', () => {
    it('debe crear un pipeline nuevo en estado DRAFT', async () => {
      const dto: CreatePipelineDto = {
        name: 'cdc-users',
        sourceType: 'cdc',
        sourceConfig: { tableName: 'users' },
        destination: 'warehouse.users',
        schedule: '*/5 * * * *',
      };

      const saved: any = { id: 'pipe-001', ...dto, status: PipelineStatus.DRAFT, createdAt: now, updatedAt: now };

      (mockPipelineRepo.findOne as jest.Mock).mockResolvedValue(null);
      (mockPipelineRepo.create as jest.Mock).mockReturnValue(saved);
      (mockPipelineRepo.save as jest.Mock).mockResolvedValue(saved);

      const result = await service.createPipeline(dto);

      expect(result.id).toBe('pipe-001');
      expect(result.status).toBe(PipelineStatus.DRAFT);
    });

    it('debe lanzar error si el pipeline ya existe', async () => {
      const dto: CreatePipelineDto = {
        name: 'existing-pipe',
        sourceType: 'kafka',
        sourceConfig: {},
        destination: 'sink',
      };

      (mockPipelineRepo.findOne as jest.Mock).mockResolvedValue({ id: 'pipe-existing', name: 'existing-pipe' });

      await expect(service.createPipeline(dto)).rejects.toThrow('ya existe');
    });
  });

  describe('updatePipelineStatus (BBC-DLP-V3-002)', () => {
    it('debe cambiar el estado del pipeline y set lastRunAt si ACTIVE', async () => {
      const pipeline: any = {
        id: 'pipe-001',
        name: 'test-pipe',
        status: PipelineStatus.DRAFT,
        lastRunAt: null,
      };

      (mockPipelineRepo.findOne as jest.Mock).mockResolvedValue(pipeline);
      (mockPipelineRepo.save as jest.Mock).mockImplementation((obj) => Promise.resolve({ ...pipeline, ...obj }));

      const result = await service.updatePipelineStatus('pipe-001', PipelineStatus.ACTIVE);

      expect(result.status).toBe(PipelineStatus.ACTIVE);
      expect(result.lastRunAt).toBeDefined();
    });

    it('debe lanzar NotFoundException si el pipeline no existe', async () => {
      (mockPipelineRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.updatePipelineStatus('pipe-999', PipelineStatus.ACTIVE))
        .rejects.toThrow('no encontrado');
    });
  });

  describe('getPipelineHealth (BBC-DLP-V3-003)', () => {
    it('debe retornar healthy=true si status=ACTIVE y errorCodeCount < 10', async () => {
      const pipeline: any = {
        id: 'pipe-001',
        name: 'healthy-pipe',
        status: PipelineStatus.ACTIVE,
        lastRunAt: now,
        throughputRps: 1000,
        errorCodeCount: 2,
      };

      (mockPipelineRepo.findOne as jest.Mock).mockResolvedValue(pipeline);

      const result = await service.getPipelineHealth('pipe-001');

      expect(result.healthy).toBe(true);
      expect(result.throughputRps).toBe(1000);
    });

    it('debe retornar healthy=false si errorCodeCount >= 10', async () => {
      const pipeline: any = {
        id: 'pipe-002',
        name: 'unhealthy-pipe',
        status: PipelineStatus.ACTIVE,
        lastRunAt: now,
        throughputRps: 500,
        errorCodeCount: 15,
      };

      (mockPipelineRepo.findOne as jest.Mock).mockResolvedValue(pipeline);

      const result = await service.getPipelineHealth('pipe-002');

      expect(result.healthy).toBe(false);
    });

    it('debe lanzar NotFoundException si no existe', async () => {
      (mockPipelineRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.getPipelineHealth('pipe-999')).rejects.toThrow('no encontrado');
    });
  });

  describe('listPipelines (BBC-DLP-V3-004)', () => {
    it('debe listar todos los pipelines ordenados por createdAt DESC', async () => {
      const pipelines: any[] = [
        { id: 'p1', name: 'pipe-1', createdAt: now },
        { id: 'p2', name: 'pipe-2', createdAt: new Date(2026, 6, 9) },
      ];

      (mockPipelineRepo.find as jest.Mock).mockResolvedValue(pipelines);

      const result = await service.listPipelines();

      expect(result.length).toBe(2);
      expect(mockPipelineRepo.find).toHaveBeenCalledWith(expect.objectContaining({
        order: { createdAt: 'DESC' },
      }));
    });
  });

  describe('registerCatalogEntry (BBC-DLP-V3-005)', () => {
    it('debe registrar una entrada nueva en el catálogo', async () => {
      const entry = {
        datasetName: 'users_dim',
        description: 'Users dimension table',
        schemaDefinition: { columns: [{ name: 'id', type: 'uuid' }] },
        tags: ['core', 'pii'],
        owner: 'data-team',
      };

      const saved: any = { id: 'cat-001', ...entry, lineageUpstream: [], lineageDownstream: [], qualityScore: null, createdAt: now };

      (mockCatalogRepo.findOne as jest.Mock).mockResolvedValue(null);
      (mockCatalogRepo.create as jest.Mock).mockReturnValue(saved);
      (mockCatalogRepo.save as jest.Mock).mockResolvedValue(saved);

      const result = await service.registerCatalogEntry(entry);

      expect(result.id).toBe('cat-001');
      expect(result.lineageUpstream).toEqual([]);
    });

    it('debe lanzar error si el dataset ya existe en el catálogo', async () => {
      (mockCatalogRepo.findOne as jest.Mock).mockResolvedValue({ id: 'cat-existing', datasetName: 'users_dim' });

      await expect(service.registerCatalogEntry({ datasetName: 'users_dim', schemaDefinition: {} }))
        .rejects.toThrow('ya existe en el catálogo');
    });
  });

  describe('searchCatalog (BBC-DLP-V3-006)', () => {
    it('debe buscar en el catálogo con query, classification y tags', async () => {
      const dto: SearchCatalogDto = {
        query: 'users',
        classification: 'internal',
        tags: ['core'],
      };

      const results: any[] = [
        { id: 'cat-001', datasetName: 'users_dim', qualityScore: 95 },
      ];

      const qbMock = {
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(results),
      };

      (mockCatalogRepo.createQueryBuilder as jest.Mock).mockReturnValue(qbMock);

      const result = await service.searchCatalog(dto);

      expect(result.length).toBe(1);
      expect(result[0].datasetName).toBe('users_dim');
    });
  });

  describe('updateLineage (BBC-DLP-V3-007)', () => {
    it('debe actualizar lineage upstream fusionando IDs existentes', async () => {
      const entry: any = {
        id: 'cat-001',
        lineageUpstream: ['src-1'],
        lineageDownstream: [],
      };

      (mockCatalogRepo.findOne as jest.Mock).mockResolvedValue(entry);
      (mockCatalogRepo.save as jest.Mock).mockImplementation((obj) => Promise.resolve({ ...entry, ...obj }));

      const result = await service.updateLineage('cat-001', 'upstream', ['src-1', 'src-2']);

      expect(result.lineageUpstream).toContain('src-1');
      expect(result.lineageUpstream).toContain('src-2');
      expect(result.lineageUpstream.length).toBe(2); // dedup
    });

    it('debe actualizar lineage downstream', async () => {
      const entry: any = {
        id: 'cat-001',
        lineageUpstream: [],
        lineageDownstream: ['dst-1'],
      };

      (mockCatalogRepo.findOne as jest.Mock).mockResolvedValue(entry);
      (mockCatalogRepo.save as jest.Mock).mockImplementation((obj) => Promise.resolve({ ...entry, ...obj }));

      const result = await service.updateLineage('cat-001', 'downstream', ['dst-1', 'dst-2']);

      expect(result.lineageDownstream).toContain('dst-2');
      expect(result.lineageDownstream.length).toBe(2);
    });

    it('debe lanzar NotFoundException si no existe', async () => {
      (mockCatalogRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.updateLineage('cat-999', 'upstream', ['x'])).rejects.toThrow('no encontrado');
    });
  });

  describe('validateSchemaCompatibility (BBC-DLP-V3-008)', () => {
    it('debe detectar campo removido como breaking change en backward', async () => {
      const oldSchema = {
        columns: [
          { name: 'id', type: 'uuid', required: true },
          { name: 'email', type: 'varchar', required: true },
        ],
      };

      const newSchema = {
        columns: [
          { name: 'id', type: 'uuid', required: true },
        ],
      };

      const result = await service.validateSchemaCompatibility(oldSchema, newSchema, 'backward');

      expect(result.compatible).toBe(false);
      expect(result.breakingChanges.some((bc: string) => bc.includes('email'))).toBe(true);
    });

    it('debe detectar cambio de tipo como breaking change', async () => {
      const oldSchema = {
        columns: [{ name: 'amount', type: 'integer', required: true }],
      };

      const newSchema = {
        columns: [{ name: 'amount', type: 'bigint', required: true }],
      };

      const result = await service.validateSchemaCompatibility(oldSchema, newSchema, 'backward');

      expect(result.compatible).toBe(false);
      expect(result.breakingChanges.some((bc: string) => bc.includes('cambió tipo'))).toBe(true);
    });

    it('debe marcar como compatible cuando no hay breaking changes', async () => {
      const oldSchema = {
        columns: [{ name: 'id', type: 'uuid', required: true }],
      };

      const newSchema = {
        columns: [
          { name: 'id', type: 'uuid', required: true },
          { name: 'email', type: 'varchar', required: false },
        ],
      };

      const result = await service.validateSchemaCompatibility(oldSchema, newSchema, 'backward');

      expect(result.compatible).toBe(true);
      expect(result.breakingChanges.length).toBe(0);
    });

    it('debe generar warning para campo nuevo en direction forward', async () => {
      const oldSchema = {
        columns: [{ name: 'id', type: 'uuid' }],
      };

      const newSchema = {
        columns: [
          { name: 'id', type: 'uuid' },
          { name: 'new_field', type: 'varchar' },
        ],
      };

      const result = await service.validateSchemaCompatibility(oldSchema, newSchema, 'forward');

      expect(result.warnings.some((w: string) => w.includes('new_field'))).toBe(true);
    });

    it('debe marcar campo opcional→requerido como breaking change', async () => {
      const oldSchema = {
        columns: [{ name: 'email', type: 'varchar', required: false }],
      };

      const newSchema = {
        columns: [{ name: 'email', type: 'varchar', required: true }],
      };

      const result = await service.validateSchemaCompatibility(oldSchema, newSchema, 'backward');

      expect(result.compatible).toBe(false);
      expect(result.breakingChanges.some((bc: string) => bc.includes('opcional a requerido'))).toBe(true);
    });
  });

  describe('registerSchemaVersion (BBC-DLP-V3-016)', () => {
    it('debe registrar una nueva versión del schema incrementando el número', async () => {
      const entry: any = {
        id: 'cat-001',
        schemaDefinition: { columns: [], _version: 2 },
      };

      (mockCatalogRepo.findOne as jest.Mock).mockResolvedValue(entry);
      (mockCatalogRepo.save as jest.Mock).mockResolvedValue(entry);

      const result = await service.registerSchemaVersion('cat-001', { columns: [{ name: 'new', type: 'text' }] });

      expect(result.version).toBe(3);
      expect(result.schema._version).toBe(3);
    });

    it('debe iniciar versión en 2 si no hay _version previa', async () => {
      const entry: any = {
        id: 'cat-002',
        schemaDefinition: { columns: [] },
      };

      (mockCatalogRepo.findOne as jest.Mock).mockResolvedValue(entry);
      (mockCatalogRepo.save as jest.Mock).mockResolvedValue(entry);

      const result = await service.registerSchemaVersion('cat-002', { columns: [{ name: 'x' }] });

      expect(result.version).toBe(2);
    });

    it('debe lanzar NotFoundException si no existe', async () => {
      (mockCatalogRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.registerSchemaVersion('cat-999', {})).rejects.toThrow('no encontrado');
    });
  });

  describe('checkSchemaEvolution (BBC-DLP-V3-017)', () => {
    it('debe retornar canEvolve=true cuando el schema es backward compatible', async () => {
      const entry: any = {
        id: 'cat-001',
        schemaDefinition: {
          columns: [
            { name: 'id', type: 'uuid', required: true },
            { name: 'name', type: 'varchar', required: false },
          ],
        },
      };

      (mockCatalogRepo.findOne as jest.Mock).mockResolvedValue(entry);

      const result = await service.checkSchemaEvolution('cat-001', {
        columns: [
          { name: 'id', type: 'uuid', required: true },
          { name: 'name', type: 'varchar', required: false },
          { name: 'email', type: 'varchar', required: false },
        ],
      });

      expect(result.canEvolve).toBe(true);
      expect(result.report).toContain('evoluciona correctamente');
    });

    it('debe retornar canEvolve=false cuando hay breaking changes', async () => {
      const entry: any = {
        id: 'cat-002',
        schemaDefinition: {
          columns: [
            { name: 'id', type: 'uuid', required: true },
            { name: 'email', type: 'varchar', required: true },
          ],
        },
      };

      (mockCatalogRepo.findOne as jest.Mock).mockResolvedValue(entry);

      const result = await service.checkSchemaEvolution('cat-002', {
        columns: [{ name: 'id', type: 'uuid', required: true }],
      });

      expect(result.canEvolve).toBe(false);
      expect(result.report).toContain('NO puede evolucionar');
    });
  });

  describe('getPipelineMetrics (BBC-DLP-V3-009)', () => {
    it('debe retornar métricas con latency estimada', async () => {
      const pipeline: any = {
        id: 'pipe-001',
        throughputRps: 500,
        errorCodeCount: 3,
        lastRunAt: now,
      };

      (mockPipelineRepo.findOne as jest.Mock).mockResolvedValue(pipeline);

      const result = await service.getPipelineMetrics('pipe-001');

      expect(result.throughputRps).toBe(500);
      expect(result.estimatedLatencyMs).toBe(2); // 1000/500 = 2
    });

    it('debe retornar latency null cuando throughputRps es 0 o null', async () => {
      const pipeline: any = {
        id: 'pipe-002',
        throughputRps: 0,
        errorCodeCount: 0,
        lastRunAt: null,
      };

      (mockPipelineRepo.findOne as jest.Mock).mockResolvedValue(pipeline);

      const result = await service.getPipelineMetrics('pipe-002');

      expect(result.estimatedLatencyMs).toBeNull();
    });

    it('debe lanzar NotFoundException si no existe', async () => {
      (mockPipelineRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.getPipelineMetrics('pipe-999')).rejects.toThrow('no encontrado');
    });
  });

  describe('triggerExecution (BBC-DLP-V3-010)', () => {
    it('debe ejecutar pipeline, resetear errores y asignar throughput aleatorio', async () => {
      const pipeline: any = {
        id: 'pipe-001',
        name: 'test-pipe',
        status: PipelineStatus.DRAFT,
        errorCodeCount: 5,
        throughputRps: null,
        lastRunAt: null,
      };

      (mockPipelineRepo.findOne as jest.Mock).mockResolvedValue(pipeline);
      (mockPipelineRepo.save as jest.Mock).mockImplementation((obj) => Promise.resolve({ ...pipeline, ...obj }));

      const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.5);

      const result = await service.triggerExecution('pipe-001');

      expect(result.triggered).toBe(true);
      expect(result.message).toContain('test-pipe');

      randomSpy.mockRestore();
    });

    it('debe lanzar BadRequest si el pipeline está en estado ERROR', async () => {
      const pipeline: any = {
        id: 'pipe-err',
        name: 'error-pipe',
        status: PipelineStatus.ERROR,
      };

      (mockPipelineRepo.findOne as jest.Mock).mockResolvedValue(pipeline);

      await expect(service.triggerExecution('pipe-err')).rejects.toThrow('estado ERROR');
    });

    it('debe lanzar NotFoundException si no existe', async () => {
      (mockPipelineRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.triggerExecution('pipe-999')).rejects.toThrow('no encontrado');
    });
  });

  describe('triggerBatchIngestion (BBC-DLP-V3-018)', () => {
    it('debe aceptar batch ingestion para pipeline tipo batch', async () => {
      const pipeline: any = {
        id: 'pipe-batch',
        name: 'batch-pipe',
        sourceType: 'batch',
      };

      (mockPipelineRepo.findOne as jest.Mock).mockResolvedValue(pipeline);

      const result = await service.triggerBatchIngestion('pipe-batch', {
        source: 's3://bucket/file.csv',
        format: 'csv',
        fileSizeBytes: 1048576,
      });

      expect(result.accepted).toBe(true);
      expect(result.batchId).toContain('batch-');
    });

    it('debe aceptar batch ingestion para pipeline tipo api', async () => {
      const pipeline: any = {
        id: 'pipe-api',
        name: 'api-pipe',
        sourceType: 'api',
      };

      (mockPipelineRepo.findOne as jest.Mock).mockResolvedValue(pipeline);

      const result = await service.triggerBatchIngestion('pipe-api', {
        source: 'https://api.example.com/data',
        format: 'json',
      });

      expect(result.accepted).toBe(true);
    });

    it('debe lanzar BadRequest para sourceType que no soporta batch', async () => {
      const pipeline: any = {
        id: 'pipe-kafka',
        name: 'kafka-pipe',
        sourceType: 'kafka',
      };

      (mockPipelineRepo.findOne as jest.Mock).mockResolvedValue(pipeline);

      await expect(service.triggerBatchIngestion('pipe-kafka', { source: 'x', format: 'csv' }))
        .rejects.toThrow('no soporta batch ingestion');
    });

    it('debe lanzar NotFoundException si no existe', async () => {
      (mockPipelineRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.triggerBatchIngestion('pipe-999', { source: 'x', format: 'y' }))
        .rejects.toThrow('no encontrado');
    });
  });

  describe('getStreamStatus (BBC-DLP-V3-019)', () => {
    it('debe retornar status de streaming para pipeline kafka ACTIVE', async () => {
      const pipeline: any = {
        id: 'pipe-kafka',
        name: 'kafka-stream',
        status: PipelineStatus.ACTIVE,
        sourceType: 'kafka',
        sourceConfig: { partitions: 6, consumerGroup: 'my-group' },
      };

      (mockPipelineRepo.findOne as jest.Mock).mockResolvedValue(pipeline);
      const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.3);

      const result = await service.getStreamStatus('pipe-kafka');

      expect(result.isStreaming).toBe(true);
      expect(result.partitions).toBe(6);
      expect(result.consumerGroup).toBe('my-group');

      randomSpy.mockRestore();
    });

    it('debe retornar isStreaming=false y lag=0 si pipeline no está ACTIVE', async () => {
      const pipeline: any = {
        id: 'pipe-paused',
        name: 'paused-stream',
        status: PipelineStatus.PAUSED,
        sourceType: 'stream',
        sourceConfig: {},
      };

      (mockPipelineRepo.findOne as jest.Mock).mockResolvedValue(pipeline);

      const result = await service.getStreamStatus('pipe-paused');

      expect(result.isStreaming).toBe(false);
      expect(result.lag).toBe(0);
    });

    it('debe usar defaults para partitions y consumerGroup si no están en config', async () => {
      const pipeline: any = {
        id: 'pipe-defaults',
        name: 'defaults-stream',
        status: PipelineStatus.ACTIVE,
        sourceType: 'cdc',
        sourceConfig: {},
      };

      (mockPipelineRepo.findOne as jest.Mock).mockResolvedValue(pipeline);
      const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.5);

      const result = await service.getStreamStatus('pipe-defaults');

      expect(result.partitions).toBe(3);
      expect(result.consumerGroup).toBe('defaults-stream-group');

      randomSpy.mockRestore();
    });

    it('debe lanzar BadRequest si sourceType no es streaming', async () => {
      const pipeline: any = {
        id: 'pipe-batch',
        name: 'batch-pipe',
        status: PipelineStatus.ACTIVE,
        sourceType: 'batch',
        sourceConfig: {},
      };

      (mockPipelineRepo.findOne as jest.Mock).mockResolvedValue(pipeline);

      await expect(service.getStreamStatus('pipe-batch')).rejects.toThrow('no es streaming');
    });
  });

  describe('registerCdcTable (BBC-DLP-V3-011)', () => {
    it('debe registrar tabla CDC y crear replication slot', async () => {
      const pipeline: any = {
        id: 'pipe-cdc',
        name: 'cdc-pipe',
        sourceType: 'cdc',
      };

      (mockPipelineRepo.findOne as jest.Mock).mockResolvedValue(pipeline);

      const result = await service.registerCdcTable('pipe-cdc', {
        tableName: 'transactions',
        schema: 'public',
        primaryKey: 'id',
      });

      expect(result.registered).toBe(true);
      expect(result.cdcSlot).toContain('cdc_transactions_');
    });

    it('debe lanzar BadRequest si el pipeline no es tipo CDC', async () => {
      const pipeline: any = {
        id: 'pipe-kafka',
        name: 'kafka-pipe',
        sourceType: 'kafka',
      };

      (mockPipelineRepo.findOne as jest.Mock).mockResolvedValue(pipeline);

      await expect(service.registerCdcTable('pipe-kafka', { tableName: 't', schema: 's', primaryKey: 'id' }))
        .rejects.toThrow('no es tipo CDC');
    });

    it('debe lanzar NotFoundException si no existe', async () => {
      (mockPipelineRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.registerCdcTable('pipe-999', { tableName: 't', schema: 's', primaryKey: 'id' }))
        .rejects.toThrow('no encontrado');
    });
  });

  describe('getCdcCheckpoint (BBC-DLP-V3-012)', () => {
    it('debe retornar checkpoint con LSN y lagBytes cuando pipeline está ACTIVE', async () => {
      const pipeline: any = {
        id: 'pipe-cdc',
        name: 'cdc-pipe',
        sourceType: 'cdc',
        status: PipelineStatus.ACTIVE,
        lastRunAt: now,
      };

      (mockPipelineRepo.findOne as jest.Mock).mockResolvedValue(pipeline);
      const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.5);

      const result = await service.getCdcCheckpoint('pipe-cdc');

      expect(result.lsn).toBeDefined();
      expect(result.lagBytes).toBeGreaterThan(0);

      randomSpy.mockRestore();
    });

    it('debe retornar lagBytes=0 si pipeline no está ACTIVE', async () => {
      const pipeline: any = {
        id: 'pipe-cdc-paused',
        name: 'cdc-paused',
        sourceType: 'cdc',
        status: PipelineStatus.PAUSED,
        lastRunAt: now,
      };

      (mockPipelineRepo.findOne as jest.Mock).mockResolvedValue(pipeline);

      const result = await service.getCdcCheckpoint('pipe-cdc-paused');

      expect(result.lagBytes).toBe(0);
    });

    it('debe retornar lastProcessedAt="never" si lastRunAt es null', async () => {
      const pipeline: any = {
        id: 'pipe-cdc-new',
        name: 'cdc-new',
        sourceType: 'cdc',
        status: PipelineStatus.DRAFT,
        lastRunAt: null,
      };

      (mockPipelineRepo.findOne as jest.Mock).mockResolvedValue(pipeline);

      const result = await service.getCdcCheckpoint('pipe-cdc-new');

      expect(result.lastProcessedAt).toBe('never');
    });

    it('debe lanzar BadRequest si no es tipo CDC', async () => {
      const pipeline: any = {
        id: 'pipe-kafka',
        sourceType: 'kafka',
        status: PipelineStatus.ACTIVE,
      };

      (mockPipelineRepo.findOne as jest.Mock).mockResolvedValue(pipeline);

      await expect(service.getCdcCheckpoint('pipe-kafka')).rejects.toThrow('no es tipo CDC');
    });
  });

  describe('runQualityValidation (BBC-DLP-V3-013)', () => {
    it('debe ejecutar reglas de calidad y actualizar qualityScore del dataset', async () => {
      const entry: any = {
        id: 'cat-001',
        datasetName: 'test_ds',
        qualityScore: null,
      };

      (mockCatalogRepo.findOne as jest.Mock).mockResolvedValue(entry);
      (mockCatalogRepo.save as jest.Mock).mockResolvedValue(entry);

      const result = await service.runQualityValidation('cat-001', [
        { name: 'not_null_id', type: 'not_null', field: 'id' },
        { name: 'unique_email', type: 'unique', field: 'email' },
      ]);

      expect(result.results.length).toBe(2);
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
    });

    it('debe lanzar NotFoundException si el dataset no existe', async () => {
      (mockCatalogRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.runQualityValidation('cat-999', [])).rejects.toThrow('no encontrado');
    });
  });

  describe('updateQualityScore (BBC-DLP-V3-014)', () => {
    it('debe actualizar qualityScore del dataset', async () => {
      const entry: any = { id: 'cat-001', qualityScore: null };
      (mockCatalogRepo.findOne as jest.Mock).mockResolvedValue(entry);
      (mockCatalogRepo.save as jest.Mock).mockResolvedValue({ ...entry, qualityScore: 85 });

      const result = await service.updateQualityScore('cat-001', 85);

      expect(result.qualityScore).toBe(85);
    });

    it('debe lanzar BadRequest si score < 0 o > 100', async () => {
      await expect(service.updateQualityScore('cat-001', -5)).rejects.toThrow('entre 0 y 100');
      await expect(service.updateQualityScore('cat-001', 150)).rejects.toThrow('entre 0 y 100');
    });

    it('debe lanzar NotFoundException si no existe', async () => {
      (mockCatalogRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.updateQualityScore('cat-999', 80)).rejects.toThrow('no encontrado');
    });
  });

  describe('getDependencyGraph (BBC-DLP-V3-015)', () => {
    it('debe retornar grafo de dependencias con nodos y edges', async () => {
      const pipelines: any[] = [
        { id: 'p1', name: 'pipe-1', status: PipelineStatus.ACTIVE },
      ];
      const entries: any[] = [
        { id: 'c1', datasetName: 'ds-1', qualityScore: 90, lineageUpstream: ['p1'] },
      ];

      (mockPipelineRepo.find as jest.Mock).mockResolvedValue(pipelines);
      (mockCatalogRepo.find as jest.Mock).mockResolvedValue(entries);

      const result = await service.getDependencyGraph();

      expect(result.nodes.length).toBe(2); // 1 pipeline + 1 dataset
      expect(result.edges.length).toBe(1); // p1 → c1
      expect(result.edges[0]).toEqual({ source: 'p1', target: 'c1' });
    });

    it('debe retornar grafo vacío si no hay pipelines ni datasets', async () => {
      (mockPipelineRepo.find as jest.Mock).mockResolvedValue([]);
      (mockCatalogRepo.find as jest.Mock).mockResolvedValue([]);

      const result = await service.getDependencyGraph();

      expect(result.nodes).toEqual([]);
      expect(result.edges).toEqual([]);
    });
  });

  describe('configurePipelineAlerts (BBC-DLP-V3-020)', () => {
    it('debe configurar alertas en advancedOptions del pipeline', async () => {
      const pipeline: any = {
        id: 'pipe-001',
        name: 'monitored-pipe',
        advancedOptions: null,
      };

      (mockPipelineRepo.findOne as jest.Mock).mockResolvedValue(pipeline);
      (mockPipelineRepo.save as jest.Mock).mockResolvedValue(pipeline);

      const result = await service.configurePipelineAlerts('pipe-001', {
        errorThreshold: 10,
        latencyThresholdMs: 500,
        notificationChannel: '#ops-alerts',
      });

      expect(result.configured).toBe(true);
      expect(result.message).toContain('monitored-pipe');
    });

    it('debe preservar advancedOptions existentes', async () => {
      const pipeline: any = {
        id: 'pipe-002',
        name: 'pipe-with-opts',
        advancedOptions: { retryPolicy: 'exponential' },
      };

      (mockPipelineRepo.findOne as jest.Mock).mockResolvedValue(pipeline);
      (mockPipelineRepo.save as jest.Mock).mockResolvedValue(pipeline);

      await service.configurePipelineAlerts('pipe-002', {
        errorThreshold: 5,
        latencyThresholdMs: 200,
        notificationChannel: 'email',
      });

      expect(mockPipelineRepo.save).toHaveBeenCalledWith(expect.objectContaining({
        advancedOptions: expect.objectContaining({
          retryPolicy: 'exponential',
          alertConfig: expect.any(Object),
        }),
      }));
    });

    it('debe lanzar NotFoundException si no existe', async () => {
      (mockPipelineRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.configurePipelineAlerts('pipe-999', {
        errorThreshold: 1,
        latencyThresholdMs: 100,
        notificationChannel: 'x',
      })).rejects.toThrow('no encontrado');
    });
  });
});
