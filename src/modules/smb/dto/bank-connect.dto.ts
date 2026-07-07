import { IsString, IsOptional, IsUUID } from 'class-validator';

export class BankConnectDto {
  @IsUUID()
  companyProfileId: string;

  @IsString()
  institutionFinancialName: string;

  @IsOptional()
  @IsString()
  accountTypeClassification?: string;

  @IsOptional()
  @IsString()
  routingSortTransitNumber?: string;
}
