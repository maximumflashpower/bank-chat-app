import { IsString, IsObject, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DidRegisterDto {
  @ApiProperty({ example: 'did:web:blockchain.xyz:alice' })
  @IsString()
  didDocumentId: string;

  @ApiProperty({ type: Object })
  @IsObject()
  publicKeyJwk: Record<string, unknown>;

  @ApiProperty({ example: 'ed25519' })
  @IsString()
  keyType: string;

  @ApiProperty({ type: Object, required: false })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}
