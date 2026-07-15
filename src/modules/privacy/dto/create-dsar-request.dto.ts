import {
  IsEnum, IsOptional, IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DsarRequestType, DsarChannel } from '../entities/privacy-dsar-request.entity';

export class CreateDsarRequestDto {
  @ApiProperty({ enum: DsarRequestType, example: DsarRequestType.ACCESS })
  @IsEnum(DsarRequestType)
  requestType: DsarRequestType;

  @ApiProperty({ enum: DsarChannel, example: DsarChannel.WEB })
  @IsEnum(DsarChannel)
  @IsOptional()
  receivedChannel?: DsarChannel;

  @ApiProperty({ example: 'Solicitud para revisar todos mis datos personales', required: false })
  @IsString()
  @IsOptional()
  additionalNotes?: string;
}
