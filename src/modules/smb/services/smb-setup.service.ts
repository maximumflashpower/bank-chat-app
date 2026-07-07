import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SmbCompanyProfile } from '../entities/smb-company-profile.entity';
import { SmbContactParty } from '../entities/smb-contact-party.entity';
import { CompanyProfileDto } from '../dto/company-profile.dto';
import { ImportContactsDto } from '../dto/import-contacts.dto';
import { BankConnectDto } from '../dto/bank-connect.dto';

@Injectable()
export class SmbSetupService {
  constructor(
    @InjectRepository(SmbCompanyProfile)
    private profileRepo: Repository<SmbCompanyProfile>,
    @InjectRepository(SmbContactParty)
    private contactRepo: Repository<SmbContactParty>,
  ) {}

  async startWizard(userId: string): Promise<SmbCompanyProfile> {
    const existing = await this.profileRepo.findOne({ where: { userId } });
    if (existing) return existing;

    const profile = this.profileRepo.create({
      userId,
      legalBusinessName: '',
      taxIdentificationNumber: '',
      businessStructureType: 'SoleProp',
      addressCountryCode: 'US',
      baseCurrency: 'USD',
      bankingTierPlan: 'FREE',
    });
    return this.profileRepo.save(profile);
  }

  async getProfile(userId: string): Promise<SmbCompanyProfile> {
    const profile = await this.profileRepo.findOne({ where: { userId } });
    if (!profile) throw new NotFoundException(`Profile for user ${userId} not found`);
    return profile;
  }

  async updateProfile(userId: string, dto: CompanyProfileDto): Promise<SmbCompanyProfile> {
    const profile = await this.getProfile(userId);
    Object.assign(profile, dto);
    return this.profileRepo.save(profile);
  }

  async completeOnboarding(userId: string): Promise<void> {
    await this.profileRepo.update({ userId }, { onboardCompletedAt: new Date() });
  }

  async importContacts(userId: string, dto: ImportContactsDto): Promise<{ imported: number; skipped: number }> {
    const profile = await this.getProfile(userId);
    let imported = 0;
    let skipped = 0;

    for (const contact of dto.contacts) {
      if (!contact.companyLegalName || !contact.partyType) {
        skipped++;
        continue;
      }
      const entity = this.contactRepo.create({
        ...contact,
        paymentTermsDaysDefault: contact.paymentTermsDaysDefault ?? 30,
        currencyPreference: contact.currencyPreference ?? profile.baseCurrency,
        isActive: true,
      });
      await this.contactRepo.save(entity);
      imported++;
    }

    return { imported, skipped };
  }

  async generateChartOfAccounts(profileId: string): Promise<{ generated: number; template: string }> {
    const profile = await this.profileRepo.findOne({ where: { id: profileId } });
    if (!profile) throw new NotFoundException(`Profile ${profileId} not found`);

    const template = this.selectIndustryTemplate(profile.industryCodeNaics || 'generic');
    return { generated: template.accounts.length, template: template.name };
  }

  private selectIndustryTemplate(industryCode: string): { name: string; accounts: string[] } {
    const templates: Record<string, string[]> = {
      generic: ['Cash', 'Accounts Receivable', 'Inventory', 'Equipment', 'Accounts Payable', 'Notes Payable', 'Common Stock', 'Retained Earnings'],
      retail: ['Cash', 'Inventory', 'COGS', 'Sales Revenue', 'Returns', 'Rent Expense', 'Utilities'],
      service: ['Cash', 'Accounts Receivable', 'Service Revenue', 'Salaries Expense', 'Office Supplies'],
    };

    const key = industryCode.startsWith('44') || industryCode.startsWith('45') ? 'retail' : 'service';
    return { name: key, accounts: templates[key] || templates.generic };
  }

  async configureTax(userId: string, taxRate: number, jurisdiction: string): Promise<{ configured: boolean; taxRate: number; jurisdiction: string }> {
    return { configured: true, taxRate, jurisdiction };
  }
}
