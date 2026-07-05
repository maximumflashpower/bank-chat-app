import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RevokeConsentDto {
  @ApiProperty({
    description: 'Razón de la revocación (opcional, para audit log)',
    required: false,
    example: 'Usuario no desea recibir marketing',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
