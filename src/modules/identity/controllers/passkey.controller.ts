import {
  Controller,
  Post,
  Get,
  Delete,
  Patch,
  Body,
  Param,
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
import { PasskeyService } from '../services/passkey.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PasskeyRegisterStartDto, PasskeyRegisterFinishDto, PasskeyAuthVerifyDto, PasskeyRenameDto } from '../dto/passkey-register.dto';

@ApiTags('Passkey')
@ApiBearerAuth()
@Controller('auth/passkey')
export class PasskeyController {
  constructor(private readonly passkeyService: PasskeyService) {}

  @Post('register/start')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Start passkey registration — generates WebAuthn challenge' })
  @ApiResponse({ status: 200, description: 'Challenge generated' })
  async startRegistration(@Request() req: any, @Body() dto: PasskeyRegisterStartDto) {
    return this.passkeyService.generateRegistrationChallenge(req.user.id);
  }

  @Post('register/finish')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Finish passkey registration — verify attestation' })
  @ApiResponse({ status: 201, description: 'Passkey registered' })
  async finishRegistration(@Request() req: any, @Body() dto: PasskeyRegisterFinishDto) {
    // NOTE: Full @simplewebauthn/server verification goes here
    // For now we accept the attestation response and store the credential
    const { attestationResponse } = dto;
    
    const credentialId = Buffer.from(attestationResponse.id || '', 'base64url');
    const publicKey = Buffer.from(attestationResponse.publicKey || '', 'base64url');
    const transports = attestationResponse.transports || [];
    const deviceType = attestationResponse.deviceType || 'unknown';

    const passkeyId = await this.passkeyService.verifyRegistration(
      req.user.id,
      credentialId,
      publicKey,
      transports,
      deviceType,
    );

    return { passkeyId, message: 'Passkey registered successfully' };
  }

  @Post('auth/challenge')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate WebAuthn login challenge' })
  @ApiResponse({ status: 200, description: 'Challenge generated' })
  async startAuth() {
    return this.passkeyService.generateLoginChallenge();
  }

  @Post('auth/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify WebAuthn assertion for login' })
  @ApiResponse({ status: 200, description: 'Authentication result' })
  @ApiResponse({ status: 401, description: 'Authentication failed' })
  async verifyAuth(@Body() dto: PasskeyAuthVerifyDto) {
    const { assertionResponse } = dto;

    const userId = assertionResponse.userId || '';
    const credentialId = Buffer.from(assertionResponse.id || '', 'base64url');
    const signature = Buffer.from(assertionResponse.signature || '', 'base64url');
    const clientDataJSON = assertionResponse.clientDataJSON || '';
    const authData = Buffer.from(assertionResponse.authData || '', 'base64url');
    const userHandle = assertionResponse.userHandle 
      ? Buffer.from(assertionResponse.userHandle, 'base64url') 
      : undefined;

    const isValid = await this.passkeyService.authenticateWithPasskey(
      userId,
      credentialId,
      signature,
      clientDataJSON,
      authData,
      userHandle,
    );

    return { authenticated: isValid };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List user passkeys' })
  @ApiResponse({ status: 200, description: 'List of passkeys' })
  async listPasskeys(@Request() req: any) {
    return this.passkeyService.listPasskeys(req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke a passkey' })
  @ApiResponse({ status: 200, description: 'Passkey revoked' })
  @ApiResponse({ status: 400, description: 'Passkey not found' })
  async revokePasskey(@Request() req: any, @Param('id') passkeyId: string) {
    await this.passkeyService.revokePasskey(passkeyId, req.user.id);
    return { message: 'Passkey revoked' };
  }

  @Patch(':id/rename')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rename a passkey' })
  @ApiResponse({ status: 200, description: 'Passkey renamed' })
  async renamePasskey(
    @Request() req: any,
    @Param('id') passkeyId: string,
    @Body() dto: PasskeyRenameDto,
  ) {
    return this.passkeyService.renamePasskey(passkeyId, req.user.id, dto.nickname);
  }
}
