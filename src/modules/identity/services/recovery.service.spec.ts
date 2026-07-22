import { RecoveryService } from './recovery.service';
import { RecoveryStatus } from '../entities/recovery-status.enum';

describe('RecoveryService', () => {
  let service: RecoveryService;
  let repo: any;

  beforeEach(() => {
    repo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
    };
    service = new RecoveryService(repo);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ═══════════════════════════════════════════════════
  // initiateRecovery
  // ═══════════════════════════════════════════════════
  describe('initiateRecovery', () => {
    it('should create recovery ticket with INITIATED status', async () => {
      const dto = {
        contactMethod: 'email',
        contactAddresses: ['backup@example.com'],
      } as any;

      repo.create.mockImplementation((data: any) => ({ ...data }));
      repo.save.mockImplementation((input: any) => Promise.resolve(input));

      const result = await service.initiateRecovery('u1', dto);
      expect(result.userId).toBe('u1');
      expect(result.status).toBe(RecoveryStatus.INITIATED);
      expect(result.requiredVerifications).toBe(3);
      expect(result.verifiedCount).toBe(0);
    });

    it('should set verificationDeadline to ~7 days from now', async () => {
      const dto = {
        contactMethod: 'email',
        contactAddresses: ['backup@example.com'],
      } as any;

      repo.create.mockImplementation((data: any) => ({ ...data }));
      repo.save.mockImplementation((input: any) => Promise.resolve(input));

      const before = Date.now();
      const result = await service.initiateRecovery('u1', dto);
      const diff = result.verificationDeadline.getTime() - before;
      // 7 days = 604_800_000 ms; allow ±5s tolerance
      expect(diff).toBeGreaterThanOrEqual(604_795_000);
      expect(diff).toBeLessThanOrEqual(604_805_000);
    });

    it('should deep clone contactAddresses to prevent mutation', async () => {
      const originalAddresses = ['test@example.com'];
      const dto = {
        contactMethod: 'email',
        contactAddresses: originalAddresses,
      } as any;

      repo.create.mockImplementation((data: any) => ({ ...data }));
      repo.save.mockImplementation((input: any) => Promise.resolve(input));

      await service.initiateRecovery('u1', dto);
      // Verify repo.create received a clone, not the original reference
      const createCall = repo.create.mock.calls[0][0];
      expect(createCall.contactAddresses).not.toBe(originalAddresses);
      expect(createCall.contactAddresses).toEqual(['test@example.com']);
      
      // Mutate original — should not affect what was passed to create
      originalAddresses.push('mutated@example.com');
      expect(createCall.contactAddresses).toEqual(['test@example.com']);
    });
  });

  // ═══════════════════════════════════════════════════
  // confirmVerification
  // ═══════════════════════════════════════════════════
  describe('confirmVerification', () => {
    it('should increment verifiedCount', async () => {
      const ticket = {
        id: 'ticket-123',
        status: RecoveryStatus.PENDING_VERIFICATION,
        verifiedCount: 2,
        requiredVerifications: 3,
      } as any;

      repo.findOne.mockResolvedValue(ticket);
      repo.save.mockImplementation((input: any) => Promise.resolve(input));

      const result = await service.confirmVerification('ticket-123', 'code-123');
      expect(result).toBe(true);
      expect(ticket.verifiedCount).toBe(3);
    });

    it('should finalize ticket when verifiedCount reaches requiredVerifications', async () => {
      const ticket = {
        id: 'ticket-123',
        status: RecoveryStatus.PENDING_VERIFICATION,
        verifiedCount: 2,
        requiredVerifications: 3,
      } as any;

      repo.findOne.mockResolvedValue(ticket);
      repo.save.mockImplementation((input: any) => Promise.resolve(input));

      await service.confirmVerification('ticket-123', 'code-123');
      expect(ticket.status).toBe(RecoveryStatus.FINALIZED);
      expect(ticket.cooldownUntil).toBeInstanceOf(Date);
    });

    it('should set ~72-hour cooldown when ticket is finalized', async () => {
      const ticket = {
        id: 'ticket-123',
        status: RecoveryStatus.PENDING_VERIFICATION,
        verifiedCount: 2,
        requiredVerifications: 3,
      } as any;

      repo.findOne.mockResolvedValue(ticket);
      repo.save.mockImplementation((input: any) => Promise.resolve(input));

      const before = Date.now();
      await service.confirmVerification('ticket-123', 'code-123');

      // 72h = 259_200_000 ms; allow ±5s tolerance
      const cooldownDiff = ticket.cooldownUntil.getTime() - before;
      expect(cooldownDiff).toBeGreaterThanOrEqual(259_195_000);
      expect(cooldownDiff).toBeLessThanOrEqual(259_205_000);
    });

    it('should not finalize when verifiedCount < requiredVerifications', async () => {
      const ticket = {
        id: 'ticket-123',
        status: RecoveryStatus.PENDING_VERIFICATION,
        verifiedCount: 1,
        requiredVerifications: 3,
      } as any;

      repo.findOne.mockResolvedValue(ticket);
      repo.save.mockImplementation((input: any) => Promise.resolve(input));

      await service.confirmVerification('ticket-123', 'code-123');
      expect(ticket.status).toBe(RecoveryStatus.PENDING_VERIFICATION);
    });

    it('should return false when ticket does not exist', async () => {
      repo.findOne.mockResolvedValue(null);
      const result = await service.confirmVerification('invalid-id', 'code');
      expect(result).toBe(false);
    });

    it('should return false when ticket is not PENDING_VERIFICATION', async () => {
      const ticket = {
        id: 'ticket-123',
        status: RecoveryStatus.INITIATED,
        verifiedCount: 0,
        requiredVerifications: 3,
      } as any;

      repo.findOne.mockResolvedValue(ticket);

      const result = await service.confirmVerification('ticket-123', 'code');
      expect(result).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════
  // getTicketStatus
  // ═══════════════════════════════════════════════════
  describe('getTicketStatus', () => {
    it('should return ticket by ID', async () => {
      const expectedTicket = { id: 'ticket-123' } as any;
      repo.findOne.mockResolvedValue(expectedTicket);

      const result = await service.getTicketStatus('ticket-123');
      expect(result).toBe(expectedTicket);
    });

    it('should return null when ticket not found', async () => {
      repo.findOne.mockResolvedValue(null);
      const result = await service.getTicketStatus('nonexistent');
      expect(result).toBeNull();
    });
  });

  // ═══════════════════════════════════════════════════
  // verifyCooldownExpired
  // ═══════════════════════════════════════════════════
  describe('verifyCooldownExpired', () => {
    it('should return true when no FINALIZED ticket exists', async () => {
      repo.findOne.mockResolvedValue(null);
      const result = await service.verifyCooldownExpired('u1');
      expect(result).toBe(true);
    });

    it('should return true when cooldownUntil is null', async () => {
      repo.findOne.mockResolvedValue({
        userId: 'u1',
        status: RecoveryStatus.FINALIZED,
        cooldownUntil: null,
      });

      const result = await service.verifyCooldownExpired('u1');
      expect(result).toBe(true);
    });

    it('should return true when cooldown has expired', async () => {
      repo.findOne.mockResolvedValue({
        userId: 'u1',
        status: RecoveryStatus.FINALIZED,
        cooldownUntil: new Date(Date.now() - 100_000), // 100 sec ago
      });

      const result = await service.verifyCooldownExpired('u1');
      expect(result).toBe(true);
    });

    it('should return false when cooldown has not expired yet', async () => {
      repo.findOne.mockResolvedValue({
        userId: 'u1',
        status: RecoveryStatus.FINALIZED,
        cooldownUntil: new Date(Date.now() + 100_000), // 100 sec in future
      });

      const result = await service.verifyCooldownExpired('u1');
      expect(result).toBe(false);
    });

    it('should find the most recent FINALIZED ticket', async () => {
      repo.findOne.mockResolvedValue({
        id: 'ticket-latest',
        userId: 'u1',
        status: RecoveryStatus.FINALIZED,
      });

      await service.verifyCooldownExpired('u1');
      expect(repo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          order: { finalizedAt: 'DESC' },
        }),
      );
    });
  });
});
