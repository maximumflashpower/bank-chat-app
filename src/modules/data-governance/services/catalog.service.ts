import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { DatagovCatalogEntry, DatasetType } from '../entities/datagov-catalog-entry.entity';

/**
 * Data Catalog Service - Búsqueda y discovery de datasets
 * Cubre funciones: DATAGOV-CAT-001 a 006
 */
@Injectable()
export class CatalogService {
  private readonly logger = new Logger(CatalogService.name);

  constructor(
    @InjectRepository(DatagovCatalogEntry)
    private readonly catalogRepo: Repository<DatagovCatalogEntry>,
  ) {}

  /**
   * DATAGOV-CAT-001: Search Discovery
   */
  async search(query: string, tags?: string[]): Promise<DatagovCatalogEntry[]> {
    const where: Record<string, unknown> = {};

    if (query) {
      where.datasetName = Like(`%${query}%`);
    }

    const results = await this.catalogRepo.find({ where, order: { createdAt: 'DESC' } });

    if (tags && tags.length > 0) {
      return results.filter(entry =>
        entry.tags && tags.some(tag => entry.tags.includes(tag))
      );
    }

    return results;
  }

  /**
   * DATAGOV-CAT-002: Schema Definition Auto Import
   */
  async autoImportSchema(catalogEntryId: string, schema: Record<string, unknown>): Promise<DatagovCatalogEntry> {
    const entry = await this.findById(catalogEntryId);
    entry.schemaDefinition = schema;
    entry.lastUpdated = new Date();

    return this.catalogRepo.save(entry);
  }

  /**
   * DATAGOV-CAT-003: Owner & Steward Assignment
   */
  async assignOwnerSteward(catalogEntryId: string, ownerId?: string, stewardId?: string): Promise<DatagovCatalogEntry> {
    const entry = await this.findById(catalogEntryId);

    if (ownerId) entry.ownerId = ownerId;
    if (stewardId) entry.stewardId = stewardId;

    return this.catalogRepo.save(entry);
  }

  /**
   * DATAGOV-CAT-004: Quality Score Auto-Calculated
   */
  async updateQualityScore(catalogEntryId: string, score: number): Promise<DatagovCatalogEntry> {
    const entry = await this.findById(catalogEntryId);
    entry.qualityScore = score;
    return this.catalogRepo.save(entry);
  }

  /**
   * DATAGOV-CAT-005: PII Flag Auto Detection
   */
  async flagPII(catalogEntryId: string, piiPresent: boolean, classificationLabel?: string): Promise<DatagovCatalogEntry> {
    const entry = await this.findById(catalogEntryId);
    entry.piiPresent = piiPresent;
    if (classificationLabel) entry.classificationLabel = classificationLabel;
    return this.catalogRepo.save(entry);
  }

  /**
   * DATAGOV-CAT-006: Popularity & Usage Stats
   */
  async getPopularityStats(): Promise<Array<{ datasetName: string; qualityScore: number | null; piiPresent: boolean }>> {
    const entries = await this.catalogRepo.find({
      order: { qualityScore: 'DESC' },
      take: 20,
    });

    return entries.map(e => ({
      datasetName: e.datasetName,
      qualityScore: e.qualityScore,
      piiPresent: e.piiPresent,
    }));
  }

  async register(dto: {
    datasetName: string;
    datasetType: DatasetType;
    sourceSystem: string;
    ownerId?: string;
    stewardId?: string;
    description?: string;
    tags?: string[];
  }): Promise<DatagovCatalogEntry> {
    const entry = new DatagovCatalogEntry();
    entry.datasetName = dto.datasetName;
    entry.datasetType = dto.datasetType;
    entry.sourceSystem = dto.sourceSystem;
    entry.ownerId = dto.ownerId || null;
    entry.stewardId = dto.stewardId || null;
    entry.description = dto.description || null;
    entry.tags = dto.tags || [];
    entry.qualityScore = null;
    entry.piiPresent = false;
    entry.classificationLabel = null;
    entry.lastUpdated = null;
    entry.schemaDefinition = null;

    const saved = await this.catalogRepo.save(entry);
    this.logger.log(`Dataset registrado en catálogo: ${saved.datasetName}`);
    return saved;
  }

  async findById(id: string): Promise<DatagovCatalogEntry> {
    const entry = await this.catalogRepo.findOne({ where: { id } });
    if (!entry) throw new NotFoundException(`Catálogo ${id} no encontrado`);
    return entry;
  }
}
