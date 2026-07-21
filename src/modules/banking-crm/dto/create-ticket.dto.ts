import { IsString, IsNotEmpty, IsEnum, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum TicketCategory {
  ACCOUNT_ISSUE = 'account_issue',
  CARD_PROBLEM = 'card_problem',
  LOAN_QUERY = 'loan_query',
  FRAUD_REPORT = 'fraud_report',
  FEE_DISPUTE = 'fee_dispute',
  STATEMENT_REQUEST = 'statement_request',
  TECH_SUPPORT = 'tech_support',
  COMPLAINT = 'complaint',
}

export enum TicketPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum TicketSource {
  SELF_SERVICE_APP = 'self_service_app',
  WEB = 'web',
  CHATBOT = 'chatbot',
  PHONE = 'phone',
  BRANCH = 'branch',
}

export class CreateTicketDto {
  @ApiProperty({ description: 'Asunto corto del ticket' })
  @IsNotEmpty()
  @IsString()
  subjectTitle: string;

  @ApiProperty({ description: 'Descripción detallada del problema' })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({ description: 'Categoría del ticket', enum: TicketCategory })
  @IsNotEmpty()
  @IsEnum(TicketCategory)
  category: TicketCategory;

  @ApiPropertyOptional({ description: 'Prioridad del ticket', enum: TicketPriority, default: TicketPriority.NORMAL })
  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @ApiPropertyOptional({ description: 'Canal fuente', enum: TicketSource, default: TicketSource.SELF_SERVICE_APP })
  @IsOptional()
  @IsEnum(TicketSource)
  sourceChannel?: TicketSource;

  @ApiPropertyOptional({ description: 'ID de cuenta relacionada', required: false })
  @IsOptional()
  @IsString()
  relatedAccountId?: string;

  @ApiPropertyOptional({ description: 'ID de tarjeta relacionada', required: false })
  @IsOptional()
  @IsString()
  relatedCardId?: string;

  @ApiPropertyOptional({ description: 'ID de préstamo relacionado', required: false })
  @IsOptional()
  @IsString()
  relatedLoanId?: string;
}
