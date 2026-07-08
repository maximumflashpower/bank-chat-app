import { IsUUID, IsString, MaxLength, IsNotEmpty } from 'class-validator';

export class CreateInventoryAccountMappingDto {
  @IsUUID()
  @IsNotEmpty()
  companyId: string;

  @IsString()
  @MaxLength(100)
  @IsNotEmpty()
  category: string;

  @IsString()
  @MaxLength(50)
  @IsNotEmpty()
  movementType: string;

  @IsUUID()
  @IsNotEmpty()
  accountId: string;
}
