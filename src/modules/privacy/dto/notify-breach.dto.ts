import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class NotifyBreachDto {
  @ApiProperty({ description: 'Notas enviadas a la autoridad supervisora', required: false })
  @IsOptional()
  @IsString()
  authorityNotificationNotes?: string;

  @ApiProperty({ description: 'Plantilla de mensaje para usuarios afectados', required: false })
  @IsOptional()
  @IsString()
  userNotificationTemplate?: string;
}
