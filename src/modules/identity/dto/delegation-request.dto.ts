import { IsUUID, IsString, IsArray, IsOptional, MaxLength, ArrayNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DelegationRequestDto {
  @ApiProperty({ type: () => String })
  @IsUUID()
  approverId: string;

  @ApiProperty({ example: 'admin_permission_grant' })
  @IsString()
  @MaxLength(100)
  actionType: string;

  @ApiProperty({ example: 'Temporary admin access for emergency maintenance' })
  @IsString()
  justification: string;

  @ApiPropertyOptional({ type: () => [String] })
  @IsArray()
  @IsOptional()
  @IsUUID('4', { each: true })
  delegateeOverrideIds?: string[];

  @ApiPropertyOptional({ type: () => [String] })
  @IsArray()
  @IsOptional()
  @IsUUID('4', { each: true })
  escalationPath?: string[];
}
