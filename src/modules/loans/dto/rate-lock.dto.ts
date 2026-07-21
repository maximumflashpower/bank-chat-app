import { IsNumber, IsDate, IsString } from 'class-validator';

export class RateLockDto {
  @IsNumber()
  lockedRate: number;

  @IsDate()
  lockExpirationDate: Date;

  @IsString()
  lockReason?: string;
}

export class RateUnlockDto {
  @IsString()
  unlockReason: string;
}

export class RateLockExtensionDto {
  @IsDate()
  newExpirationDate: Date;

  @IsNumber()
  extensionFee?: number;
}
