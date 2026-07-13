import { IsString, IsNumber, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { GiftType } from '../entities/gift-type.enum';

export class LogGiftDto {
  @IsString()
  employeeId: string;

  @IsEnum(GiftType)
  giftType: GiftType;

  @IsString()
  giftDescription: string;

  @IsOptional()
  @IsNumber()
  giftValue?: number;

  @IsString()
  recipientName: string;

  @IsOptional()
  @IsString()
  recipientCompany?: string;

  @IsString()
  businessPurpose: string;

  @IsOptional()
  @IsString()
  eventDate?: string;

  @IsOptional()
  @IsBoolean()
  politicalContribution?: boolean;
}
