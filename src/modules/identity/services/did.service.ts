import { Injectable, Logger, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IdentityDid } from '../entities/identity-did.entity';
import { IdentityUser } from '../entities/identity-user.entity';
import { DidRegisterDto } from '../dto/did-register.dto';

@Injectable()
export class DidService {
  private readonly logger = new Logger(DidService.name);

  constructor(
    @InjectRepository(IdentityDid)
    private readonly didRepo: Repository<IdentityDid>,
    @InjectRepository(IdentityUser)
    private readonly userRepo: Repository<IdentityUser>,
  ) {}

  /**
   * AUTH-MOD-005: Decentralized DID Self-Sovereign Identity Registration
   */
  async registerDid(userId: string, dto: DidRegisterDto): Promise<IdentityDid> {
    // Validar formato DID básico
    if (!dto.didDocumentId.startsWith('did:')) {
      throw new BadRequestException('DID debe comenzar con "did:"');
    }

    // Verificar que no exista ya
    const existing = await this.didRepo.findOne({ where: { didDocumentId: dto.didDocumentId } });
    if (existing) {
      throw new ConflictException('DID ya registrado');
    }

    // Obtener usuario
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('Usuario no encontrado');
    }

    // Parsear método DID (ej: did:web:... -> web)
    const method = dto.didDocumentId.split(':')[1] || 'unknown';

    // Crear DID Document completo (formato W3C)
    const didDocument = this.buildDidDocument(dto, userId);

    const did = this.didRepo.create({
      userId,
      user,
      didDocumentId: dto.didDocumentId,
      publicKeyJwk: JSON.stringify(dto.publicKeyJwk),
      keyType: dto.keyType,
      method,
      isVerified: false,
      didDocumentJson: JSON.stringify(didDocument),
      metadata: dto.metadata || {},
      status: 'active',
    });

    const saved = await this.didRepo.save(did);
    this.logger.log(`DID registered: ${dto.didDocumentId} for user ${userId}`);

    return saved;
  }

  /**
   * Generar DID Document W3C estándar
   */
  private buildDidDocument(dto: DidRegisterDto, userId: string): Record<string, unknown> {
    return {
      '@context': ['https://www.w3.org/ns/did/v1', 'https://w3id.org/security/suites/jws-2020/v1'],
      id: dto.didDocumentId,
      controller: dto.didDocumentId,
      verificationMethod: [
        {
          id: `${dto.didDocumentId}#${dto.keyType}-key`,
          type: 'JsonWebKey2020',
          controller: dto.didDocumentId,
          publicKeyJwk: dto.publicKeyJwk,
        },
      ],
      authentication: [`${dto.didDocumentId}#${dto.keyType}-key`],
      assertionMethod: [`${dto.didDocumentId}#${dto.keyType}-key`],
      service: [],
      alsoKnownAs: [],
    };
  }

  /**
   * Listar todos los DIDs de un usuario
   */
  async findByUserId(userId: string): Promise<IdentityDid[]> {
    return this.didRepo.find({ 
      where: { userId, status: 'active' },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Obtener DID por ID
   */
  async findById(didId: string): Promise<IdentityDid | null> {
    return this.didRepo.findOne({ 
      where: { id: didId, status: 'active' },
      relations: { user: true },
    });
  }

  /**
   * Obtener DID por documento ID (ej: did:web:...)
   */
  async findByDidDocumentId(documentId: string): Promise<IdentityDid | null> {
    return this.didRepo.findOne({ where: { didDocumentId: documentId, status: 'active' } });
  }

  /**
   * Verificar DID (administrador o auto-verificación)
   */
  async verifyDid(didId: string, verifiedBy?: string): Promise<IdentityDid> {
    const did = await this.findById(didId);
    if (!did) {
      throw new BadRequestException('DID no encontrado');
    }

    did.isVerified = true;
    did.verifiedAt = new Date();
    const saved = await this.didRepo.save(did);

    this.logger.log(`DID verified: ${did.didDocumentId}`);
    return saved;
  }

  /**
   * Revocar DID
   */
  async revokeDid(didId: string, reason?: string): Promise<IdentityDid> {
    const did = await this.findById(didId);
    if (!did) {
      throw new BadRequestException('DID no encontrado');
    }

    did.status = 'revoked';
    did.metadata = { ...did.metadata, revocationReason: reason };
    const saved = await this.didRepo.save(did);

    this.logger.warn(`DID revoked: ${did.didDocumentId} - ${reason}`);
    return saved;
  }

  /**
   * Actualizar último uso
   */
  async markAsUsed(didId: string): Promise<void> {
    await this.didRepo.update(didId, { lastUsedAt: new Date() });
  }

  /**
   * Resolver DID Document para autenticación
   */
  async resolveDidDocument(didId: string): Promise<Record<string, unknown> | null> {
    const did = await this.findByDidDocumentId(didId);
    if (!did || !did.didDocumentJson) {
      return null;
    }

    try {
      return JSON.parse(did.didDocumentJson) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  /**
   * Obtener clave pública JWK para verificación de firma
   */
  async getPublicKeyJwk(didId: string): Promise<Record<string, unknown> | null> {
    const did = await this.findById(didId);
    if (!did || !did.publicKeyJwk) {
      return null;
    }

    try {
      return JSON.parse(did.publicKeyJwk) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
}
