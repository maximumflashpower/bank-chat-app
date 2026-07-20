import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MobileAtmLocator } from '../entities/mobile-atm-locator.entity';
import { MobileAppointment } from '../entities/mobile-appointment.entity';

interface LocationSearchInput {
  latitude?: number;
  longitude?: number;
  city?: string;
  postalCode?: string;
  limit?: number;
  locationType?: string;
}

interface AppointmentInput {
  customerId: string;
  branchId: string;
  advisorName?: string;
  appointmentType: string;
  scheduledAt: Date;
  durationMinutes?: number;
  notes?: string;
}

@Injectable()
export class LocationService {
  constructor(
    @InjectRepository(MobileAtmLocator)
    private readonly locatorRepo: Repository<MobileAtmLocator>,
    @InjectRepository(MobileAppointment)
    private readonly appointmentRepo: Repository<MobileAppointment>,
  ) {}

  async searchLocations(input: LocationSearchInput): Promise<MobileAtmLocator[]> {
    const queryBuilder = this.locatorRepo.createQueryBuilder('loc').where('1=1');

    if (input.city) {
      queryBuilder.andWhere('loc.city ILIKE :city', { city: `%${input.city}%` });
    }

    if (input.postalCode) {
      queryBuilder.andWhere('loc.postal_code LIKE :postalCode', { postalCode: `${input.postalCode}%` });
    }

    if (input.locationType) {
      queryBuilder.andWhere('loc.location_type = :locationType', { locationType: input.locationType });
    }

    if (input.latitude && input.longitude) {
      queryBuilder.addSelect(`SQRT(POW(69.1 * (loc.latitude - ${input.latitude}), 2) + POW(69.1 * (${input.longitude} - loc.longitude) * COS(loc.latitude / 57.3), 2)) AS distance_km`)
        .orderBy('distance_km', 'ASC');
    } else {
      queryBuilder.orderBy('loc.name', 'ASC');
    }

    queryBuilder.limit(input.limit ?? 20);

    const locations = await queryBuilder.getRawMany();

    return locations;
  }

  async getLocationById(locationId: string): Promise<MobileAtmLocator> {
    const loc = await this.locatorRepo.findOne({ where: { id: locationId } });
    if (!loc) throw new Error('Location not found');
    return loc;
  }

  async createAppointment(input: AppointmentInput): Promise<MobileAppointment> {
    const apt = new MobileAppointment();
    apt.customerId = input.customerId;
    apt.branchId = input.branchId;
    
    if (input.advisorName) apt.advisorName = input.advisorName;
    
    apt.appointmentType = input.appointmentType;
    apt.scheduledAt = input.scheduledAt;
    apt.durationMinutes = input.durationMinutes ?? 60;
    
    if (input.notes) apt.notes = input.notes;
    
    apt.status = 'scheduled';

    return this.appointmentRepo.save(apt);
  }

  async getAppointments(customerId: string): Promise<MobileAppointment[]> {
    return this.appointmentRepo.find({
      where: { customerId },
      order: { scheduledAt: 'ASC' },
    });
  }

  async cancelAppointment(appointmentId: string, customerId: string, reason?: string): Promise<MobileAppointment> {
    const apt = await this.appointmentRepo.findOne({ where: { id: appointmentId, customerId } });
    if (!apt) throw new Error('Appointment not found');

    apt.status = 'cancelled';
    apt.cancelledAt = new Date();
    apt.cancelReason = reason ?? 'User cancelled';

    return this.appointmentRepo.save(apt);
  }
}
