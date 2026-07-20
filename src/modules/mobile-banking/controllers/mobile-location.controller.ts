import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { LocationService } from '../services/location.service';
import { AuthGuard } from '@nestjs/passport';

interface SearchLocationsDto {
  latitude?: number;
  longitude?: number;
  city?: string;
  postalCode?: string;
  limit?: number;
  locationType?: string;
}

interface AppointmentDto {
  branchId: string;
  advisorName?: string;
  appointmentType: string;
  scheduledAt: string;
  durationMinutes?: number;
  notes?: string;
}

@Controller('api/v1/mobile')
@UseGuards(AuthGuard('jwt'))
export class MobileLocationController {
  constructor(private readonly locationService: LocationService) {}

  @Get('/atm/locator')
  async searchLocations(@Query() query: SearchLocationsDto) {
    return this.locationService.searchLocations(query);
  }

  @Get('/atm/locator/:id/details')
  async getLocationDetails(@Param('id') id: string) {
    return this.locationService.getLocationById(id);
  }

  @Post('/appointment/schedule')
  async scheduleAppointment(@Body() dto: AppointmentDto) {
    const customerId = 'customer-from-jwt';
    return this.locationService.createAppointment({
      customerId,
      ...dto,
      scheduledAt: new Date(dto.scheduledAt),
    });
  }

  @Get('/appointments/list')
  async getAppointments() {
    const customerId = 'customer-from-jwt';
    return this.locationService.getAppointments(customerId);
  }

  @Delete('/appointment/:id')
  async cancelAppointment(@Param('id') id: string, @Body('reason') reason?: string) {
    const customerId = 'customer-from-jwt';
    return this.locationService.cancelAppointment(id, customerId, reason);
  }
}
