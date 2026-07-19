import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsString, IsOptional } from 'class-validator';

export class UnderwritingEvaluateDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  quoteId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  policyId?: string;

  @ApiProperty({ example: { age: 35, smoker: false, occupation: 'engineer' } })
  @IsObject()
  @IsNotEmpty()
  riskData: Record<string, any>;

  @ApiProperty({ example: 'uuid-assessor' })
  @IsString()
  @IsNotEmpty()
  assessedBy: string;
}
