import { ApiProperty } from '@nestjs/swagger';

export class DsarStatusDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  progress: number;

  @ApiProperty()
  estimatedCompletion: Date;

  @ApiProperty({ required: false })
  dataPackageUrl?: string;

  @ApiProperty({ required: false })
  dataPackageSize?: number;

  @ApiProperty()
  message: string;
}
