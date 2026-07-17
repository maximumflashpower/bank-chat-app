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
import { CashflowClassificationService } from '../services/cashflow-classification.service';
import { CashflowProjectionDto } from '../dto/cashflow-projection.dto';

@Controller('v1/accounting/cashflow')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CashflowController {
  constructor(
    private cashflowService: CashflowClassificationService,
  ) {}

  @Get('classify')
  @Roles(RoleType.MANAGER)
  async classify(@Body() body: { transactionId: string; description: string; amount: number }): Promise<any> {
    return this.cashflowService.classify(body.transactionId, body.description, body.amount);
  }

  @Post('projection')
  @Roles(RoleType.MANAGER)
  async projection(@Body() dto: CashflowProjectionDto): Promise<any> {
    return this.cashflowService.project(dto);
  }
}
