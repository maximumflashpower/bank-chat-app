import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../identity/guards/jwt-auth.guard';
import { RolesGuard } from '../../identity/guards/roles.guard';
import { Roles } from '../../identity/decorators/roles.decorator';
import { RoleType } from '../../identity/entities/role.enum';
import { BankConnectionService } from '../services/bank-connection.service';
import { TestConnectionDto } from '../dto/test-connection.dto';

@Controller('v1/payments/banking')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BankingController {
  constructor(
    private bankConnectionService: BankConnectionService,
  ) {}

  @Get('connections')
  @Roles(RoleType.ADMIN)
  async getConnections(): Promise<any[]> {
    return this.bankConnectionService.findAll();
  }

  @Post('connection-test')
  @Roles(RoleType.ADMIN)
  async testConnection(@Body() dto: TestConnectionDto): Promise<any> {
    return this.bankConnectionService.testConnection(dto);
  }
}
