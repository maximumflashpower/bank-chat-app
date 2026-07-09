import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PepRecord } from '../entities/pep-record.entity';

@Injectable()
export class PepService {
  private readonly logger = new Logger(PepService.name);

  constructor(
    @InjectRepository(PepRecord)
    private readonly repo: Repository<PepRecord>,
  ) {}

  /** BBC-PEP-001: Politically Exposed Person Database Lookup */
  async searchPep(name: string): Promise<{ isPep: boolean; records: PepRecord[]; matchCount: number }> {
    if (!name || name.trim().length < 2) {
      throw new BadRequestException('Search name must be at least 2 characters');
    }
    const query = this.repo
      .createQueryBuilder('pep')
      .where('pep.full_name ILIKE :name', { name: `%${name}%` })
      .andWhere('pep.is_active = true');
    const records = await query.getMany();
    const isPep = records.length > 0;
    this.logger.log(`PEP search for "${name}": ${records.length} matches found`);
    return { isPep, records, matchCount: records.length };
  }

  /** BBC-PEP-002: Family Members Close Associates Screen FCA */
  async screenFamilyAndAssociates(pepId: string): Promise<{ familyMembers: string[]; closeAssociates: string[]; screened: boolean }> {
    const pep = await this.repo.findOne({ where: { id: pepId } });
    if (!pep) {
      throw new BadRequestException(`PEP record ${pepId} not found`);
    }
    const familyMembers = pep.familyMembers || [];
    const closeAssociates = pep.closeAssociates || [];
    this.logger.log(`FCA screen for PEP ${pepId}: ${familyMembers.length} family, ${closeAssociates.length} associates`);
    return { familyMembers, closeAssociates, screened: true };
  }
}
