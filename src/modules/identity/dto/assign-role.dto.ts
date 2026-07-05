import { IsString, IsUUID, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AssignRoleDto {
  @ApiProperty({ example: 'uuid-here' })
  @IsUUID()
  userId: string;

  @ApiProperty({ example: 'uuid-here' })
  @IsUUID()
  roleId: string;

  @ApiPropertyOptional({ example: null })
  @IsOptional()
  @IsUUID()
  orgId?: string;
}
