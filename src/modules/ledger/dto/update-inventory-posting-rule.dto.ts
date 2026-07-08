import { IsUUID, IsString, MaxLength, IsOptional, IsBoolean } from 'class-validator';

export class UpdateInventoryPostingRuleDto {
  @IsUUID()
  @IsOptional()
  debitAccountId?: string;

  @IsUUID()
  @IsOptional()
  creditAccountId?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
