import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoyaltyProgram } from '../entities/loyalty-program.entity';
import { CreateProgramDto } from '../dto/create-program.dto';

@Injectable()
export class ProgramService {
  constructor(
    @InjectRepository(LoyaltyProgram)
    private repo: Repository<LoyaltyProgram>,
  ) {}

  async create(dto: CreateProgramDto): Promise<LoyaltyProgram> {
    const program = this.repo.create(dto);
    return this.repo.save(program);
  }

  async findAll(): Promise<LoyaltyProgram[]> {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async findById(id: string): Promise<LoyaltyProgram> {
    const program = await this.repo.findOne({ where: { id } });
    if (!program) throw new NotFoundException('Program not found');
    return program;
  }

  async findByCode(code: string): Promise<LoyaltyProgram> {
    const program = await this.repo.findOne({ where: { programCode: code } });
    if (!program) throw new NotFoundException('Program not found');
    return program;
  }

  async update(id: string, dto: Partial<CreateProgramDto>): Promise<LoyaltyProgram> {
    const program = await this.findById(id);
    Object.assign(program, dto);
    return this.repo.save(program);
  }

  async remove(id: string): Promise<void> {
    const program = await this.findById(id);
    await this.repo.remove(program);
  }
}
