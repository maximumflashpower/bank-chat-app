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
import { TaxDeclarationService } from '../services/tax-declaration.service';
import { GenerateDeclarationDto } from '../dto/generate-declaration.dto';
import { FileDeclarationDto } from '../dto/file-declaration.dto';

@Controller('api/v1/tax/declarations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DeclarationController {
  constructor(
    private declarationService: TaxDeclarationService,
  ) {}

  @Get()
  async getAll(): Promise<any[]> {
    return this.declarationService.findAll();
  }

  @Get(':id')
  async getById(@Param('id') id: string): Promise<any> {
    return this.declarationService.findById(id);
  }

  @Post(':id/generate')
  @Roles(RoleType.MANAGER)
  async generate(@Param('id') declarationId: string, @Body() dto: GenerateDeclarationDto): Promise<any> {
    return this.declarationService.generate(dto);
  }

  @Post(':id/file')
  @Roles(RoleType.MANAGER)
  async file(
    @Param('id') id: string,
    @Body() dto: FileDeclarationDto,
  ): Promise<void> {
    await this.declarationService.file(id, dto.submittedBy ?? '', dto.filingReference ?? '');
  }
}
