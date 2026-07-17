import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../identity/guards/jwt-auth.guard';
import { RolesGuard } from '../../identity/guards/roles.guard';
import { Roles } from '../../identity/decorators/roles.decorator';
import { RoleType } from '../../identity/entities/role.enum';
import { PaymentInstructionService } from '../services/payment-instruction.service';
import { PaymentReconciliationService } from '../services/payment-reconciliation.service';
import { CreatePaymentInstructionDto } from '../dto/create-payment-instruction.dto';
import { ApprovePaymentDto } from '../dto/approve-payment.dto';
import { ExecutePaymentDto } from '../dto/execute-payment.dto';
import { ReconcileAutoDto } from '../dto/reconcile-auto.dto';

@Controller('v1/payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentsController {
  constructor(
    private paymentService: PaymentInstructionService,
    private reconcileService: PaymentReconciliationService,
  ) {}

  @Post('instruction/create')
  @Roles(RoleType.MANAGER)
  async createInstruction(@Body() dto: CreatePaymentInstructionDto): Promise<any> {
    return this.paymentService.create(dto);
  }

  @Get('instructions')
  @Roles(RoleType.MANAGER)
  async listInstructions(): Promise<any[]> {
    return this.paymentService.findAll();
  }

  @Get('instruction/:id')
  @Roles(RoleType.MANAGER)
  async getInstruction(@Param('id') id: string): Promise<any> {
    return this.paymentService.findById(id);
  }

  @Post('instruction/:id/approve')
  @Roles(RoleType.MANAGER)
  async approveInstruction(@Param('id') id: string, @Body() dto: ApprovePaymentDto): Promise<void> {
    await this.paymentService.approve(id, dto);
  }

  @Post('instruction/:id/reject')
  @Roles(RoleType.MANAGER)
  async rejectInstruction(@Param('id') id: string, @Body() body: { reason: string }): Promise<void> {
    await this.paymentService.reject(id, body.reason);
  }

  @Post('instruction/:id/cancel')
  @Roles(RoleType.MANAGER)
  async cancelInstruction(@Param('id') id: string): Promise<void> {
    await this.paymentService.cancel(id);
  }

  @Post('instruction/:id/execute')
  @Roles(RoleType.MANAGER)
  async executeInstruction(@Param('id') id: string, @Body() dto: ExecutePaymentDto): Promise<void> {
    await this.paymentService.execute(id, dto);
  }

  @Get('status/:paymentId')
  async getStatus(@Param('paymentId') paymentId: string): Promise<any> {
    return this.paymentService.findById(paymentId);
  }

  @Post('settlement/process-batch')
  @Roles(RoleType.MANAGER)
  async processBatch(@Body() body: { batchDate?: string }): Promise<{ processed: number }> {
    const instructions = await this.paymentService.findAll({ status: 'approved' });
    for (const instr of instructions) {
      await this.paymentService.execute(instr.id, {});
    }
    return { processed: instructions.length };
  }
}
