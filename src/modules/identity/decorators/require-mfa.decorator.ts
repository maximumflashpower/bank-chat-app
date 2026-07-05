import { SetMetadata } from '@nestjs/common';

export const REQUIRE_MFA_KEY = 'require_mfa';

/**
 * Decorator to enforce that the authenticated user has completed
 * a verified MFA challenge (mfa_verified = true in JWT payload).
 * Usage: @RequireMfa()
 * Enforced by MfaGuard.
 */
export const RequireMfa = () => SetMetadata(REQUIRE_MFA_KEY, true);
