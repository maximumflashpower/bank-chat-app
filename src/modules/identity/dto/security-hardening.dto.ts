import { IsNumber, IsBoolean, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BruteForceConfigDto {
  @ApiProperty({ example: 5, minimum: 1, maximum: 20 })
  @IsNumber()
  @Min(1)
  @Max(20)
  maxAttempts: number;

  @ApiProperty({ example: 900, description: 'Lockout duration in seconds' })
  @IsNumber()
  @Min(60)
  lockoutDurationSeconds: number;

  @ApiProperty({ example: 300 })
  @IsNumber()
  @Min(60)
  resetWindowSeconds: number;
}

export class SessionLimitDto {
  @ApiProperty({ example: 3, minimum: 1, maximum: 10 })
  @IsNumber()
  @Min(1)
  @Max(10)
  maxConcurrentSessions: number;

  @ApiProperty({ example: 3600 })
  @IsNumber()
  @Min(300)
  sessionTimeoutSeconds: number;
}
