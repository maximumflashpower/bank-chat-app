import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Logger } from '@nestjs/common';
import { LedgerChartOfAccounts } from '../entities/ledger_chart_of_accounts.entity';
import { CreateChartOfAccountsDto } from '../dto/create-chart-of-accounts.dto';

@Injectable()
export class ChartOfAccountsService {
  private readonly logger = new Logger(ChartOfAccountsService.name);

  constructor(
    @InjectRepository(LedgerChartOfAccounts)
    private coaRepo: Repository<LedgerChartOfAccounts>,
  ) {}

  async create(dto: CreateChartOfAccountsDto): Promise<LedgerChartOfAccounts> {
    const existing = await this.coaRepo.findOne({ where: { account_code: dto.account_code } });
    if (existing) {
      throw new BadRequestException(`Account code ${dto.account_code} already exists`);
    }

    if (dto.parent_account_id) {
      const parent = await this.coaRepo.findOne({ where: { id: dto.parent_account_id } });
      if (!parent) {
        throw new NotFoundException('Parent account not found');
      }
    }

    const account = this.coaRepo.create({
      account_code: dto.account_code,
      account_name: dto.account_name,
      account_type: dto.account_type,
      parent_account_id: dto.parent_account_id || null,
      level: dto.level || 1,
      is_postable: dto.is_postable ?? true,
      is_control_account: dto.is_control_account ?? false,
      normal_balance: dto.normal_balance,
      currency: dto.currency || 'USD',
      xbrl_tag: dto.xbrl_tag || null,
    });

    const saved = await this.coaRepo.save(account);
    this.logger.log(`Chart of accounts created: ${saved.account_code}`);
    return saved;
  }

  async findAll(): Promise<LedgerChartOfAccounts[]> {
    return this.coaRepo.find({ order: { account_code: 'ASC' } });
  }

  async findById(id: string): Promise<LedgerChartOfAccounts> {
    const account = await this.coaRepo.findOne({ where: { id } });
    if (!account) {
      throw new NotFoundException('Chart of accounts entry not found');
    }
    return account;
  }

  async findByCode(code: string): Promise<LedgerChartOfAccounts> {
    const account = await this.coaRepo.findOne({ where: { account_code: code } });
    if (!account) {
      throw new NotFoundException('Chart of accounts entry not found');
    }
    return account;
  }

  async update(id: string, dto: Partial<CreateChartOfAccountsDto>): Promise<LedgerChartOfAccounts> {
    const account = await this.findById(id);

    if (dto.account_code && dto.account_code !== account.account_code) {
      const existing = await this.coaRepo.findOne({ where: { account_code: dto.account_code } });
      if (existing && existing.id !== id) {
        throw new BadRequestException(`Account code ${dto.account_code} already exists`);
      }
    }

    Object.assign(account, dto);
    const saved = await this.coaRepo.save(account);
    this.logger.log(`Chart of accounts updated: ${saved.account_code}`);
    return saved;
  }

  async getHierarchy(): Promise<LedgerChartOfAccounts[]> {
    return this.coaRepo.createQueryBuilder('coa')
      .orderBy('coa.level', 'ASC')
      .addOrderBy('coa.account_code', 'ASC')
      .getMany();
  }

  async getBalancesForAccount(accountId: string): Promise<{ debit: number; credit: number }> {
    return { debit: 0, credit: 0 }; // Stub — wires to JournalLine repo in future
  }
}
