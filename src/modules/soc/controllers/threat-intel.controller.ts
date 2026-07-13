import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ThreatIntelService } from '../services/threat-intel.service';
import { SyncFeedsDto } from '../dto/sync-feeds.dto';
import { IoCType, IoCTag } from '../entities/ioc-cache.entity';

@ApiTags('Threat Intelligence')
@Controller('api/v1/threat/intel')
export class ThreatIntelController {
  constructor(private readonly intelService: ThreatIntelService) {}

  @Get('feed')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List active threat intel feeds' })
  @ApiResponse({ status: 200, description: 'Feed list' })
  async getFeeds() {
    return this.intelService.findAllFeeds();
  }

  @Post('feed/create')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new threat intel feed' })
  @ApiResponse({ status: 201, description: 'Feed created' })
  async createFeed(@Body() feedData: any) {
    return this.intelService.createFeed(feedData);
  }

  @Post('sync')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Sync threat intel feeds' })
  @ApiResponse({ status: 200, description: 'Sync results' })
  async syncFeeds(@Body() dto: SyncFeedsDto) {
    return this.intelService.syncFeeds(dto.feedIds, dto.forceFullSync);
  }

  @Get('iocs')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Search loaded IOCs' })
  @ApiResponse({ status: 200, description: 'IOC list' })
  async searchIoCs(
    @Query('q') query: string,
    @Query('type') type?: IoCType,
  ) {
    return this.intelService.searchIoCs(query, type);
  }

  @Get('blocklist')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get blocklist for enforcement' })
  @ApiResponse({ status: 200, description: 'Blocklist' })
  async getBlocklist(
    @Query('type') type?: IoCType,
    @Query('tag') tag?: string,
  ) {
    return this.intelService.getBlocklist({ type, tag });
  }

  @Post('submission')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit IOCs to consortium (anonymous)' })
  @ApiResponse({ status: 200, description: 'Submitted' })
  async submitToConsortium(@Body() data: { iocValues: string[] }) {
    return this.intelService.submitToConsortium(data.iocValues);
  }
}
