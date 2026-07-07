import { IsArray, IsOptional } from 'class-validator';

export class ImportContactsDto {
  @IsArray()
  contacts: any[];

  @IsOptional()
  @IsArray()
  overwriteExisting?: boolean[];
}
