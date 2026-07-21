import { Controller, Post, Body, Get, Delete, Param, UseGuards } from '@nestjs/common';
import { DeviceSessionService } from '../services/device-session.service';
import { AuthGuard } from '@nestjs/passport';

interface EnrollDto {
  devicePlatform: string;
  deviceId: string;
  deviceModel?: string;
  osVersion?: string;
  appVersion?: string;
  biometricType?: string;
  pushToken?: string;
}

@Controller('api/v1/mobile')
@UseGuards(AuthGuard('jwt'))
export class MobileDeviceSessionController {
  constructor(private readonly deviceSessionService: DeviceSessionService) {}

  @Post('/biometric/enroll')
  async enrollBiometric(@Body() dto: EnrollDto) {
    const userId = 'user-from-jwt'; // Obtener del JWT en implementación real
    return this.deviceSessionService.enroll({
      userId,
      ...dto,
    });
  }

  @Delete('/biometric/revoke/:sessionId')
  async revokeBiometric(@Param('sessionId') sessionId: string) {
    const userId = 'user-from-jwt';
    return this.deviceSessionService.revoke(userId, sessionId);
  }

  @Post('/biometric/authenticate')
  async authenticateBiometric(@Body() body: { sessionId: string }) {
    const userId = 'user-from-jwt';
    return this.deviceSessionService.getSession(userId, body.sessionId);
  }

  @Get('/devices')
  async getActiveDevices() {
    const userId = 'user-from-jwt';
    return this.deviceSessionService.getActiveSessions(userId);
  }
}
