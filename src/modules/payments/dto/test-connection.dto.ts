import { IsString, IsUUID, IsOptional } from 'class-validator';

export class TestConnectionDto {
  @IsUUID()
  connectionId: string;

  @IsOptional()
  @IsString()
  testType?: string;
}
