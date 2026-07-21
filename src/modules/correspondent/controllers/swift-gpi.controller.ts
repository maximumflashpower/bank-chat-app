import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SwiftGpiService } from '../services/swift-gpi.service';

@ApiTags('correspondent')
@Controller('api/v1/payments')
export class SwiftGpiController {
  constructor(private readonly gpiService: SwiftGpiService) {}

  @Post('/swift/gpi/tracker/:referenceId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear tracker GPI' })
  async createTracker(@Param('referenceId') referenceId: string) {
    const trackingId = await this.gpiService.createGpiTracker(referenceId);
    return { referenceId, trackingId };
  }

  @Get('/gpi/tracker/:trackingId')
  @ApiOperation({ summary: 'Status todos pagos GPI activos' })
  async getGpiStatus(@Param('trackingId') trackingId: string) {
    return this.gpiService.getGpiStatus(trackingId);
  }

  @Post('/gpi/tracker/:trackingId/update')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar estado GPI' })
  async updateGpiStatus(@Param('trackingId') trackingId: string, @Body() body: { status: string; notes?: string }) {
    await this.gpiService.updateGpiStatus(trackingId, body.status, body.notes);
    return { trackingId, updated: true };
  }

  @Post('/swift/send')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enviar mensaje Swift MT103' })
  async sendSwiftMT103(@Body() body: { instructionId: string }) {
    return this.gpiService.sendSwiftMessageMT103(body.instructionId);
  }

  @Post('/swift/incoming')
  @ApiOperation({ summary: 'Procesar mensaje Swift incoming' })
  async receiveSwiftMT103(@Body() body: { content: string }) {
    return this.gpiService.receiveSwiftMessageMT103(body.content);
  }

  @Get('/gpi/analytics')
  @ApiOperation({ summary: 'Analytics GPI' })
  async getAnalytics(@Body() body: { startDate: string; endDate: string }) {
    return this.gpiService.getGpiAnalytics(new Date(body.startDate), new Date(body.endDate));
  }
}
