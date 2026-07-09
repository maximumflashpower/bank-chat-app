import { MfaGuard } from './mfa.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';

describe('MfaGuard', () => {
  let guard: MfaGuard;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(() => {
    reflector = new Reflector() as jest.Mocked<Reflector>;
    guard = new MfaGuard(reflector);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  const mockContext = (user: any) => ({
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue({ user }),
    }),
  }) as unknown as ExecutionContext;

  it('should return true when REQUIRE_MFA_KEY is not set', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const ctx = mockContext({});

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should return true when requireMfa is false', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const ctx = mockContext({});

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should return true when user has mfaVerified = true', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    const ctx = mockContext({ mfaVerified: true });

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should throw UnauthorizedException when mfaVerified is false', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    const ctx = mockContext({ mfaVerified: false });

    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException when user is null', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    const ctx = mockContext(null);

    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException when user is undefined', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    const ctx = mockContext(undefined);

    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });
});
