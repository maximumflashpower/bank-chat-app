jest.mock('../entities/dpo-contact.entity');

import { DpoContactService } from './dpo-contact.service';
import { NotFoundException } from '@nestjs/common';

describe('DpoContactService', () => {
  let service: DpoContactService;
  let repo: any;

  beforeEach(() => {
    repo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    service = new DpoContactService(repo);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createContact', () => {
    it('should create contact with defaults', async () => {
      repo.findOne.mockResolvedValue(null);
      const mockCreated = { id: 'c1', fullName: 'Alice' };
      repo.create.mockReturnValue(mockCreated);
      repo.save.mockResolvedValue(mockCreated);

      const dto = { fullName: 'Alice', email: 'alice@dpo.com', organization: 'Org' };
      const result = await service.createContact(dto);
      expect(result).toBe(mockCreated);
      expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({
        fullName: 'Alice',
        email: 'alice@dpo.com',
        phone: null,
        jurisdiction: null,
        isPrimary: false,
        isActive: true,
      }));
    });

    it('should demote existing primary when creating new primary contact', async () => {
      const existingPrimary = { id: 'old-primary', isPrimary: true };
      repo.findOne.mockResolvedValue(existingPrimary);
      const mockCreated = { id: 'c1', isPrimary: true };
      repo.create.mockReturnValue(mockCreated);
      repo.save.mockResolvedValue(mockCreated);

      await service.createContact({ fullName: 'Bob', email: 'bob@dpo.com', organization: 'Org', isPrimary: true });

      expect(existingPrimary.isPrimary).toBe(false);
      expect(repo.save).toHaveBeenCalledWith(existingPrimary);
    });

    it('should not demote when creating non-primary contact', async () => {
      repo.findOne.mockResolvedValue(null);
      repo.create.mockReturnValue({ id: 'c1' });
      repo.save.mockResolvedValue({ id: 'c1' });

      await service.createContact({ fullName: 'Bob', email: 'bob@dpo.com', organization: 'Org' });
      expect(repo.findOne).not.toHaveBeenCalledWith({ where: { isPrimary: true } });
    });

    it('should use provided phone and jurisdiction', async () => {
      repo.findOne.mockResolvedValue(null);
      repo.create.mockReturnValue({ id: 'c1' });
      repo.save.mockResolvedValue({ id: 'c1' });

      await service.createContact({ fullName: 'Alice', email: 'a@dpo.com', organization: 'Org', phone: '+123', jurisdiction: 'EU' });
      expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({
        phone: '+123',
        jurisdiction: 'EU',
      }));
    });
  });

  describe('listContacts', () => {
    it('should return all contacts when activeOnly=false', async () => {
      const mockContacts = [{ id: 'c1' }, { id: 'c2' }];
      repo.find.mockResolvedValue(mockContacts);
      const result = await service.listContacts();
      expect(result).toBe(mockContacts);
      expect(repo.find).toHaveBeenCalledWith({ where: {}, order: { isPrimary: 'DESC', createdAt: 'DESC' } });
    });

    it('should return only active contacts when activeOnly=true', async () => {
      repo.find.mockResolvedValue([]);
      await service.listContacts(true);
      expect(repo.find).toHaveBeenCalledWith({ where: { isActive: true }, order: { isPrimary: 'DESC', createdAt: 'DESC' } });
    });
  });

  describe('getById', () => {
    it('should return contact by id', async () => {
      const mockContact = { id: 'c1', fullName: 'Alice' };
      repo.findOne.mockResolvedValue(mockContact);
      const result = await service.getById('c1');
      expect(result).toBe(mockContact);
    });

    it('should throw NotFoundException when not found', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.getById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getPrimaryContact', () => {
    it('should return the primary active contact', async () => {
      const mockContact = { id: 'c1', isPrimary: true, isActive: true };
      repo.findOne.mockResolvedValue(mockContact);
      const result = await service.getPrimaryContact();
      expect(result).toBe(mockContact);
      expect(repo.findOne).toHaveBeenCalledWith({ where: { isPrimary: true, isActive: true } });
    });

    it('should throw NotFoundException when no primary contact exists', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.getPrimaryContact()).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateContact', () => {
    it('should update contact fields', async () => {
      const contact = { id: 'c1', fullName: 'Old', organization: 'OldOrg' };
      repo.findOne.mockResolvedValue(contact);
      repo.save.mockImplementation((e: any) => Promise.resolve(e));
      const result = await service.updateContact('c1', { fullName: 'New' });
      expect(result.fullName).toBe('New');
    });

    it('should demote existing primary when promoting another to primary', async () => {
      const contact = { id: 'c2', isPrimary: false };
      const existingPrimary = { id: 'c1', isPrimary: true };
      repo.findOne.mockResolvedValueOnce(contact); // getById
      repo.findOne.mockResolvedValueOnce(existingPrimary); // find existing primary
      repo.save.mockImplementation((e: any) => Promise.resolve(e));

      await service.updateContact('c2', { isPrimary: true });
      expect(existingPrimary.isPrimary).toBe(false);
      expect(repo.save).toHaveBeenCalledWith(existingPrimary);
    });

    it('should not demote when promoting same contact to primary', async () => {
      const contact = { id: 'c1', isPrimary: false };
      repo.findOne.mockResolvedValueOnce(contact); // getById
      repo.findOne.mockResolvedValueOnce({ id: 'c1', isPrimary: true }); // same contact found
      repo.save.mockImplementation((e: any) => Promise.resolve(e));

      await service.updateContact('c1', { isPrimary: true });
      // Should NOT demote itself
      expect(contact.isPrimary).toBe(true);
    });

    it('should throw NotFoundException when not found', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.updateContact('nonexistent', { fullName: 'X' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('deactivateContact', () => {
    it('should set isActive false and isPrimary false', async () => {
      const contact = { id: 'c1', isActive: true, isPrimary: true, fullName: 'Alice' };
      repo.findOne.mockResolvedValue(contact);
      repo.save.mockImplementation((e: any) => Promise.resolve(e));
      const result = await service.deactivateContact('c1');
      expect(result.isActive).toBe(false);
      expect(result.isPrimary).toBe(false);
    });

    it('should throw NotFoundException when not found', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.deactivateContact('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});
