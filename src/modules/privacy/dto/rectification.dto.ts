import { IsObject, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RectificationDto {
  @ApiProperty({ description: 'ID del usuario solicitante' })
  @IsString()
  userId: string;

  @ApiProperty({
    description: 'Campos a corregir (clave: valor)',
    example: '{"firstName":"Carlos","lastName":"Ramirez"}',
  })
  @IsObject()
  corrections: Record<string, string>;
}
