import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { ThreatIntelFeed, AuthType } from '../entities/threat-intel-feed.entity';
import { IoCCache, IoCType, IoCTag } from '../entities/ioc-cache.entity';

export interface IoCMatch {
  ioc: IoCCache;
  matchType: string;
}

@Injectable()
export class ThreatIntelService {
  constructor(
    @InjectRepository(ThreatIntelFeed)
    private feedRepo: Repository<ThreatIntelFeed>,
    @InjectRepository(IoCCache)
    private iocRepo: Repository<IoCCache>,
  ) {}

  async createFeed(feedData: Partial<ThreatIntelFeed>): Promise<ThreatIntelFeed> {
    const feed = this.feedRepo.create(feedData);
    return this.feedRepo.save(feed);
  }

  async findAllFeeds(): Promise<ThreatIntelFeed[]> {
    return this.feedRepo.find({ where: { active: true } });
  }

  async syncFeeds(feedIds?: string[], forceFullSync?: boolean): Promise<{
    synced: number;
    newIoCs: number;
    updatedIoCs: number;
  }> {
    const feeds = feedIds 
      ? await this.feedRepo.findBy({ id: feedIds[0] as any })
      : await this.findAllFeeds();

    if (!feeds || feeds.length === 0) {
      return { synced: 0, newIoCs: 0, updatedIoCs: 0 };
    }

    let totalNew = 0;
    let totalUpdated = 0;

    for (const feed of feeds) {
      const hoursSinceLastSync = forceFullSync ? 999999 : 
        Math.floor((Date.now() - (feed.lastSyncedAt?.getTime() || 0)) / (1000 * 60 * 60));
      
      if (hoursSinceLastSync >= feed.syncFrequencyHours) {
        const iocs = await this.fetchAndParseFeed(feed);
        
        for (const ioc of iocs) {
          if ((ioc.confidenceScore ?? 0) >= feed.confidenceThreshold) {
            const existing = await this.iocRepo.findOne({ where: { value: ioc.value } });
            
            if (existing) {
              existing.lastSeen = new Date();
              existing.confidenceScore = Math.max(existing.confidenceScore, ioc.confidenceScore ?? 0);
              await this.iocRepo.save(existing);
              totalUpdated++;
            } else {
              ioc.feedId = feed.id;
              await this.iocRepo.save(ioc);
              totalNew++;
            }
          }
        }

        feed.lastSyncedAt = new Date();
        feed.iocCountLoaded = await this.iocRepo.count({ where: { feedId: feed.id } });
        await this.feedRepo.save(feed);
      }
    }

    return {
      synced: feeds.length,
      newIoCs: totalNew,
      updatedIoCs: totalUpdated,
    };
  }

  private async fetchAndParseFeed(feed: ThreatIntelFeed): Promise<Partial<IoCCache>[]> {
    return [
      {
        type: IoCType.IPV4,
        value: '192.168.1.100',
        source: feed.providerName,
        confidenceScore: 85,
        tags: [IoCTag.MALWARE],
      },
      {
        type: IoCType.DOMAIN,
        value: 'malicious.example.com',
        source: feed.providerName,
        confidenceScore: 90,
        tags: [IoCTag.C2],
      },
    ];
  }

  async searchIoCs(query: string, type?: IoCType): Promise<IoCCache[]> {
    const qb = this.iocRepo.createQueryBuilder('ioc')
      .where('ioc.value ILIKE :query', { query: `%${query}%` })
      .andWhere('ioc.isBlocked = :blocked', { blocked: true });

    if (type) {
      qb.andWhere('ioc.type = :type', { type });
    }

    return qb.getMany();
  }

  async getBlocklist(filter?: { type?: IoCType; tag?: string }): Promise<IoCCache[]> {
    const qb = this.iocRepo.createQueryBuilder('ioc')
      .where('ioc.isBlocked = :blocked', { blocked: true })
      .andWhere('ioc.expiration IS NULL OR ioc.expiration > NOW()');

    if (filter?.type) {
      qb.andWhere('ioc.type = :type', { type: filter.type });
    }

    if (filter?.tag) {
      qb.andWhere('ioc.tags @> ARRAY[:tag]', { tag: filter.tag });
    }

    return qb.getMany();
  }

  async cleanupExpiredIoCs(): Promise<number> {
    const expired = await this.iocRepo.find({
      where: { expiration: LessThan(new Date()) },
    });

    await this.iocRepo.delete({ expiration: LessThan(new Date()) });
    return expired.length;
  }

  async submitToConsortium(iocValues: string[]): Promise<void> {
    const shared = await this.iocRepo.update(
      { value: iocValues[0] as any },
      { tags: [...iocValues] as any }
    );
  }
}
