import { IsString } from 'class-validator';

export class ApproveGiftDto {
  @IsString()
  approvalStatus: string;
}
