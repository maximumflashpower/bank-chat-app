import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { IdentityService } from '../services/identity.service';
import { DidService } from '../services/did.service';
import { RegisterDto } from '../dto/register.dto';
import { VerifyOtpDto } from '../dto/verify-otp.dto';
import { LoginDto } from '../dto/login.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { DidRegisterDto } from '../dto/did-register.dto';
import { IdentityDid } from '../entities/identity-did.entity';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class IdentityController {
  constructor(
    private readonly identityService: IdentityService,
    private readonly didService: DidService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user by phone number' })
  @ApiResponse({ status: 201, description: 'OTP sent to phone number' })
  @ApiResponse({ status: 409, description: 'Phone number already registered' })
  async register(@Body() dto: RegisterDto) {
    return this.identityService.register(dto);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP and activate account' })
  @ApiResponse({ status: 200, description: 'Account activated, tokens issued' })
  @ApiResponse({ status: 400, description: 'Invalid or expired OTP' })
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.identityService.verifyOtp(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with phone + password' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() dto: LoginDto) {
    return this.identityService.login(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({ status: 200, description: 'New access token' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.identityService.refreshToken(dto.refreshToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user' })
  @ApiResponse({ status: 200, description: 'User profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async me(@Request() req: any) {
    return this.identityService.getMe(req.user.id);
  }

  /**
   * AUTH-MOD-005: Register new DID (Self-Sovereign Identity)
   */
  @Post('did/register')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Registrar DID Self-Sovereign Identity' })
  @ApiResponse({ status: 201, description: 'DID registrado correctamente' })
  async registerDid(
    @Request() req: any,
    @Body() dto: DidRegisterDto,
  ): Promise<IdentityDid> {
    return this.didService.registerDid(req.user.id, dto);
  }

  /**
   * Listar DIDs del usuario actual
   */
  @Get('did')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar DIDs del usuario' })
  async listMyDids(@Request() req: any): Promise<IdentityDid[]> {
    return this.didService.findByUserId(req.user.id);
  }

  /**
   * Resolver DID Document público
   */
  @Get('did/resolve/:didDocumentId')
  @ApiOperation({ summary: 'Resolver DID Document (público)' })
  @ApiResponse({ status: 200, description: 'DID Document resuelto' })
  async resolveDid(
    @Param('didDocumentId') didDocumentId: string,
  ): Promise<Record<string, unknown> | null> {
    return this.didService.resolveDidDocument(didDocumentId);
  }
}
