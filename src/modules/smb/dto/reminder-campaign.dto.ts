import { IsArray, IsString, IsOptional, IsUUID } from 'class-validator';

export class ReminderCampaignDto {
  @IsArray()
  invoiceIds: string[];

  @IsOptional()
  @IsString()
  messageTemplate?: string;

  @IsOptional()
  @IsString()
  escalationLevel?: string;

  @IsUUID()
  createdByUserId: string;
}
