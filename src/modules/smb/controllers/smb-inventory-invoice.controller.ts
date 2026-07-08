import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../identity/guards/jwt-auth.guard';
import { RolesGuard } from '../../identity/guards/roles.guard';
import { Roles } from '../../identity/decorators/roles.decorator';
import { RoleType } from '../../identity/entities/role.enum';
import { SmbInventoryInvoiceService } from '../services/smb-inventory-invoice.service';
import { CreateInvoiceWithItemsDto } from '../dto/create-invoice-with-items.dto';

@Controller('api/v1/smb/inventory-invoices')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SmbInventoryInvoiceController {
  constructor(private readonly invoiceService: SmbInventoryInvoiceService) {}

  @Post()
  @Roles(RoleType.MANAGER)
  async createInvoiceWithItems(@Body() dto: CreateInvoiceWithItemsDto) {
    return this.invoiceService.createInvoiceWithItems(dto);
  }

  @Get(':id')
  @Roles(RoleType.CUSTOMER, RoleType.MANAGER, RoleType.AUDITOR)
  async getInvoiceWithItems(@Param('id', ParseUUIDPipe) id: string) {
    return this.invoiceService.findInvoiceWithItems(id);
  }

  @Get(':id/line-items')
  @Roles(RoleType.CUSTOMER, RoleType.MANAGER, RoleType.AUDITOR)
  async getLineItems(@Param('id', ParseUUIDPipe) id: string) {
    return this.invoiceService.findLineItemsByInvoice(id);
  }
}
