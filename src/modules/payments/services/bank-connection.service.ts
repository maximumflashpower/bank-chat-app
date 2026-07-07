import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BankConnectionConfig } from '../entities/bank-connection-config.entity';
import { TestConnectionDto } from '../dto/test-connection.dto';

@Injectable()
export class BankConnectionService {
  constructor(
    @InjectRepository(BankConnectionConfig)
    private repo: Repository<BankConnectionConfig>,
  ) {}

  async create(config: Partial<BankConnectionConfig>): Promise<BankConnectionConfig> {
    const connection = this.repo.create({
      ...config,
      connectionStatus: 'DISCONNECTED',
      pollFrequencyMinutes: 15,
      failoverEnabled: true,
    });
    return this.repo.save(connection);
  }

  async findAll(): Promise<BankConnectionConfig[]> {
    return this.repo.find();
  }

  async findById(id: string): Promise<BankConnectionConfig | null> {
    return this.repo.findOne({ where: { id } });
  }

  async updateStatus(id: string, status: string): Promise<void> {
    await this.repo.update(id, {
      connectionStatus: status,
      lastSuccessfulPoll: status === 'ACTIVE' ? new Date() : undefined,
    });
  }

  async testConnection(dto: TestConnectionDto): Promise<{ success: boolean; responseTime: number; status: string }> {
    const connection = await this.findById(dto.connectionId);
    if (!connection) throw new NotFoundException(`Connection ${dto.connectionId} not found`);

    const startTime = Date.now();
    
    const success = Math.random() > 0.1;
    const responseTime = success ? 250 + Math.random() * 500 : 0;

    if (success) {
      await this.updateStatus(dto.connectionId, 'ACTIVE');
    } else {
      await this.updateStatus(dto.connectionId, 'ERROR');
    }

    return {
      success,
      responseTime: Math.round(responseTime),
      status: success ? 'ACTIVE' : 'ERROR',
    };
  }

  async checkDailyVolume(connectionId: string, proposedAmount: number): Promise<{
    withinLimit: boolean;
    remaining: number;
    dailyLimit: number;
  }> {
    const connection = await this.findById(connectionId);
    if (!connection) throw new NotFoundException(`Connection ${connectionId} not found`);

    const limit = connection.dailyVolumeLimit ?? 0;
    const remaining = connection.remainingDailyVolume ?? limit;

    return {
      withinLimit: proposedAmount <= remaining,
      remaining,
      dailyLimit: limit,
    };
  }

  async resetDailyLimits(): Promise<number> {
    const connections = await this.repo.find();
    let updated = 0;

    for (const conn of connections) {
      if (conn.dailyVolumeLimit) {
        await this.repo.update(conn.id, {
          remainingDailyVolume: conn.dailyVolumeLimit,
        });
        updated++;
      }
    }

    return updated;
  }
}
