import { IsOptional, IsString, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SearchCatalogDto {
  @ApiProperty({ description: 'Término de búsqueda', required: false })
  @IsOptional()
  @IsString()
  query?: string;

  @ApiProperty({ description: 'Tags para filtrar', required: false, example: '["financial","pii"]' })
  @IsOptional()
  @IsArray()
  tags?: string[];

  @ApiProperty({ description: 'Clasificación de datos', required: false })
  @IsOptional()
  @IsString()
  classification?: string;
}
