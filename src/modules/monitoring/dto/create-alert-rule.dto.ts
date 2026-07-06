import { IsEnum, IsNumber, IsOptional, IsString, IsArray, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MetricType } from '../entities/metric-type.enum';
import { AlertSeverity } from '../entities/alert-severity.enum';

export class CreateAlertRuleDto {
  @ApiProperty({ description: 'Nombre de la regla' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Servicio objetivo' })
  @IsString()
  serviceName: string;

  @ApiProperty({ enum: MetricType })
  @IsEnum(MetricType)
  metricType: MetricType;

  @ApiProperty({ description: 'Operador (>, <, >=, <=, ==)' })
  @IsString()
  operator: string;

  @ApiProperty({ description: 'Umbral de disparo' })
  @IsNumber()
  threshold: number;

  @ApiProperty({ enum: AlertSeverity, required: false })
  @IsOptional()
  @IsEnum(AlertSeverity)
  severity?: AlertSeverity;

  @ApiProperty({ description: 'Canales de notificación', required: false })
  @IsOptional()
  @IsArray()
  notificationChannels?: string[];

  @ApiProperty({ description: 'Mensaje de la alerta', required: false })
  @IsOptional()
  @IsString()
  messageTemplate?: string;

  @ApiProperty({ description: 'Ventana en segundos', required: false, default: 300 })
  @IsOptional()
  @IsInt()
  windowSeconds?: number;
}
