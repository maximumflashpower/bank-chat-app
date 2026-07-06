import { IsUUID, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RecoveryConfirmDto {
  @ApiProperty({ type: () => String })
  @IsUUID()
  ticketId: string;

  @ApiProperty({ example: 'confirmation-code-from-email' })
  @IsString()
  @MaxLength(100)
  confirmationCode: string;
}
