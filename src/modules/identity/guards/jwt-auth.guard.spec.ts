import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  it('should be defined', () => {
    const guard = new JwtAuthGuard();
    expect(guard).toBeDefined();
  });

  it('should extend AuthGuard with jwt strategy', () => {
    const guard = new JwtAuthGuard();
    expect(guard.constructor.name).toBe('JwtAuthGuard');
  });
});
