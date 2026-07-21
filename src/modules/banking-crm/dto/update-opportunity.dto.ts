import { IsString, IsEnum, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OpportunityStage } from './create-opportunity.dto';

export class UpdateOpportunityStageDto {
  @ApiProperty({ description: 'Nueva etapa de la oportunidad', enum: OpportunityStage })
  @IsEnum(OpportunityStage)
  stage: OpportunityStage;
}

export class UpdateOpportunityResultDto {
  @ApiProperty({ description: 'Resultado: aceptado o rechazado' })
  @IsString()
  result: 'accepted' | 'rejected';

  @ApiProperty({ description: 'Feedback del cliente', required: false })
  @IsOptional()
  @IsString()
  feedback?: string;
}
