import { UserService } from './user.service';
import { Repository } from 'typeorm';
import { UserProfile } from '../entities/user-profile.entity';
import { IdentityUser } from '../../identity/entities/identity-user.entity';
import { Credential } from '../../identity/entities/credential.entity';
import { CredentialType } from '../../identity/entities/credential-type.enum';
import { UserStatus } from '../../identity/entities/user-status.enum';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('UserService', () => {
  let service: UserService;
  let mockProfileRepo: Partial<Repository<UserProfile>>;
  let mockUserRepo: Partial<Repository<IdentityUser>>;
  let mockCredentialRepo: Partial<Repository<Credential>>;
  let mockConfigService: any;

  const now = new Date(2026, 6, 10, 12, 0, 0);

  beforeEach(() => {
    jest.clearAllMocks();

    mockProfileRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
    };

    mockUserRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
    };

    mockCredentialRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
    };

    mockConfigService = {
      get: jest.fn((key: string, defaultValue?: any) => {
        if (key === 'BCRYPT_ROUNDS') return 12;
        return defaultValue ?? null;
      }),
    };

    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    service = new UserService(
      mockProfileRepo as any,
      mockUserRepo as any,
      mockCredentialRepo as any,
      mockConfigService,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('setPassword (USER-001)', () => {
    it('debe establecer contraseña nueva para usuario sin credencial', async () => {
      const userId = 'user-001';
      const user: any = {
        id: userId,
        status: UserStatus.ACTIVE,
        credentials: [],
      };

      const newCred: any = { userId, type: CredentialType.PASSWORD, hashedValue: 'hashed-password', isActive: true };

      (mockUserRepo.findOne as jest.Mock).mockResolvedValue(user);
      (mockCredentialRepo.create as jest.Mock).mockReturnValue(newCred);
      (mockCredentialRepo.save as jest.Mock).mockResolvedValue(newCred);

      const result = await service.setPassword(userId, { password: 'SecurePass123!' });

      expect(bcrypt.hash).toHaveBeenCalledWith('SecurePass123!', 12);
      expect(mockCredentialRepo.save).toHaveBeenCalled();
      expect(result.message).toBe('Password set successfully');
    });

    it('debe lanzar ConflictException si ya tiene contraseña', async () => {
      const userId = 'user-001';
      const user: any = {
        id: userId,
        status: UserStatus.ACTIVE,
        credentials: [{ type: CredentialType.PASSWORD, hashedValue: 'old-hash', isActive: true }],
      };

      (mockUserRepo.findOne as jest.Mock).mockResolvedValue(user);

      await expect(service.setPassword(userId, { password: 'SecurePass123!' }))
        .rejects.toThrow('Password already set. Use change-password endpoint.');
    });

    it('debe lanzar NotFoundException si usuario no existe', async () => {
      (mockUserRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.setPassword('nonexistent', { password: 'SecurePass123!' }))
        .rejects.toThrow('User not found');
    });

    it('debe lanzar error si usuario está inactivo', async () => {
      const user: any = { id: 'user-001', status: UserStatus.INACTIVE, credentials: [] };
      (mockUserRepo.findOne as jest.Mock).mockResolvedValue(user);

      await expect(service.setPassword('user-001', { password: 'SecurePass123!' }))
        .rejects.toThrow('Account must be active to set a password');
    });
  });

  describe('getProfile (USER-002)', () => {
    it('debe retornar perfil existente del usuario', async () => {
      const userId = 'user-001';
      const profile: any = {
        id: 'profile-001',
        userId,
        firstName: 'Jane',
        lastName: 'Smith',
      };

      (mockProfileRepo.findOne as jest.Mock).mockResolvedValue(profile);

      const result = await service.getProfile(userId);

      expect(result.firstName).toBe('Jane');
      expect(result.lastName).toBe('Smith');
    });

    it('debe auto-crear perfil si no existe', async () => {
      const userId = 'user-001';
      const user: any = { id: userId, firstName: 'John', lastName: 'Doe' };
      const newProfile: any = { id: 'profile-new', userId, firstName: 'John', lastName: 'Doe' };

      (mockProfileRepo.findOne as jest.Mock).mockResolvedValue(null);
      (mockUserRepo.findOne as jest.Mock).mockResolvedValue(user);
      (mockProfileRepo.create as jest.Mock).mockReturnValue(newProfile);
      (mockProfileRepo.save as jest.Mock).mockResolvedValue(newProfile);

      const result = await service.getProfile(userId);

      expect(result.firstName).toBe('John');
      expect(mockProfileRepo.create).toHaveBeenCalled();
    });

    it('debe lanzar NotFoundException si usuario no existe al auto-crear', async () => {
      (mockProfileRepo.findOne as jest.Mock).mockResolvedValue(null);
      (mockUserRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.getProfile('nonexistent'))
        .rejects.toThrow('User not found');
    });
  });

  describe('updateProfile (USER-003)', () => {
    it('debe actualizar campos del perfil', async () => {
      const userId = 'user-001';

      const existing: any = {
        id: 'profile-001',
        userId,
        firstName: 'John',
        lastName: 'Doe',
        city: 'Old City',
      };

      const updated: any = {
        ...existing,
        firstName: 'Johnny',
        city: 'New City',
      };

      (mockProfileRepo.findOne as jest.Mock).mockResolvedValue(existing);
      (mockProfileRepo.save as jest.Mock).mockResolvedValue(updated);

      const result = await service.updateProfile(userId, {
        firstName: 'Johnny',
        city: 'New City',
      });

      expect(result.firstName).toBe('Johnny');
      expect(result.city).toBe('New City');
    });

    it('debe permitir actualización parcial (solo firstName)', async () => {
      const userId = 'user-001';

      const existing: any = {
        id: 'profile-001',
        userId,
        firstName: 'Old',
        lastName: 'Name',
      };

      const updated: any = { ...existing, firstName: 'New' };

      (mockProfileRepo.findOne as jest.Mock).mockResolvedValue(existing);
      (mockProfileRepo.save as jest.Mock).mockResolvedValue(updated);

      const result = await service.updateProfile(userId, { firstName: 'New' });

      expect(result.firstName).toBe('New');
      expect(result.lastName).toBe('Name');
    });

    it('debe auto-crear perfil si no existe y luego actualizar', async () => {
      const userId = 'user-001';
      const user: any = { id: userId, firstName: 'Auto', lastName: 'Created' };
      const newProfile: any = { id: 'profile-auto', userId, firstName: 'Auto', lastName: 'Created' };
      const updated: any = { ...newProfile, firstName: 'Updated' };

      (mockProfileRepo.findOne as jest.Mock).mockResolvedValue(null);
      (mockUserRepo.findOne as jest.Mock).mockResolvedValue(user);
      (mockProfileRepo.create as jest.Mock).mockReturnValue(newProfile);
      (mockProfileRepo.save as jest.Mock)
        .mockResolvedValueOnce(newProfile)
        .mockResolvedValueOnce(updated);

      const result = await service.updateProfile(userId, { firstName: 'Updated' });

      expect(result.firstName).toBe('Updated');
    });
  });

  describe('changePassword (USER-004)', () => {
    it('debe cambiar contraseña si actual es correcta', async () => {
      const userId = 'user-001';
      const oldPassword = 'OldPass123!';
      const newPassword = 'NewPass456!';

      const user: any = {
        id: userId,
        status: UserStatus.ACTIVE,
        credentials: [{
          type: CredentialType.PASSWORD,
          hashedValue: 'old-hash',
          isActive: true,
        }],
      };

      (mockUserRepo.findOne as jest.Mock).mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hash');

      const result = await service.changePassword(userId, oldPassword, newPassword);

      expect(bcrypt.compare).toHaveBeenCalledWith(oldPassword, 'old-hash');
      expect(bcrypt.hash).toHaveBeenCalled();
      expect(result.message).toContain('success');
    });

    it('debe lanzar error si contraseña actual es incorrecta', async () => {
      const userId = 'user-001';
      const user: any = {
        id: userId,
        status: UserStatus.ACTIVE,
        credentials: [{
          type: CredentialType.PASSWORD,
          hashedValue: 'old-hash',
          isActive: true,
        }],
      };

      (mockUserRepo.findOne as jest.Mock).mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.changePassword(userId, 'wrong', 'NewPass456!'))
        .rejects.toThrow('Current password is incorrect');
    });

    it('debe lanzar error si usuario no tiene credencial password', async () => {
      const userId = 'user-001';
      const user: any = {
        id: userId,
        status: UserStatus.ACTIVE,
        credentials: [],
      };

      (mockUserRepo.findOne as jest.Mock).mockResolvedValue(user);

      await expect(service.changePassword(userId, 'old', 'NewPass456!'))
        .rejects.toThrow('No password set. Use set-password endpoint.');
    });

    it('debe lanzar NotFoundException si usuario no existe', async () => {
      (mockUserRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.changePassword('nonexistent', 'old', 'new'))
        .rejects.toThrow('User not found');
    });
  });
});
