import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsArray, ArrayMinSize, MaxLength } from 'class-validator';
import { ConversationType } from '../entities/conversation-type.enum';

export class CreateConversationDto {
  @ApiProperty({ enum: ConversationType })
  @IsEnum(ConversationType)
  type: ConversationType;

  @ApiProperty({ example: 'Grupo familiar', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  title?: string;

  @ApiProperty({ type: [String], description: 'Participant user UUIDs (not including creator)' })
  @IsArray()
  @ArrayMinSize(1)
  participantIds: string[];
}
