import { IsUUID, IsString, MaxLength, IsNotEmpty } from 'class-validator';

export class CreateInventoryPostingRuleDto {
  @IsUUID()
  @IsNotEmpty()
  companyProfileId: string;

  @IsString()
  @MaxLength(50)
  @IsNotEmpty()
  movementType: string;

  @IsString()
  @MaxLength(100)
  @IsNotEmpty()
  debitAccountType: string;

  @IsUUID()
  @IsNotEmpty()
  debitAccountId: string;

  @IsString()
  @MaxLength(100)
  @IsNotEmpty()
  creditAccountType: string;

  @IsUUID()
  @IsNotEmpty()
  creditAccountId: string;
}
