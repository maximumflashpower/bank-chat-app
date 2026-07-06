import { IsUUID, IsBoolean, IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DelegationApproveDto {
  @ApiProperty({ type: () => String })
  @IsUUID()
  delegationId: string;

  @ApiProperty({ type: () => Boolean })
  @IsBoolean()
  approved: boolean;

  @ApiPropertyOptional({ type: () => String })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  reason?: string;
}
