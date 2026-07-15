import { ApiProperty } from '@nestjs/swagger';

export class DataPortabilityDto {
  @ApiProperty()
  format: string;

  @ApiProperty()
  version: string;

  @ApiProperty()
  generatedAt: Date;

  @ApiProperty()
  totalRecords: number;

  @ApiProperty({ type: [String] })
  dataSources: string[];

  @ApiProperty()
  downloadUrl: string;
}
