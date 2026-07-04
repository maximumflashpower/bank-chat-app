import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../identity/guards/jwt-auth.guard';
import { AuditService } from '../services/audit.service';
import { QueryAuditDto } from '../dto/query-audit.dto';

@ApiTags('Audit')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @ApiOperation({ summary: 'Query audit logs with filters' })
  @ApiResponse({ status: 200, description: 'Filtered audit log entries' })
  async query(@Query() dto: QueryAuditDto) {
    return this.auditService.query(dto);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get audit trail for the current user' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async myTrail(@Request() req: any, @Query('limit') limit?: number) {
    return this.auditService.getByUserId(req.user.id, limit);
  }
}
