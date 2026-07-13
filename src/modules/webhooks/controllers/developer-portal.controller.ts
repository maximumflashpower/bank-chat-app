import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DeveloperPortalService } from '../services/developer-portal.service';

@ApiTags('Developer Portal')
@Controller('api/v1/dev-portal')
export class DeveloperPortalController {
  constructor(private readonly devPortalService: DeveloperPortalService) {}

  @Post('oauth2/token')
  @ApiOperation({ summary: 'OAuth2 Client Credentials PKCE Flow' })
  async oauth2Token(@Body() body: { clientId: string; clientSecret: string; scopes: string[] }) {
    return this.devPortalService.oauth2TokenExchange(body.clientId, body.clientSecret, body.scopes);
  }

  @Get('openapi')
  @ApiOperation({ summary: 'Get OpenAPI 3.1 specification' })
  async getOpenApi() {
    return this.devPortalService.getOpenApiSpec();
  }

  @Post('graphql')
  @ApiOperation({ summary: 'GraphQL endpoint' })
  async graphql(@Body() body: { query: string; variables?: Record<string, unknown> }) {
    return this.devPortalService.graphqlQuery(body.query, body.variables);
  }

  @Get('version/:version')
  @ApiOperation({ summary: 'Get API version info' })
  async getVersion(@Param('version') version: string) {
    return this.devPortalService.getVersionInfo(version);
  }

  @Post('sandbox/mock')
  @ApiOperation({ summary: 'Sandbox mock environment' })
  async sandbox(@Body() body: { endpoint: string; method: string; requestBody?: Record<string, unknown> }) {
    return this.devPortalService.sandboxMock(body.endpoint, body.method, body.requestBody);
  }

  @Get('logs')
  @ApiOperation({ summary: 'Request/response log inspector' })
  async logInspector(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('statusCode') statusCode?: number,
    @Query('endpoint') endpoint?: string,
  ) {
    return this.devPortalService.logInspector({
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      statusCode: statusCode ? Number(statusCode) : undefined,
      endpoint,
    });
  }

  @Get('sdk/:language')
  @ApiOperation({ summary: 'Get SDK code samples' })
  async getSdk(@Param('language') language: string) {
    return this.devPortalService.getSdkSamples(language);
  }
}
