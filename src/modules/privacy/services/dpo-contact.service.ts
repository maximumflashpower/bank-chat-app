import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DpoContact } from '../entities/dpo-contact.entity';
import { CreateDpoContactDto } from '../dto/create-dpo-contact.dto';

/**
 * Servicio de gestión de contactos del Data Protection Officer
 * Función: PRIV-MISC-002
 */
@Injectable()
export class DpoContactService {
  private readonly logger = new Logger(DpoContactService.name);

  constructor(
    @InjectRepository(DpoContact)
    private readonly repo: Repository<DpoContact>,
  ) {}

  async createContact(dto: CreateDpoContactDto): Promise<DpoContact> {
    if (dto.isPrimary) {
      const existingPrimary = await this.repo.findOne({ where: { isPrimary: true } });
      if (existingPrimary) {
        existingPrimary.isPrimary = false;
        await this.repo.save(existingPrimary);
      }
    }

    const contact = this.repo.create({
      fullName: dto.fullName,
      email: dto.email,
      phone: dto.phone || null,
      organization: dto.organization,
      jurisdiction: dto.jurisdiction || null,
      isPrimary: dto.isPrimary || false,
      isActive: true,
    });

    const saved = await this.repo.save(contact);
    this.logger.log(`Contacto DPO creado: ${saved.fullName}`);
    return saved;
  }

  async listContacts(activeOnly = false): Promise<DpoContact[]> {
    const where = activeOnly ? { isActive: true } : {};
    return this.repo.find({ where, order: { isPrimary: 'DESC', createdAt: 'DESC' } });
  }

  async getById(id: string): Promise<DpoContact> {
    const contact = await this.repo.findOne({ where: { id } });
    if (!contact) {
      throw new NotFoundException(`Contacto DPO no encontrado: ${id}`);
    }
    return contact;
  }

  async getPrimaryContact(): Promise<DpoContact> {
    const contact = await this.repo.findOne({ where: { isPrimary: true, isActive: true } });
    if (!contact) {
      throw new NotFoundException('No hay DPO principal configurado');
    }
    return contact;
  }

  async updateContact(id: string, updates: Partial<CreateDpoContactDto>): Promise<DpoContact> {
    const contact = await this.getById(id);

    if (updates.isPrimary) {
      const existingPrimary = await this.repo.findOne({ where: { isPrimary: true } });
      if (existingPrimary && existingPrimary.id !== id) {
        existingPrimary.isPrimary = false;
        await this.repo.save(existingPrimary);
      }
    }

    Object.assign(contact, updates);
    return this.repo.save(contact);
  }

  async deactivateContact(id: string): Promise<DpoContact> {
    const contact = await this.getById(id);
    contact.isActive = false;
    contact.isPrimary = false;
    this.logger.log(`Contacto DPO desactivado: ${contact.fullName}`);
    return this.repo.save(contact);
  }
}
