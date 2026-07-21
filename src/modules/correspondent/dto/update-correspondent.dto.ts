import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEmail, IsNumber, IsBoolean, IsDateString } from 'class-validator';
import { PartialType } from '@nestjs/swagger';
import { CreateCorrespondentDto } from './create-correspondent.dto';

export class UpdateCorrespondentDto extends PartialType(CreateCorrespondentDto) {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  terminationDate?: Date;
}
