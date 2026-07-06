import { IsUUID, IsArray, IsBoolean, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ReviewItemDto {
  @ApiProperty({ type: () => String })
  @IsUUID()
  userId: string;

  @ApiProperty({ type: () => Boolean })
  @IsBoolean()
  keepAccess: boolean;

  @ApiProperty({ type: () => String, required: false })
  @IsUUID()
  @IsOptional()
  newRoleId?: string;
}

export class AccessReviewSubmitDto {
  @ApiProperty({ type: () => String })
  @IsUUID()
  reviewId: string;

  @ApiProperty({ type: () => [ReviewItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReviewItemDto)
  items: ReviewItemDto[];
}
