import { IsString, IsOptional } from 'class-validator';

export class ReconcileAutoDto {
  @IsOptional()
  @IsString()
  fromDate?: string;

  @IsOptional()
  @IsString()
  toDate?: string;

  @IsOptional()
  @IsString()
  accountId?: string;
}
