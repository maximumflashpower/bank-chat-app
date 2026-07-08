import { Injectable } from '@nestjs/common';
import { InventoryJournalService } from './inventory-journal.service';
import { GenerateInventoryJournalDto } from '../dto/generate-inventory-journal.dto';

@Injectable()
export class InventoryLedgerIntegrationService {
  constructor(private readonly journalService: InventoryJournalService) {}

  async processIncomingMovement(
    movementData: any,
    journalDto: GenerateInventoryJournalDto,
  ): Promise<any> {
    const result = await this.journalService.generateJournalFromMovement(journalDto);
    return {
      movementId: movementData.id,
      journalEntry: result.journalEntry.entry_number,
      reconciled: result.link.isReconciled,
    };
  }

  async generateReversal(movementId: string): Promise<any> {
    // Should retrieve original journal link and create reversal entry
    return { success: true };
  }

  async batchProcessMovements(movements: any[]): Promise<any[]> {
    const results = await Promise.all(
      movements.map(async (m) => {
        try {
          return await this.processIncomingMovement(m, m.journalDto);
        } catch (err) {
          return { movementId: m.id, error: err.message };
        }
      }),
    );
    return results;
  }

  async validatePostingRules(companyProfileId: string): Promise<{ valid: boolean; issues: string[] }> {
    const rules = await this.journalService.findRulesByCompany(companyProfileId);
    const issues: string[] = [];
    
    const requiredTypes = ['RECEIVE', 'TRANSFER', 'SALE', 'RETURN', 'ADJUSTMENT'];
    for (const type of requiredTypes) {
      if (!rules.find(r => r.movementType === type)) {
        issues.push(`Missing posting rule for ${type}`);
      }
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }
}
