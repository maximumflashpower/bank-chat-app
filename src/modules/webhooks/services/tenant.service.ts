import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant, TenantStatus, TenantPlan } from '../entities/tenant.entity';

@Injectable()
export class TenantService {
  constructor(
    @InjectRepository(Tenant)
    private tenantRepo: Repository<Tenant>,
  ) {}

  async listTenants(): Promise<Tenant[]> {
    return this.tenantRepo.find();
  }

  async getTenant(tenantId: string): Promise<Tenant> {
    const tenant = await this.tenantRepo.findOne({ where: { id: tenantId } });
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    return tenant;
  }

  async createTenant(data: Partial<Tenant>): Promise<Tenant> {
    const tenant = this.tenantRepo.create({
      name: data.name,
      slug: data.slug || (data.name ? this.generateSlug(data.name) : ''),
      plan: data.plan || TenantPlan.FREE,
      config: data.config || {},
      region: data.region || 'us-east-1',
      status: TenantStatus.ACTIVE,
    });

    return this.tenantRepo.save(tenant);
  }

  async suspendTenant(tenantId: string): Promise<Tenant> {
    const tenant = await this.getTenant(tenantId);
    tenant.status = TenantStatus.SUSPENDED;
    tenant.suspendedAt = new Date();
    return this.tenantRepo.save(tenant);
  }

  async activateTenant(tenantId: string): Promise<Tenant> {
    const tenant = await this.getTenant(tenantId);
    tenant.status = TenantStatus.ACTIVE;
    tenant.suspendedAt = null;
    return this.tenantRepo.save(tenant);
  }

  async getUsageStats(tenantId: string): Promise<{
    monthlyRequests: number;
    totalRequests: number;
    webhookDeliveries: number;
    apiKeysActive: number;
  }> {
    const tenant = await this.getTenant(tenantId);
    return {
      monthlyRequests: tenant.monthlyRequests,
      totalRequests: tenant.totalRequests,
      webhookDeliveries: 0, // Will be tracked separately
      apiKeysActive: 0, // Will be tracked separately
    };
  }

  async exportTenantData(tenantId: string): Promise<{ exportedAt: Date; data: Record<string, unknown> }> {
    const tenant = await this.getTenant(tenantId);
    return {
      exportedAt: new Date(),
      data: {
        tenant: {
          id: tenant.id,
          name: tenant.name,
          plan: tenant.plan,
          createdAt: tenant.createdAt,
        },
        settings: tenant.config,
      },
    };
  }

  private generateSlug(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').substring(0, 50);
  }

  async updateTenantConfig(tenantId: string, config: Record<string, unknown>): Promise<Tenant> {
    const tenant = await this.getTenant(tenantId);
    tenant.config = { ...tenant.config, ...config };
    return this.tenantRepo.save(tenant);
  }

  async trackRequest(tenantId: string): Promise<void> {
    const tenant = await this.getTenant(tenantId);
    tenant.monthlyRequests += 1;
    tenant.totalRequests += 1;
    await this.tenantRepo.save(tenant);
  }
}
