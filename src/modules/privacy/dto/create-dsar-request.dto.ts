import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DsarRequestType } from '../entities/dsar-request-type.enum';
import { DsarReceivedChannel } from '../entities/dsar-received-channel.enum';

export class CreateDsarRequestDto {
  @ApiProperty({
    description: 'Tipo de solicitud DSAR',
    enum: DsarRequestType,
    example: 'access',
  })
  @IsEnum(DsarRequestType)
  requestType: DsarRequestType;

  @ApiProperty({
    description: 'Canal de recepción de la solicitud',
    enum: DsarReceivedChannel,
    required: false,
    example: 'web',
  })
  @IsOptional()
  @IsEnum(DsarReceivedChannel)
  receivedChannel?: DsarReceivedChannel;

  @ApiProperty({
    description: 'Notas adicionales del solicitante',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
