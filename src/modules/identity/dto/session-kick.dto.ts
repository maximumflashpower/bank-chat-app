import { IsUUID, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SessionKickDto {
  @ApiPropertyOptional({ type: () => String, description: 'Specific user to kick. If omitted, kicks all.' })
  @IsUUID()
  @IsOptional()
  targetUserId?: string;

  @ApiPropertyOptional({ type: () => String, description: 'Keep this session alive' })
  @IsUUID()
  @IsOptional()
  keepSessionId?: string;
}
