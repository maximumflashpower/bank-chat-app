import { IsString, IsInt, IsOptional } from 'class-validator';

export class GenerateDeclarationDto {
  @IsString()
  declarationType: string;

  @IsInt()
  fiscalYear: number;

  @IsInt()
  periodNumber: number;

  @IsString()
  countryCode: string;

  @IsOptional()
  @IsString()
  preparedBy?: string;
}
