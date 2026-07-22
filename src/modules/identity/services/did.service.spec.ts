import { DidService } from './did.service';
import { BadRequestException, ConflictException } from '@nestjs/common';

describe('DidService', () => {
  let service: DidService;
  let didRepo: any;
  let userRepo: any;

  beforeEach(() => {
    didRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      update: jest.fn(),
    };
    userRepo = {
      findOne: jest.fn(),
    };
    service = new DidService(didRepo, userRepo);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ═══════════════════════════════════════════════════
  // registerDid
  // ═══════════════════════════════════════════════════
  describe('registerDid', () => {
    const validDto = {
      didDocumentId: 'did:web:example.com:user1',
      publicKeyJwk: { kty: 'OKP', crv: 'Ed25519', x: 'abc123' },
      keyType: 'Ed25519',
      metadata: { source: 'manual' },
    } as any;

    it('should register a DID successfully', async () => {
      didRepo.findOne.mockResolvedValue(null); // No existing
      userRepo.findOne.mockResolvedValue({ id: 'u1' });
      didRepo.create.mockImplementation((data: any) => ({ ...data }));
      didRepo.save.mockImplementation((input: any) => Promise.resolve(input));

      const result = await service.registerDid('u1', validDto);
      expect(result.didDocumentId).toBe('did:web:example.com:user1');
      expect(result.userId).toBe('u1');
      expect(result.method).toBe('web');
      expect(result.isVerified).toBe(false);
      expect(result.status).toBe('active');
      expect(result.didDocumentJson).toEqual(expect.any(String));
    });

    it('should throw BadRequestException when DID does not start with "did:"', async () => {
      await expect(
        service.registerDid('u1', { ...validDto, didDocumentId: 'http:example.com' } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException when DID already exists', async () => {
      didRepo.findOne.mockResolvedValue({ id: 'did-existing' });

      await expect(service.registerDid('u1', validDto)).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException when user not found', async () => {
      didRepo.findOne.mockResolvedValue(null);
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.registerDid('u1', validDto)).rejects.toThrow(BadRequestException);
    });

    it('should parse DID method from document ID', async () => {
      didRepo.findOne.mockResolvedValue(null);
      userRepo.findOne.mockResolvedValue({ id: 'u1' });
      didRepo.create.mockImplementation((data: any) => ({ ...data }));
      didRepo.save.mockImplementation((input: any) => Promise.resolve(input));

      const result = await service.registerDid('u1', {
        ...validDto,
        didDocumentId: 'did:key:z6MkpTHR8VNsBxYAAWHut2Ge',
      } as any);
      expect(result.method).toBe('key');
    });

    it('should use "unknown" method when DID format is unusual', async () => {
      didRepo.findOne.mockResolvedValue(null);
      userRepo.findOne.mockResolvedValue({ id: 'u1' });
      didRepo.create.mockImplementation((data: any) => ({ ...data }));
      didRepo.save.mockImplementation((input: any) => Promise.resolve(input));

      const result = await service.registerDid('u1', {
        ...validDto,
        didDocumentId: 'did::weird-format',
      } as any);
      expect(result.method).toBe('unknown');
    });

    it('should use empty metadata when not provided', async () => {
      didRepo.findOne.mockResolvedValue(null);
      userRepo.findOne.mockResolvedValue({ id: 'u1' });
      didRepo.create.mockImplementation((data: any) => ({ ...data }));
      didRepo.save.mockImplementation((input: any) => Promise.resolve(input));

      const result = await service.registerDid('u1', {
        ...validDto,
        metadata: undefined,
      } as any);
      expect(result.metadata).toEqual({});
    });
  });

  // ═══════════════════════════════════════════════════
  // findByUserId
  // ═══════════════════════════════════════════════════
  describe('findByUserId', () => {
    it('should return active DIDs for user sorted by createdAt DESC', async () => {
      const dids = [
        { id: 'd2', userId: 'u1', status: 'active', createdAt: new Date('2026-07-02') },
        { id: 'd1', userId: 'u1', status: 'active', createdAt: new Date('2026-07-01') },
      ];
      didRepo.find.mockResolvedValue(dids);

      const result = await service.findByUserId('u1');
      expect(result).toHaveLength(2);
      expect(didRepo.find).toHaveBeenCalledWith({
        where: { userId: 'u1', status: 'active' },
        order: { createdAt: 'DESC' },
      });
    });

    it('should return empty array when no DIDs exist', async () => {
      didRepo.find.mockResolvedValue([]);
      const result = await service.findByUserId('u1');
      expect(result).toEqual([]);
    });
  });

  // ═══════════════════════════════════════════════════
  // findById
  // ═══════════════════════════════════════════════════
  describe('findById', () => {
    it('should return DID by ID with user relation', async () => {
      const did = { id: 'd1', status: 'active' };
      didRepo.findOne.mockResolvedValue(did);

      const result = await service.findById('d1');
      expect(result).toBe(did);
      expect(didRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'd1', status: 'active' },
        relations: { user: true },
      });
    });

    it('should return null when not found', async () => {
      didRepo.findOne.mockResolvedValue(null);
      const result = await service.findById('nonexistent');
      expect(result).toBeNull();
    });
  });

  // ═══════════════════════════════════════════════════
  // findByDidDocumentId
  // ═══════════════════════════════════════════════════
  describe('findByDidDocumentId', () => {
    it('should return DID by document ID', async () => {
      const did = { id: 'd1', didDocumentId: 'did:web:example.com' };
      didRepo.findOne.mockResolvedValue(did);

      const result = await service.findByDidDocumentId('did:web:example.com');
      expect(result).toBe(did);
      expect(didRepo.findOne).toHaveBeenCalledWith({
        where: { didDocumentId: 'did:web:example.com', status: 'active' },
      });
    });

    it('should return null when not found', async () => {
      didRepo.findOne.mockResolvedValue(null);
      const result = await service.findByDidDocumentId('did:web:nonexistent.com');
      expect(result).toBeNull();
    });
  });

  // ═══════════════════════════════════════════════════
  // verifyDid
  // ═══════════════════════════════════════════════════
  describe('verifyDid', () => {
    it('should mark DID as verified and set verifiedAt', async () => {
      const did = { id: 'd1', isVerified: false, verifiedAt: null };
      didRepo.findOne.mockResolvedValue(did);
      didRepo.save.mockImplementation((input: any) => Promise.resolve(input));

      const result = await service.verifyDid('d1', 'admin-1');
      expect(result.isVerified).toBe(true);
      expect(result.verifiedAt).toBeInstanceOf(Date);
    });

    it('should throw BadRequestException when DID not found', async () => {
      didRepo.findOne.mockResolvedValue(null);
      await expect(service.verifyDid('nonexistent')).rejects.toThrow(BadRequestException);
    });
  });

  // ═══════════════════════════════════════════════════
  // revokeDid
  // ═══════════════════════════════════════════════════
  describe('revokeDid', () => {
    it('should set status to revoked and store reason in metadata', async () => {
      const did = { id: 'd1', status: 'active', metadata: { existing: true } };
      didRepo.findOne.mockResolvedValue(did);
      didRepo.save.mockImplementation((input: any) => Promise.resolve(input));

      const result = await service.revokeDid('d1', 'Compromised key');
      expect(result.status).toBe('revoked');
      expect(result.metadata).toEqual(expect.objectContaining({
        existing: true,
        revocationReason: 'Compromised key',
      }));
    });

    it('should store undefined reason when not provided', async () => {
      const did = { id: 'd1', status: 'active', metadata: {} };
      didRepo.findOne.mockResolvedValue(did);
      didRepo.save.mockImplementation((input: any) => Promise.resolve(input));

      const result = await service.revokeDid('d1');
      expect(result.metadata).toEqual(expect.objectContaining({
        revocationReason: undefined,
      }));
    });

    it('should throw BadRequestException when DID not found', async () => {
      didRepo.findOne.mockResolvedValue(null);
      await expect(service.revokeDid('nonexistent')).rejects.toThrow(BadRequestException);
    });
  });

  // ═══════════════════════════════════════════════════
  // markAsUsed
  // ═══════════════════════════════════════════════════
  describe('markAsUsed', () => {
    it('should update lastUsedAt timestamp', async () => {
      await service.markAsUsed('d1');
      expect(didRepo.update).toHaveBeenCalledWith('d1', { lastUsedAt: expect.any(Date) });
    });
  });

  // ═══════════════════════════════════════════════════
  // resolveDidDocument
  // ═══════════════════════════════════════════════════
  describe('resolveDidDocument', () => {
    it('should return parsed DID document JSON', async () => {
      const doc = { id: 'did:web:example.com', '@context': ['https://www.w3.org/ns/did/v1'] };
      didRepo.findOne.mockResolvedValue({
        didDocumentJson: JSON.stringify(doc),
      });

      const result = await service.resolveDidDocument('did:web:example.com');
      expect(result).toEqual(doc);
    });

    it('should return null when DID not found', async () => {
      didRepo.findOne.mockResolvedValue(null);
      const result = await service.resolveDidDocument('did:web:nonexistent.com');
      expect(result).toBeNull();
    });

    it('should return null when didDocumentJson is null', async () => {
      didRepo.findOne.mockResolvedValue({ didDocumentJson: null });
      const result = await service.resolveDidDocument('did:web:example.com');
      expect(result).toBeNull();
    });

    it('should return null when JSON parsing fails', async () => {
      didRepo.findOne.mockResolvedValue({ didDocumentJson: 'not-valid-json{' });
      const result = await service.resolveDidDocument('did:web:example.com');
      expect(result).toBeNull();
    });
  });

  // ═══════════════════════════════════════════════════
  // getPublicKeyJwk
  // ═══════════════════════════════════════════════════
  describe('getPublicKeyJwk', () => {
    it('should return parsed public key JWK', async () => {
      const jwk = { kty: 'OKP', crv: 'Ed25519', x: 'abc123' };
      didRepo.findOne.mockResolvedValue({
        publicKeyJwk: JSON.stringify(jwk),
      });

      const result = await service.getPublicKeyJwk('d1');
      expect(result).toEqual(jwk);
    });

    it('should return null when DID not found', async () => {
      didRepo.findOne.mockResolvedValue(null);
      const result = await service.getPublicKeyJwk('nonexistent');
      expect(result).toBeNull();
    });

    it('should return null when publicKeyJwk is null', async () => {
      didRepo.findOne.mockResolvedValue({ publicKeyJwk: null });
      const result = await service.getPublicKeyJwk('d1');
      expect(result).toBeNull();
    });

    it('should return null when JSON parsing fails', async () => {
      didRepo.findOne.mockResolvedValue({ publicKeyJwk: '{invalid}' });
      const result = await service.getPublicKeyJwk('d1');
      expect(result).toBeNull();
    });
  });
});
