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
import { PaymentReconciliationService } from '../services/payment-reconciliation.service';
import { ReconcileAutoDto } from '../dto/reconcile-auto.dto';
import { ManualMatchDto } from '../dto/manual-match.dto';

@Controller('api/v1/payments/reconcile')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReconciliationController {
  constructor(
    private reconcileService: PaymentReconciliationService,
  ) {}

  @Post('auto-run')
  @Roles(RoleType.AUDITOR)
  async autoRun(@Body() dto: ReconcileAutoDto): Promise<{ matched: number; unmatched: number }> {
    return this.reconcileService.autoReconcile(dto);
  }

  @Get('unmatched')
  @Roles(RoleType.AUDITOR)
  async listUnmatched(): Promise<any[]> {
    return this.reconcileService.listUnmatched();
  }

  @Post('manual-match')
  @Roles(RoleType.AUDITOR)
  async manualMatch(@Body() dto: ManualMatchDto): Promise<void> {
    await this.reconcileService.manualMatch(dto);
  }
}
