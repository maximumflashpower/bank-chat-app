// src/modules/loans/dto/accept-offer.dto.ts

import { IsBoolean, IsOptional } from 'class-validator';

export class AcceptOfferDto {
  @IsOptional()
  @IsBoolean()
  acceptCounteroffer?: boolean;
}
