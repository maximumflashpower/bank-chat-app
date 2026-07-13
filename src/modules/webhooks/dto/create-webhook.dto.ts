import { IsString, IsArray, IsOptional, IsInt, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateWebhookDto {
  @IsString()
  endpointUrl: string;

  @IsArray()
  @IsString({ each: true })
  eventTypes: string[];

  @IsString()
  @IsOptional()
  apiVersion?: string;

  @IsInt()
  @IsOptional()
  maxRetries?: number;

  @ValidateNested()
  @Type(() => Object)
  @IsOptional()
  headers?: Record<string, string>;
}
