import { IsString, IsOptional, IsArray } from 'class-validator';

export class DeclareCoiDto {
  @IsString()
  employeeId: string;

  @IsString()
  declaration: string;

  @IsOptional()
  @IsArray()
  relatedVendors?: string[];
}
