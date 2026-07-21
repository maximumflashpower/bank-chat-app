import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID, IsOptional } from 'class-validator';

export class EnrollDto {
  @ApiProperty({ example: 'uuid-1234', description: 'ID del programa' })
  @IsUUID()
  @IsNotEmpty()
  programId: string;

  @ApiProperty({ example: 'uuid-5678', description: 'ID del cliente' })
  @IsUUID()
  @IsNotEmpty()
  customerId: string;

  @ApiProperty({ example: 'uuid-9abc', description: 'ID de la cuenta vinculada' })
  @IsUUID()
  @IsNotEmpty()
  accountId: string;

  @ApiProperty({ example: 'mobile_app', description: 'Origen de inscripción' })
  @IsOptional()
  @IsString()
  enrolledSource?: string;

  @ApiProperty({ example: 'REF-2026-ABC', description: 'Código de referido' })
  @IsOptional()
  @IsString()
  referralCode?: string;
}
