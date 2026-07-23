import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { EnrollmentService } from '../services/enrollment.service';

@ApiTags('loyalty')
@Controller('v1/loyalty/customer/segment')
export class SegmentController {
  constructor(private readonly enrollmentService: EnrollmentService) {}

  @Post()
  @ApiOperation({ summary: 'Segmentación por comportamiento' })
  async segmentCustomers(@Body('customerIds') customerIds: string[]) {
    // Placeholder - lógica de segmentación basada en comportamiento
    const segments: Record<string, { segment: string; score: number }> = {};
    
    for (const customerId of customerIds) {
      const balance = await this.enrollmentService.getBalance(customerId);
      
      let segment = 'bronze';
      if (balance.totalAvailable >= 10000) segment = 'diamond';
      else if (balance.totalAvailable >= 5000) segment = 'platinum';
      else if (balance.totalAvailable >= 1000) segment = 'gold';
      else if (balance.totalAvailable >= 100) segment = 'silver';
      
      segments[customerId] = {
        segment,
        score: balance.totalAvailable,
      };
    }

    return segments;
  }

  @Get('/multipliers')
  @ApiOperation({ summary: 'Multiplicadores bonus actuales' })
  async getCurrentMultipliers() {
    // Placeholder - retornaría multiplicadores activos de promociones
    return [
      { category: 'dining', multiplier: 2 },
      { category: 'travel', multiplier: 3 },
      { category: 'gas', multiplier: 2 },
    ];
  }

  @Get('/expiring-soon')
  @ApiOperation({ summary: 'Alerta puntos próximos a vencer' })
  async getExpiringPoints(@Body('customerId') customerId: string) {
    const balance = await this.enrollmentService.getBalance(customerId);
    return {
      customerId,
      expiringSoon: balance.totalExpiringSoon,
      recommendation: balance.totalExpiringSoon > 0 ? 'Canjea tus puntos antes de que venzan' : 'Sin puntos por vencer',
    };
  }
}
