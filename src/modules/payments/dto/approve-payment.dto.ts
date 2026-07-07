import { IsString, IsOptional } from 'class-validator';

export class ApprovePaymentDto {
  @IsOptional()
  @IsString()
  approverComments?: string;

  @IsOptional()
  @IsString()
  authorizedBy?: string;
}
