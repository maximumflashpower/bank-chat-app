import { Controller, Post, Get, Body, Logger } from '@nestjs/common';
import { ScreeningService } from '../services/screening.service';
import { EntityType } from '../entities/entity-type.enum';
import { ListSource } from '../entities/list-source.enum';

@Controller('api/v1/screening')
export class ScreeningController {
  private readonly logger = new Logger(ScreeningController.name);

  constructor(private readonly screeningService: ScreeningService) {}

  /** POST /api/v1/screening/check - Screening individual contra listas */
  @Post('check')
  async checkScreening(@Body() body: { entityName: string; entityType: EntityType; knownEntries: { name: string; aliases?: string[]; listSource: ListSource; entryId: string }[] }): Promise<any> {
    const result = await this.screeningService.checkScreening({
      entityName: body.entityName,
      entityType: body.entityType,
      knownEntries: body.knownEntries,
    });
    return {
      screeningId: result.id,
      entityName: result.entityName,
      matchScore: Number(result.matchScore),
      matchedName: result.matchedName,
      isBlocked: result.isBlocked,
      status: result.status,
    };
  }

  /** POST /api/v1/screening/batch - Screening masivo batch */
  @Post('batch')
  async batchScreening(@Body() body: { entities: { name: string; type: EntityType; knownEntries: any[] }[] }): Promise<any[]> {
    const results = await this.screeningService.batchScreening(body.entities);
    return results.map((r) => ({ screeningId: r.id, entityName: r.entityName, matchScore: Number(r.matchScore), isBlocked: r.isBlocked }));
  }

  /** GET /api/v1/screening/lists - Listar listas de sancionados activas */
  @Get('lists')
  async getActiveLists(): Promise<any[]> {
    const lists = await this.screeningService.getActiveLists();
    return lists.map((l) => ({ source: l.source, entryCount: l.entryCount, lastSyncedAt: l.lastSyncedAt, active: l.active }));
  }

  /** POST /api/v1/screening/lists/update - Actualizar listas desde fuente oficial */
  @Post('lists/update')
  async updateLists(@Body() body: { sources: ListSource[] }): Promise<{ synced: string[] }> {
    const sources = body.sources || Object.values(ListSource);
    const synced: string[] = [];
    for (const source of sources) {
      switch (source) {
        case ListSource.OFAC: await this.screeningService.syncOfacList(); synced.push('OFAC'); break;
        case ListSource.UN: await this.screeningService.syncUnList(); synced.push('UN'); break;
        case ListSource.EU: await this.screeningService.syncEuList(); synced.push('EU'); break;
        case ListSource.HMT: await this.screeningService.syncHmtList(); synced.push('HMT'); break;
        case ListSource.LOCAL: await this.screeningService.syncLocalList(); synced.push('LOCAL'); break;
      }
    }
    return { synced };
  }
}
