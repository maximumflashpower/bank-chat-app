import {
  Controller, Post, Get, Body, UseGuards, Request, HttpCode, HttpStatus, Param,
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiResponse, ApiBearerAuth,
} from '@nestjs/swagger';
import { IdentityService } from '../services/identity.service';
import { RegisterDto } from '../dto/register.dto';
import { VerifyOtpDto } from '../dto/verify-otp.dto';
import { LoginDto } from '../dto/login.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { DidService } from '../services/did.service';
import { DidRegisterDto } from '../dto/did-register.dto';
import { IdentityDid } from '../entities/identity-did.entity';

@ApiTags('auth')
@Controller('auth')
export class IdentityController {
  constructor(
    private readonly identityService: IdentityService,
    private readonly didService: DidService,
  ) {}

  /**
   * AUTH-CORE-001: Phone Registration OTP
   */
  @Post('register')
  @ApiOperation({ summary: 'Registrar nuevo usuario vía teléfono' })
  async register(@Body() dto: RegisterDto): Promise<any> {
    return this.identityService.register(dto);
  }

  /**
   * AUTH-CORE-001: Verify OTP
   */
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verificar OTP de registro' })
  async verifyOtp(@Body() dto: VerifyOtpDto): Promise<any> {
    return this.identityService.verifyOtp(dto);
  }

  /**
   * AUTH-CORE-002: Login con JWT
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login con phone y password' })
  async login(@Body() dto: LoginDto): Promise<any> {
    return this.identityService.login(dto);
  }

  /**
   * AUTH-CORE-003: Refresh Token
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotar refresh token' })
  async refreshToken(@Body() dto: RefreshTokenDto): Promise<any> {
    return this.identityService.refreshToken(dto.refreshToken);
  }

  /**
   * AUTH-MOD-005: Register new DID (Self-Sovereign Identity)
   */
  @Post('did/register')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Registrar DID Self-Sovereign Identity' })
  @ApiBearerAuth()
  async registerDid(
    @Request() req: any,
    @Body() dto: DidRegisterDto,
  ): Promise<IdentityDid> {
    const userId = req.user?.id || req.user?.sub;
    if (!userId) throw new Error('Usuario no autenticado');
    return this.didService.registerDid(userId, dto);
  }

  /**
   * Listar DIDs del usuario actual
   */
  @Get('did')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Listar DIDs del usuario' })
  @ApiBearerAuth()
  async listMyDids(@Request() req: any): Promise<IdentityDid[]> {
    const userId = req.user?.id || req.user?.sub;
    if (!userId) throw new Error('Usuario no autenticado');
    return this.didService.findByUserId(userId);
  }

  /**
   * Resolver DID Document público
   */
  @Get('did/resolve/:didDocumentId')
  @ApiOperation({ summary: 'Resolver DID Document (público)' })
  async resolveDid(
    @Param('didDocumentId') didDocumentId: string,
  ): Promise<Record<string, unknown> | null> {
    return this.didService.resolveDidDocument(didDocumentId);
  }
}
