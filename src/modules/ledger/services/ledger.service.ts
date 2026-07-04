import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Account } from '../entities/account.entity';
import { Transaction } from '../entities/transaction.entity';
import { AccountType } from '../entities/account-type.enum';
import { AccountStatus } from '../entities/account-status.enum';
import { TransactionType } from '../entities/transaction-type.enum';
import { TransactionStatus } from '../entities/transaction-status.enum';
import { CreateAccountDto } from '../dto/create-account.dto';
import { TransferDto } from '../dto/transfer.dto';
import { DepositDto } from '../dto/deposit.dto';

@Injectable()
export class LedgerService {
  private readonly logger = new Logger(LedgerService.name);

  constructor(
    @InjectRepository(Account)
    private accountRepo: Repository<Account>,
    @InjectRepository(Transaction)
    private txRepo: Repository<Transaction>,
    private dataSource: DataSource,
  ) {}

  async createAccount(userId: string, dto: CreateAccountDto): Promise<Account> {
    const accountNumber = this.generateAccountNumber();

    const account = this.accountRepo.create({
      userId,
      accountNumber,
      type: dto.type,
      alias: dto.alias ?? null,
      currency: dto.currency ?? 'MXN',
      status: AccountStatus.ACTIVE,
      balance: 0,
    });
    await this.accountRepo.save(account);

    this.logger.log(`Account created: ${account.id} — user: ${userId} — type: ${dto.type}`);
    return account;
  }

  async getAccounts(userId: string): Promise<Account[]> {
    return this.accountRepo.find({
      where: { userId },
      order: { createdAt: 'ASC' },
    });
  }

  async getAccountById(userId: string, accountId: string): Promise<Account> {
    const account = await this.accountRepo.findOne({ where: { id: accountId } });
    if (!account) {
      throw new NotFoundException('Account not found');
    }
    if (account.userId !== userId) {
      throw new NotFoundException('Account not found');
    }
    return account;
  }

  async getBalance(userId: string, accountId: string): Promise<{ balance: number; currency: string }> {
    const account = await this.getAccountById(userId, accountId);
    return { balance: account.balance, currency: account.currency };
  }

  async deposit(userId: string, accountId: string, dto: DepositDto): Promise<Transaction> {
    return this.dataSource.transaction(async (manager) => {
      const account = await manager.findOne(Account, {
        where: { id: accountId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!account) {
        throw new NotFoundException('Account not found');
      }
      if (account.userId !== userId) {
        throw new NotFoundException('Account not found');
      }
      if (account.status !== AccountStatus.ACTIVE) {
        throw new BadRequestException('Account is not active');
      }

      const newBalance = Number(account.balance) + Number(dto.amount);
      account.balance = newBalance;
      await manager.save(account);

      const tx = manager.create(Transaction, {
        accountId: account.id,
        type: TransactionType.DEPOSIT,
        status: TransactionStatus.COMPLETED,
        amount: dto.amount,
        currency: account.currency,
        description: dto.description ?? 'Deposit',
        balanceAfter: newBalance,
      });
      const savedTx = await manager.save(tx);

      this.logger.log(`Deposit: ${dto.amount} to account ${accountId} — new balance: ${newBalance}`);
      return savedTx;
    });
  }

  async transfer(userId: string, fromAccountId: string, dto: TransferDto): Promise<Transaction[]> {
    return this.dataSource.transaction(async (manager) => {
      // Lock both accounts
      const fromAccount = await manager.findOne(Account, {
        where: { id: fromAccountId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!fromAccount) {
        throw new NotFoundException('Source account not found');
      }
      if (fromAccount.userId !== userId) {
        throw new NotFoundException('Source account not found');
      }
      if (fromAccount.status !== AccountStatus.ACTIVE) {
        throw new BadRequestException('Source account is not active');
      }

      const toAccount = await manager.findOne(Account, {
        where: { accountNumber: dto.toAccountNumber },
        lock: { mode: 'pessimistic_write' },
      });

      if (!toAccount) {
        throw new NotFoundException('Destination account not found');
      }
      if (toAccount.status !== AccountStatus.ACTIVE) {
        throw new BadRequestException('Destination account is not active');
      }
      if (fromAccount.id === toAccount.id) {
        throw new BadRequestException('Cannot transfer to the same account');
      }

      const amount = Number(dto.amount);
      if (Number(fromAccount.balance) < amount) {
        throw new BadRequestException('Insufficient funds');
      }

      // Debit source
      const fromNewBalance = Number(fromAccount.balance) - amount;
      fromAccount.balance = fromNewBalance;
      await manager.save(fromAccount);

      // Credit destination
      const toNewBalance = Number(toAccount.balance) + amount;
      toAccount.balance = toNewBalance;
      await manager.save(toAccount);

      // Create both transaction records
      const txOut = manager.create(Transaction, {
        accountId: fromAccount.id,
        counterpartyAccountId: toAccount.id,
        type: TransactionType.TRANSFER_OUT,
        status: TransactionStatus.COMPLETED,
        amount: amount,
        currency: fromAccount.currency,
        description: dto.description ?? 'Transfer',
        balanceAfter: fromNewBalance,
      });
      const savedTxOut = await manager.save(txOut);

      const txIn = manager.create(Transaction, {
        accountId: toAccount.id,
        counterpartyAccountId: fromAccount.id,
        type: TransactionType.TRANSFER_IN,
        status: TransactionStatus.COMPLETED,
        amount: amount,
        currency: toAccount.currency,
        description: dto.description ?? 'Transfer received',
        balanceAfter: toNewBalance,
      });
      const savedTxIn = await manager.save(txIn);

      this.logger.log(`Transfer: ${amount} from ${fromAccountId} to ${toAccount.id}`);
      return [savedTxOut, savedTxIn];
    });
  }

  async getTransactions(userId: string, accountId: string, limit = 50): Promise<Transaction[]> {
    const account = await this.getAccountById(userId, accountId);
    return this.txRepo.find({
      where: { accountId: account.id },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  // --- Private helpers ---

  private generateAccountNumber(): string {
    const timestamp = Date.now().toString().slice(-10);
    const random = Math.floor(Math.random() * 99999).toString().padStart(5, '0');
    return `00${timestamp}${random}`.slice(0, 20);
  }
}
