import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsDate,
  IsArray,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  ReportType,
  ReportingPeriodType,
  RegulatoryAuthority,
  FilingFormat,
  SubmissionMethod,
} from '../entities/call-report-status.enum';

export class DataSourceItemDto {
  @ApiProperty({ description: 'Fuente de datos' })
  @IsString()
  sourceName: string;

  @ApiProperty({ description: 'Tipo de dato' })
  @IsString()
  dataType: string;

  @ApiProperty({ description: 'Ubicación o referencia', required: false })
  @IsOptional()
  @IsString()
  location?: string;
}

export class GenerateReportDto {
  @ApiProperty({ description: 'Tipo de reporte regulatorio', enum: ReportType })
  @IsEnum(ReportType)
  reportType: ReportType;

  @ApiProperty({ description: 'Tipo de periodo', enum: ReportingPeriodType })
  @IsEnum(ReportingPeriodType)
  reportingPeriodType: ReportingPeriodType;

  @ApiProperty({ description: 'Fecha inicio periodo' })
  @IsDate()
  @Type(() => Date)
  reportingPeriodStart: Date;

  @ApiProperty({ description: 'Fecha fin periodo' })
  @IsDate()
  @Type(() => Date)
  reportingPeriodEnd: Date;

  @ApiProperty({ description: 'Autoridad regulatoria', enum: RegulatoryAuthority })
  @IsEnum(RegulatoryAuthority)
  regulatoryAuthority: RegulatoryAuthority;

  @ApiProperty({ description: 'Formato de filing', enum: FilingFormat })
  @IsEnum(FilingFormat)
  filingFormat: FilingFormat;

  @ApiProperty({ description: 'Fuentes de datos', type: [DataSourceItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DataSourceItemDto)
  dataSources: DataSourceItemDto[];

  @ApiProperty({ description: 'Deadline de filing' })
  @IsDate()
  @Type(() => Date)
  filingDeadline: Date;

  @ApiProperty({ description: 'Referencia original si es enmienda', required: false })
  @IsOptional()
  @IsString()
  amendmentOriginalId?: string;
}
