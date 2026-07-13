import { IsArray, IsOptional, IsBoolean } from 'class-validator';

export class SyncFeedsDto {
  @IsArray()
  @IsOptional()
  feedIds?: string[];

  @IsBoolean()
  @IsOptional()
  forceFullSync?: boolean;
}
