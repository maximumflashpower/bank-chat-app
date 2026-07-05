import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IdentityUser } from '../entities/identity-user.entity';
import { UserRole } from '../entities/user-role.entity';
import { MfaFactor } from '../entities/mfa-factor.entity';
import { Role } from '../entities/role.entity';
import { UserStatus } from '../entities/user-status.enum';
import { RoleType } from '../entities/role.enum';

export interface JwtPayload {
  sub: string;
  phoneNumber: string;
  roles?: RoleType[];
  mfaVerified?: boolean;
  iat?: number;
  exp?: number;
}

export interface JwtUserData {
  id: string;
  phoneNumber: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  status: UserStatus;
  isVerified: boolean;
  roles: RoleType[];
  mfaVerified: boolean;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private config: ConfigService,
    @InjectRepository(IdentityUser)
    private userRepo: Repository<IdentityUser>,
    @InjectRepository(UserRole)
    private userRoleRepo: Repository<UserRole>,
    @InjectRepository(MfaFactor)
    private mfaRepo: Repository<MfaFactor>,
    @InjectRepository(Role)
    private roleRepo: Repository<Role>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET')!,
    });
  }

  async validate(payload: JwtPayload): Promise<JwtUserData> {
    const user = await this.userRepo.findOneBy({ id: payload.sub });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // ── Fetch active role assignments with role name inline ──
    const userRoles = await this.userRoleRepo
      .createQueryBuilder('ur')
      .leftJoin('ur.role', 'r')
      .where('ur.userId = :userId AND ur.isActive = :isActive', {
        userId: payload.sub,
        isActive: true,
      })
      .addSelect(['r.name'])
      .getMany();

    const activeRoles: RoleType[] = userRoles.map((ur) => ur.role.name as RoleType);

    // ── Check MFA factors ──
    const mfaFactors = await this.mfaRepo.find({
      where: { userId: payload.sub },
    });

    const verifiedMfaActive = mfaFactors.some(
      (mf) => mf.isActive && (mf.type === 'TOTP' || mf.type === 'PASSKEY'),
    );

    return {
      id: user.id,
      phoneNumber: user.phoneNumber,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      status: user.status,
      isVerified: user.isVerified,
      roles: activeRoles,
      mfaVerified: payload.mfaVerified ?? verifiedMfaActive,
    };
  }
}
