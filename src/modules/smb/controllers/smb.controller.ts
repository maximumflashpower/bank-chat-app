import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../identity/guards/jwt-auth.guard';
import { RolesGuard } from '../../identity/guards/roles.guard';
import { Roles } from '../../identity/decorators/roles.decorator';
import { RoleType } from '../../identity/entities/role.enum';
import { SmbSetupService } from '../services/smb-setup.service';
import { SmbInvoiceService } from '../services/smb-invoice.service';
import { SmbPaymentService } from '../services/smb-payment.service';
import { SmbReceivableService } from '../services/smb-receivable.service';
import { CompanyProfileDto } from '../dto/company-profile.dto';
import { ImportContactsDto } from '../dto/import-contacts.dto';
import { CreateInvoiceDto } from '../dto/create-invoice.dto';
import { PaymentRecordDto } from '../dto/payment-record.dto';
import { ReminderCampaignDto } from '../dto/reminder-campaign.dto';

@Controller('v1/smb')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SmbController {
  constructor(
    private setupService: SmbSetupService,
    private invoiceService: SmbInvoiceService,
    private paymentService: SmbPaymentService,
    private receivableService: SmbReceivableService,
  ) {}

  @Post('setup/start-wizard')
  @Roles(RoleType.CUSTOMER)
  async startWizard(@Body() body: { userId: string }): Promise<any> {
    return this.setupService.startWizard(body.userId);
  }

  @Get('setup/profile')
  @Roles(RoleType.CUSTOMER, RoleType.MANAGER)
  async getProfile(@Query('userId') userId: string): Promise<any> {
    return this.setupService.getProfile(userId);
  }

  @Put('setup/profile')
  @Roles(RoleType.ADMIN)
  async updateProfile(@Query('userId') userId: string, @Body() dto: CompanyProfileDto): Promise<any> {
    return this.setupService.updateProfile(userId, dto);
  }

  @Post('setup/import-contacts')
  @Roles(RoleType.MANAGER)
  async importContacts(@Query('userId') userId: string, @Body() dto: ImportContactsDto): Promise<any> {
    return this.setupService.importContacts(userId, dto);
  }

  @Post('setup/bank-connect')
  @Roles(RoleType.ADMIN)
  async bankConnect(@Body() body: { userId: string; institution: string; accountType: string }): Promise<any> {
    return this.setupService.configureTax(body.userId, 0.16, 'FEDERAL');
  }

  @Get('invoices')
  @Roles(RoleType.CUSTOMER, RoleType.MANAGER, RoleType.AUDITOR)
  async listInvoices(@Query('status') status?: string, @Query('customerId') customerId?: string): Promise<any[]> {
    return this.invoiceService.findAll({ status, customerId });
  }

  @Post('invoices/create')
  @Roles(RoleType.MANAGER)
  async createInvoice(@Body() dto: CreateInvoiceDto): Promise<any> {
    return this.invoiceService.create(dto);
  }

  @Put('invoices/:id/send')
  @Roles(RoleType.MANAGER)
  async sendInvoice(@Param('id') id: string): Promise<void> {
    await this.invoiceService.send(id);
  }

  @Get('invoices/:id/payments')
  @Roles(RoleType.CUSTOMER, RoleType.MANAGER)
  async getInvoicePayments(@Param('id') id: string): Promise<any> {
    return this.paymentService.getInvoicePayments(id);
  }

  @Post('invoices/:id/pay-online')
  async payOnline(@Param('id') id: string, @Body() body: { amount: number; method: string }): Promise<any> {
    return this.paymentService.processOnlinePayment(id, body.amount, body.method);
  }

  @Post('reminders/campaign-create')
  @Roles(RoleType.MANAGER)
  async createReminderCampaign(@Body() dto: ReminderCampaignDto): Promise<any> {
    return this.paymentService.createReminderCampaign(dto);
  }

  @Post('accounts-receivable/mark-as-paid')
  @Roles(RoleType.MANAGER)
  async markAsPaid(@Body() dto: PaymentRecordDto): Promise<void> {
    await this.paymentService.markAsPaid(dto);
  }

  @Get('receivables/aging')
  @Roles(RoleType.MANAGER, RoleType.AUDITOR)
  async getAging(): Promise<any> {
    return this.receivableService.getAgingReport();
  }

  @Get('receivables/days-sales-outstanding')
  @Roles(RoleType.MANAGER, RoleType.AUDITOR)
  async getDSO(): Promise<any> {
    return this.receivableService.getDSO();
  }

  @Get('user-sharing')
  @Roles(RoleType.ADMIN)
  async getUserSharing(): Promise<any> {
    return { message: 'User sharing endpoint' };
  }
}
