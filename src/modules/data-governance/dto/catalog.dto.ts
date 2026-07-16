import { IsString, IsEnum, IsOptional, IsArray } from 'class-validator';
import { DatasetType } from '../entities/datagov-catalog-entry.entity';

export class RegisterDatasetDto {
  @IsString()
  datasetName: string;

  @IsEnum(DatasetType)
  datasetType: DatasetType;

  @IsString()
  sourceSystem: string;

  @IsOptional()
  @IsString()
  ownerId?: string;

  @IsOptional()
  @IsString()
  stewardId?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class SearchCatalogDto {
  @IsOptional()
  @IsString()
  query?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
