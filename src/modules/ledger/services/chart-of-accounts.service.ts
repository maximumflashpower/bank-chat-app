import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { Logger } from '@nestjs/common';
import { LedgerChartOfAccounts } from '../entities/ledger_chart_of_accounts.entity';
import { LedgerJournalLine } from '../entities/ledger_journal_line.entity';
import { LedgerJournalEntry } from '../entities/ledger_journal_entry.entity';
import { JournalEntryStatus } from '../entities/journal-entry-status.enum';
import { CreateChartOfAccountsDto } from '../dto/create-chart-of-accounts.dto';

interface HierarchicalAccount {
  id: string;
  account_code: string;
  account_name: string;
  account_type: string;
  level: number;
  parent_account_id: string | null;
  is_postable: boolean;
  balance: number;
  debit: number;
  credit: number;
  children: HierarchicalAccount[];
}

@Injectable()
export class ChartOfAccountsService {
  private readonly logger = new Logger(ChartOfAccountsService.name);

  constructor(
    @InjectRepository(LedgerChartOfAccounts)
    private coaRepo: Repository<LedgerChartOfAccounts>,
    @InjectRepository(LedgerJournalLine)
    private lineRepo: Repository<LedgerJournalLine>,
    @InjectRepository(LedgerJournalEntry)
    private jeRepo: Repository<LedgerJournalEntry>,
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

  /**
   * US-013-03: Get actual balance for an account from journal lines
   */
  async getBalancesForAccount(accountId: string): Promise<{ debit: number; credit: number; balance: number }> {
    const account = await this.findById(accountId);
    const lines = await this.lineRepo
      .createQueryBuilder('jl')
      .innerJoin('jl.journal_entry', 'je')
      .where('jl.account_id = :accountId', { accountId })
      .andWhere('je.status = :status', { status: JournalEntryStatus.POSTED })
      .select([
        'SUM(jl.debit) AS debit',
        'SUM(jl.credit) AS credit',
      ])
      .getRawOne();

    const debit = Number(lines?.debit) || 0;
    const credit = Number(lines?.credit) || 0;
    
    // Normal balance determines if debit or credit increases the account
    let balance: number;
    if (account.normal_balance === 'debit') {
      balance = debit - credit;
    } else {
      balance = credit - debit;
    }

    return { debit, credit, balance };
  }

  /**
   * US-013-03: Get hierarchical tree with rolled-up balances from children
   */
  async getHierarchicalTree(): Promise<HierarchicalAccount[]> {
    // Get all accounts
    const allAccounts = await this.coaRepo.find({ order: { level: 'ASC', account_code: 'ASC' } });
    
    // Build map for quick lookup
    const accountMap = new Map<string, any>();
    for (const acc of allAccounts) {
      accountMap.set(acc.id, {
        id: acc.id,
        account_code: acc.account_code,
        account_name: acc.account_name,
        account_type: acc.account_type,
        level: acc.level,
        parent_account_id: acc.parent_account_id,
        is_postable: acc.is_postable,
        balance: 0,
        debit: 0,
        credit: 0,
        children: [],
      });
    }

    // Get balances for postable accounts only
    const postableIds = allAccounts.filter(a => a.is_postable).map(a => a.id);
    if (postableIds.length > 0) {
      const lines = await this.lineRepo
        .createQueryBuilder('jl')
        .innerJoin('jl.journal_entry', 'je')
        .where('jl.account_id IN (:...ids)', { ids: postableIds })
        .andWhere('je.status = :status', { status: JournalEntryStatus.POSTED })
        .select([
          'jl.account_id AS account_id',
          'SUM(jl.debit) AS debit',
          'SUM(jl.credit) AS credit',
        ])
        .groupBy('jl.account_id')
        .getRawMany();

      for (const line of lines) {
        const acc = accountMap.get(line.account_id);
        if (acc) {
          acc.debit = Number(line.debit) || 0;
          acc.credit = Number(line.credit) || 0;
          
          // Calculate based on normal balance (would need to store it in map too)
          const origAcc = allAccounts.find(a => a.id === line.account_id);
          if (origAcc?.normal_balance === 'debit') {
            acc.balance = acc.debit - acc.credit;
          } else {
            acc.balance = acc.credit - acc.debit;
          }
        }
      }
    }

    // Build hierarchy with rollup
    for (const acc of Array.from(accountMap.values())) {
      if (acc.parent_account_id) {
        const parent = accountMap.get(acc.parent_account_id);
        if (parent) {
          parent.children.push(acc);
          
          // Rollup: add child balance to parent
          parent.balance += acc.balance;
          parent.debit += acc.debit;
          parent.credit += acc.credit;
        }
      }
    }

    // Return root accounts (no parent)
    const roots = Array.from(accountMap.values()).filter(a => !a.parent_account_id);
    return roots;
  }

  /**
   * Get all children accounts recursively for a given account
   */
  async getChildrenRecursively(accountId: string): Promise<HierarchicalAccount[]> {
    const account = await this.findById(accountId);
    const allAccounts = await this.coaRepo.find();
    
    const buildTree = (parentId: string): HierarchicalAccount[] => {
      const children = allAccounts.filter(a => a.parent_account_id === parentId);
      
      return children.map(child => {
        const node: HierarchicalAccount = {
          id: child.id,
          account_code: child.account_code,
          account_name: child.account_name,
          account_type: child.account_type,
          level: child.level,
          parent_account_id: child.parent_account_id,
          is_postable: child.is_postable,
          balance: 0,
          debit: 0,
          credit: 0,
          children: buildTree(child.id),
        };
        
        return node;
      });
    };

    return buildTree(accountId);
  }
}
