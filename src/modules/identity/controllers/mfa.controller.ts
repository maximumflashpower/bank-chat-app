import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { MfaService } from '../services/mfa.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { MfaSetupDto } from '../dto/mfa-setup.dto';
import { MfaVerifyDto } from '../dto/mfa-verify.dto';
import { VerifyBackupCodeDto, RegenerateBackupCodesDto } from '../dto/mfa-backup.dto';

@ApiTags('MFA')
@ApiBearerAuth()
@Controller('auth/mfa')
@UseGuards(JwtAuthGuard)
export class MfaController {
  constructor(private readonly mfaService: MfaService) {}

  @Post('setup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Start MFA setup — generates TOTP secret + QR code' })
  @ApiResponse({ status: 200, description: 'Secret and QR code generated' })
  async setupMfa(@Request() req: any, @Body() dto: MfaSetupDto) {
    if (dto.type === 'TOTP') {
      const { secret, qrCodeData } = await this.mfaService.generateTOTPSecret();
      const factorId = await this.mfaService.setupMfaFactor(req.user.id, dto.type, secret);
      return { factorId, qrCodeData, message: 'Scan QR code in your authenticator app' };
    }
    const factorId = await this.mfaService.setupMfaFactor(req.user.id, dto.type);
    return { factorId, message: 'MFA factor created' };
  }

  @Post('enable')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enable MFA factor after verifying first code' })
  @ApiResponse({ status: 200, description: 'MFA enabled' })
  @ApiResponse({ status: 400, description: 'Invalid code' })
  async enableMfa(@Body() dto: MfaVerifyDto) {
    const isValid = await this.mfaService.enableFactor(dto.factorId, dto.code);
    if (!isValid) {
      return { message: 'Invalid verification code', enabled: false };
    }
    return { message: 'MFA enabled successfully', enabled: true };
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify TOTP code during login challenge' })
  @ApiResponse({ status: 200, description: 'Verification result' })
  async verifyMfa(@Body() dto: MfaVerifyDto) {
    const isValid = await this.mfaService.verifyTOTPCode(dto.factorId, dto.code);
    return { verified: isValid };
  }

  @Post('disable')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Disable and remove an MFA factor' })
  @ApiResponse({ status: 200, description: 'MFA disabled' })
  async disableMfa(@Request() req: any, @Body() dto: MfaVerifyDto) {
    await this.mfaService.disableFactor(dto.factorId, req.user.id);
    return { message: 'MFA factor disabled' };
  }

  @Post('backup/generate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate backup codes for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Backup codes generated (shown once)' })
  async generateBackupCodes(@Request() req: any) {
    const codes = await this.mfaService.generateBackupCodes(req.user.id);
    return { codes, message: 'Store these codes safely — they will not be shown again' };
  }

  @Post('backup/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify a backup code as MFA fallback' })
  @ApiResponse({ status: 200, description: 'Backup code verification result' })
  async verifyBackupCode(@Request() req: any, @Body() dto: VerifyBackupCodeDto) {
    const isValid = await this.mfaService.verifyBackupCode(req.user.id, dto.code);
    return { verified: isValid };
  }

  @Post('backup/regenerate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Regenerate backup codes (invalidates old ones)' })
  @ApiResponse({ status: 200, description: 'New backup codes generated' })
  async regenerateBackupCodes(@Request() req: any, @Body() dto: RegenerateBackupCodesDto) {
    const codes = await this.mfaService.generateBackupCodes(req.user.id);
    return { codes, message: 'Old codes invalidated. Store these new codes safely.' };
  }

  @Get('factors')
  @ApiOperation({ summary: 'List user MFA factors' })
  @ApiResponse({ status: 200, description: 'List of MFA factors' })
  async listFactors(@Request() req: any) {
    return this.mfaService.listFactors(req.user.id);
  }
}
