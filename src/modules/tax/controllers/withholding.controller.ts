import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../identity/guards/jwt-auth.guard';
import { RolesGuard } from '../../identity/guards/roles.guard';
import { Roles } from '../../identity/decorators/roles.decorator';
import { RoleType } from '../../identity/entities/role.enum';
import { TaxWithholdingService } from '../services/tax-withholding.service';
import { CalculateWithholdingDto } from '../dto/calculate-withholding.dto';

@Controller('v1/tax/withholding')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WithholdingController {
  constructor(
    private withholdingService: TaxWithholdingService,
  ) {}

  @Get('invoices')
  @Roles(RoleType.MANAGER)
  async getPendingInvoices(): Promise<any[]> {
    return this.withholdingService.findPendingCertificates();
  }

  @Post('calculate')
  async calculate(@Body() dto: CalculateWithholdingDto): Promise<any> {
    return this.withholdingService.calculateAndIssue(dto);
  }

  @Post('certificate')
  @Roles(RoleType.MANAGER)
  async issueCertificate(@Body() dto: CalculateWithholdingDto): Promise<any> {
    return this.withholdingService.calculateAndIssue(dto);
  }

  @Get('withholdee/:id')
  async getByWithholdee(@Param('id') withholdeeId: string): Promise<any[]> {
    return this.withholdingService.findByWithholdee(withholdeeId);
  }
}
