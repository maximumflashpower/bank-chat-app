import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ApiKeyService } from '../services/api-key.service';
import { ApiKeyTier } from '../entities/api-key.entity';

@ApiTags('API Keys')
@Controller('api/v1/api-keys')
export class ApiKeyController {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  @Post('generate')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate API key' })
  @ApiResponse({ status: 201, description: 'API key generated' })
  async generate(
    @Body() data: { tenantId: string; name: string; scopes?: string[]; tier?: ApiKeyTier },
  ) {
    return this.apiKeyService.generateApiKey(
      data.tenantId,
      data.name,
      data.scopes || [],
      data.tier || ApiKeyTier.FREE,
    );
  }

  @Get('list')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List API keys' })
  @ApiResponse({ status: 200, description: 'API key list' })
  async list(@Query('tenantId') tenantId: string) {
    return this.apiKeyService.listApiKeys(tenantId);
  }

  @Delete(':id/revoke')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke API key' })
  @ApiResponse({ status: 200, description: 'API key revoked' })
  async revoke(
    @Param('id') id: string,
    @Query('tenantId') tenantId: string,
  ) {
    await this.apiKeyService.revokeApiKey(id, tenantId);
    return { revoked: true };
  }
}
