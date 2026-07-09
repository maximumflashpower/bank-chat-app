import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdverseMediaResult } from '../entities/adverse-media.entity';

@Injectable()
export class AdverseMediaService {
  private readonly logger = new Logger(AdverseMediaService.name);

  constructor(
    @InjectRepository(AdverseMediaResult)
    private readonly repo: Repository<AdverseMediaResult>,
  ) {}

  /** BBC-ADVMED-001: Adverse Media Negative News Scanning Automated */
  async scanEntity(entityName: string, sources?: string[]): Promise<{
    hits: AdverseMediaResult[];
    relevantHits: number;
    severityBreakdown: { high: number; medium: number; low: number };
    scanned: boolean;
  }> {
    if (!entityName || entityName.trim().length < 2) {
      throw new BadRequestException('Entity name must be at least 2 characters');
    }

    // Stub: simulated adverse media scan
    const mockResults: AdverseMediaResult[] = [
      Object.assign(new AdverseMediaResult(), {
        entityName,
        sourceUrl: 'https://news.example.com/article-1',
        headline: `${entityName} faces regulatory inquiry`,
        publishedDate: new Date(Date.now() - 86400000 * 30),
        severity: 'medium',
        categories: ['regulatory', 'financial'],
        isRelevant: true,
      }),
      Object.assign(new AdverseMediaResult(), {
        entityName,
        sourceUrl: 'https://news.example.com/article-2',
        headline: `${entityName} launches new product line`,
        publishedDate: new Date(Date.now() - 86400000 * 5),
        severity: 'low',
        categories: ['business'],
        isRelevant: false,
      }),
    ];

    for (const result of mockResults) {
      await this.repo.save(result);
    }

    const relevantHits = mockResults.filter((r) => r.isRelevant).length;
    const severityBreakdown = {
      high: mockResults.filter((r) => r.severity === 'high').length,
      medium: mockResults.filter((r) => r.severity === 'medium').length,
      low: mockResults.filter((r) => r.severity === 'low').length,
    };

    this.logger.log(`Adverse media scan for ${entityName}: ${mockResults.length} hits, ${relevantHits} relevant`);
    return { hits: mockResults, relevantHits, severityBreakdown, scanned: true };
  }

  /** Get all adverse media results for an entity */
  async getByEntity(entityName: string): Promise<AdverseMediaResult[]> {
    return this.repo.find({ where: { entityName }, order: { publishedDate: 'DESC' } });
  }

  /** Mark a result as reviewed/not relevant */
  async markNotRelevant(id: string): Promise<AdverseMediaResult> {
    const result = await this.repo.findOne({ where: { id } });
    if (!result) {
      throw new NotFoundException(`Adverse media result ${id} not found`);
    }
    result.isRelevant = false;
    return this.repo.save(result);
  }
}
