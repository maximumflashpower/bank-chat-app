import { Injectable, Logger } from '@nestjs/common';
import { EntityRegistryService } from './entity-registry.service';

@Injectable()
export class MinorityInterestService {
  private readonly logger = new Logger(MinorityInterestService.name);

  constructor(private readonly entityRegistry: EntityRegistryService) {}

  async calculateNCI(entityId: string, netAssets: number): Promise<{
    nciPercentage: number;
    nciAmount: number;
    parentShare: number;
    parentPercentage: number;
  }> {
    const entity = await this.entityRegistry.findById(entityId);
    const nciPercentage = Number(entity.minorityInterestPct);
    const parentPercentage = 100 - nciPercentage;

    const nciAmount = Math.round(netAssets * (nciPercentage / 100) * 100) / 100;
    const parentShare = Math.round(netAssets * (parentPercentage / 100) * 100) / 100;

    this.logger.log(
      `NCI calculated for ${entity.entityCode}: NCI=${nciAmount} (${nciPercentage}%), Parent=${parentShare} (${parentPercentage}%)`,
    );

    return { nciPercentage, nciAmount, parentShare, parentPercentage };
  }

  async calculateNCIBatch(entities: Array<{ id: string; netAssets: number }>): Promise<{
    totalNci: number;
    totalParent: number;
    details: Array<{ entityId: string; nciAmount: number; parentShare: number }>;
  }> {
    const details = [];
    let totalNci = 0;
    let totalParent = 0;

    for (const item of entities) {
      const result = await this.calculateNCI(item.id, item.netAssets);
      details.push({
        entityId: item.id,
        nciAmount: result.nciAmount,
        parentShare: result.parentShare,
      });
      totalNci += result.nciAmount;
      totalParent += result.parentShare;
    }

    this.logger.log(`NCI batch: total NCI=${totalNci}, total parent=${totalParent}`);
    return { totalNci, totalParent, details };
  }

  async calculateGoodwill(
    entityId: string,
    purchasePrice: number,
    fairValueAssets: number,
    fairValueLiabilities: number,
  ): Promise<{
    goodwill: number;
    nciGoodwill: number;
    parentGoodwill: number;
  }> {
    const entity = await this.entityRegistry.findById(entityId);
    const netAssets = fairValueAssets - fairValueLiabilities;
    const parentPercentage = (100 - Number(entity.minorityInterestPct)) / 100;

    const parentGoodwill = Math.round((purchasePrice - netAssets * parentPercentage) * 100) / 100;
    const nciGoodwill = Math.round((purchasePrice * (Number(entity.minorityInterestPct) / 100)) * 100) / 100;
    const goodwill = parentGoodwill + nciGoodwill;

    this.logger.log(
      `Goodwill for ${entity.entityCode}: total=${goodwill}, parent=${parentGoodwill}, NCI=${nciGoodwill}`,
    );

    return { goodwill, nciGoodwill, parentGoodwill };
  }
}
