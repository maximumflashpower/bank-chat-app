import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRE_MFA_KEY } from '../decorators/require-mfa.decorator';

@Injectable()
export class MfaGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requireMfa = this.reflector.getAllAndOverride<boolean>(
      REQUIRE_MFA_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requireMfa) {
      return true; // Not enforced on this route
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.mfaVerified) {
      throw new UnauthorizedException(
        'Multi-factor authentication required. Complete the challenge first.',
      );
    }

    return true;
  }
}
