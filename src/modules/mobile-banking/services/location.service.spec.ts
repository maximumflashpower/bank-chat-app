import { Test, TestingModule } from '@nestjs/testing';
import { LocationService } from './location.service';
import { Repository } from 'typeorm';
import { MobileAtmLocator } from '../entities/mobile-atm-locator.entity';
import { MobileAppointment } from '../entities/mobile-appointment.entity';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('LocationService', () => {
  let service: LocationService;
  let locatorRepo: Repository<MobileAtmLocator>;
  let appointmentRepo: Repository<MobileAppointment>;

  const mockLocation = {
    id: 'loc-1',
    name: 'Main Branch',
    addressLine: '123 Main St',
    city: 'Mexico City',
    stateProvince: 'CDMX',
    postalCode: '06600',
    country_code: 'MX',
    latitude: 19.4326,
    longitude: -99.1332,
    location_type: 'branch',
    is_24_hours: false,
    wheelchair_accessible: true,
  };

  const mockAppointment = {
    id: 'apt-1',
    customerId: 'customer-1',
    branchId: 'loc-1',
    advisorName: 'Ana Garcia',
    appointmentType: 'consultation',
    scheduledAt: new Date('2026-07-25T10:00:00Z'),
    durationMinutes: 60,
    status: 'scheduled',
    cancelledAt: undefined,
    cancelReason: undefined,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocationService,
        {
          provide: getRepositoryToken(MobileAtmLocator),
          useValue: {
            createQueryBuilder: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(MobileAppointment),
          useValue: {
            save: jest.fn((apt) => Promise.resolve(apt)),
            find: jest.fn(),
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<LocationService>(LocationService);
    locatorRepo = module.get<Repository<MobileAtmLocator>>(getRepositoryToken(MobileAtmLocator));
    appointmentRepo = module.get<Repository<MobileAppointment>>(getRepositoryToken(MobileAppointment));
  });

  describe('searchLocations', () => {
    it('should search by city', async () => {
      const mockQuery = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([{ ...mockLocation, distance_km: 0.5 }]),
        getRawMany: jest.fn().mockResolvedValue([{ ...mockLocation, distance_km: 0.5 }]),
      };
      jest.spyOn(locatorRepo, 'createQueryBuilder').mockReturnValue(mockQuery as any);

      const result = await service.searchLocations({ city: 'Mexico City', limit: 10 });

      expect(result).toHaveLength(1);
    });

    it('should search with distance calculation', async () => {
      const mockQuery = {
        where: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([{ ...mockLocation, distance_km: 0.5 }]),
        getRawMany: jest.fn().mockResolvedValue([{ ...mockLocation, distance_km: 0.5 }]),
      };
      jest.spyOn(locatorRepo, 'createQueryBuilder').mockReturnValue(mockQuery as any);

      const result = await service.searchLocations({
        latitude: 19.4326,
        longitude: -99.1332,
        limit: 5,
      });

      expect(result).toHaveLength(1);
    });

    it('should filter by location type', async () => {
      const mockQuery = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
        getRawMany: jest.fn().mockResolvedValue([]),
      };
      jest.spyOn(locatorRepo, 'createQueryBuilder').mockReturnValue(mockQuery as any);

      const result = await service.searchLocations({ locationType: 'atm' });

      expect(result).toEqual([]);
    });
  });

  describe('getLocationById', () => {
    it('should return location by ID', async () => {
      jest.spyOn(locatorRepo, 'findOne').mockResolvedValue(mockLocation as any);

      const result = await service.getLocationById('loc-1');

      expect(result.id).toBe('loc-1');
      expect(result.name).toBe('Main Branch');
    });

    it('should throw error if location not found', async () => {
      jest.spyOn(locatorRepo, 'findOne').mockResolvedValue(null);

      await expect(service.getLocationById('loc-999')).rejects.toThrow('Location not found');
    });
  });

  describe('createAppointment', () => {
    it('should create appointment successfully', async () => {
      jest.spyOn(appointmentRepo, 'save').mockImplementation((apt) => Promise.resolve(apt as any));

      const input = {
        customerId: 'customer-1',
        branchId: 'loc-1',
        advisorName: 'Ana Garcia',
        appointmentType: 'consultation',
        scheduledAt: new Date('2026-07-25T10:00:00Z'),
        notes: 'First meeting',
      };

      const result = await service.createAppointment(input);

      expect(result.status).toBe('scheduled');
      expect(result.durationMinutes).toBe(60);
    });

    it('should use default duration if not specified', async () => {
      jest.spyOn(appointmentRepo, 'save').mockImplementation((apt) => Promise.resolve(apt as any));

      const input = {
        customerId: 'customer-1',
        branchId: 'loc-1',
        appointmentType: 'consultation',
        scheduledAt: new Date('2026-07-25T10:00:00Z'),
      };

      const result = await service.createAppointment(input);

      expect(result.durationMinutes).toBe(60);
    });
  });

  describe('getAppointments', () => {
    it('should return appointments ordered by scheduledAt ASC', async () => {
      jest.spyOn(appointmentRepo, 'find').mockResolvedValue([mockAppointment as any]);

      const result = await service.getAppointments('customer-1');

      expect(result).toHaveLength(1);
      expect(appointmentRepo.find).toHaveBeenCalledWith({
        where: { customerId: 'customer-1' },
        order: { scheduledAt: 'ASC' },
      });
    });
  });

  describe('cancelAppointment', () => {
    it('should cancel appointment with reason', async () => {
      const cancelledApt = { ...mockAppointment, status: 'cancelled', cancelledAt: new Date(), cancelReason: 'Schedule conflict' };
      jest.spyOn(appointmentRepo, 'findOne').mockResolvedValue(mockAppointment as any);
      jest.spyOn(appointmentRepo, 'save').mockImplementation((apt) => Promise.resolve(apt as any));

      const result = await service.cancelAppointment('apt-1', 'customer-1', 'Schedule conflict');

      expect(result.status).toBe('cancelled');
      expect(result.cancelReason).toBe('Schedule conflict');
      expect(result.cancelledAt).toBeDefined();
    });

    it('should use default cancellation reason', async () => {
      const cancelledApt = { ...mockAppointment, status: 'cancelled', cancelledAt: new Date(), cancelReason: 'User cancelled' };
      jest.spyOn(appointmentRepo, 'findOne').mockResolvedValue(mockAppointment as any);
      jest.spyOn(appointmentRepo, 'save').mockImplementation((apt) => Promise.resolve(apt as any));

      const result = await service.cancelAppointment('apt-1', 'customer-1');

      expect(result.cancelReason).toBe('User cancelled');
    });

    it('should throw error if appointment not found', async () => {
      jest.spyOn(appointmentRepo, 'findOne').mockResolvedValue(null);

      await expect(service.cancelAppointment('apt-999', 'customer-1'))
        .rejects.toThrow('Appointment not found');
    });
  });
});
