import { IsString, IsDateString, IsEnum, IsOptional, IsNumber, IsObject, IsArray, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProjectStatus } from '../entities/project-status.enum';
import { ProjectRisk } from '../entities/project-risk.enum';

export class CreateProjectDto {
  @ApiProperty({ example: 'uuid-here' })
  @IsString()
  companyId: string;

  @ApiProperty({ example: 'Website Redesign' })
  @IsString()
  @MinLength(3)
  projectName: string;

  @ApiProperty({ example: 'Complete redesign of corporate website' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ enum: ProjectStatus, default: ProjectStatus.INITIATING })
  @IsEnum(ProjectStatus)
  @IsOptional()
  status?: ProjectStatus;

  @ApiPropertyOptional({ enum: ProjectRisk, default: ProjectRisk.MEDIUM })
  @IsEnum(ProjectRisk)
  @IsOptional()
  riskLevel?: ProjectRisk;

  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-06-30' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ example: 50000.00 })
  @IsNumber()
  @IsOptional()
  budgetedAmount?: number;

  @ApiPropertyOptional({ example: 'Jane Doe' })
  @IsString()
  @IsOptional()
  projectManager?: string;

  @ApiPropertyOptional({})
  @IsObject()
  @IsOptional()
  milestones?: Record<string, unknown>;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsOptional()
  stakeholders?: string[];

  @ApiPropertyOptional({})
  @IsString()
  @IsOptional()
  notes?: string;
}
