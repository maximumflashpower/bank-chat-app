import { Body, Controller, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../identity/guards/jwt-auth.guard';
import { ConsentService } from '../services/consent.service';
import { GrantConsentDto } from '../dto/grant-consent.dto';
import { UpdatePreferencesDto } from '../dto/update-preferences.dto';

@ApiTags('Privacy — Consent')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/privacy')
export class ConsentController {
  constructor(private readonly consentService: ConsentService) {}

  @Get('consents')
  @ApiOperation({ summary: 'Listar consentimientos del usuario (PRIV-CONSENT-001)' })
  async listConsents(@Req() req: Request) {
    const userId = (req.user as any)?.id;
    return this.consentService.listUserConsents(userId);
  }

  @Post('consents/grant')
  @ApiOperation({ summary: 'Otorgar consentimiento granular (PRIV-CONSENT-002/003)' })
  async grantConsent(@Req() req: Request, @Body() dto: GrantConsentDto) {
    const userId = (req.user as any)?.id;
    const ip = req.headers['x-forwarded-for']?.toString() || req.socket?.remoteAddress || undefined;
    const ua = req.headers['user-agent'] || undefined;
    return this.consentService.grantConsent(userId, dto, ip, ua);
  }

  @Put('consents/:id/revoke')
  @ApiOperation({ summary: 'Revocar consentimiento específico (PRIV-CONSENT-004/005)' })
  async revokeConsent(@Req() req: Request, @Param('id') consentId: string) {
    const userId = (req.user as any)?.id;
    return this.consentService.revokeConsent(consentId, userId);
  }

  @Get('preferences')
  @ApiOperation({ summary: 'Centro de preferencias de privacidad (PRIV-CONSENT-002)' })
  async getPreferences(@Req() req: Request) {
    const userId = (req.user as any)?.id;
    return this.consentService.getPreferences(userId);
  }

  @Put('preferences')
  @ApiOperation({ summary: 'Actualizar preferencias globales (PRIV-CONSENT-002)' })
  async updatePreferences(@Req() req: Request, @Body() dto: UpdatePreferencesDto) {
    const userId = (req.user as any)?.id;
    const ip = req.headers['x-forwarded-for']?.toString() || req.socket?.remoteAddress || undefined;
    const ua = req.headers['user-agent'] || undefined;
    return this.consentService.updatePreferences(userId, dto, ip, ua);
  }
}
