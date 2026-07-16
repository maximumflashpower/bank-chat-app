import { Injectable, Logger } from '@nestjs/common';

/**
 * Data Security Service - Cifrado, RLS y control de acceso
 * Cubre funciones: DATAGOV-SEC-001 a 004
 */
@Injectable()
export class SecurityService {
  private readonly logger = new Logger(SecurityService.name);

  // Registry de políticas RLS en memoria (en producción: BD)
  private rlsPolicies: Map<string, { table: string; role: string; condition: string }> = new Map();
  private accessLog: Array<{ userId: string; entity: string; timestamp: Date; granted: boolean }> = [];

  /**
   * DATAGOV-SEC-001: Column-Level Encryption At-Rest
   */
  encryptColumn(value: string, columnKey: string): string {
    if (!value || !columnKey) return value;
    // Simulación: en producción usaría AES-256-GCM con KMS
    const crypto = require('crypto');
    const cipher = crypto.createCipher('aes-256-cbc', columnKey.padEnd(32, '0'));
    let encrypted = cipher.update(value, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `ENC:${encrypted}`;
  }

  decryptColumn(encryptedValue: string, columnKey: string): string {
    if (!encryptedValue || !encryptedValue.startsWith('ENC:')) return encryptedValue;
    // Simulación
    const crypto = require('crypto');
    const decipher = crypto.createDecipher('aes-256-cbc', columnKey.padEnd(32, '0'));
    let decrypted = decipher.update(encryptedValue.slice(4), 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  /**
   * DATAGOV-SEC-002: Row-Level Security (RLS) Policy
   */
  createRlsPolicy(table: string, role: string, condition: string): string {
    const policyId = `RLS_${table}_${role}_${Date.now()}`;
    this.rlsPolicies.set(policyId, { table, role, condition });
    this.logger.log(`Política RLS creada: ${policyId}, table=${table}, role=${role}`);
    return policyId;
  }

  evaluateRls(table: string, role: string, rowAttributes: Record<string, unknown>): boolean {
    for (const [, policy] of this.rlsPolicies) {
      if (policy.table === table && policy.role === role) {
        // Evaluación simplificada de condición
        if (policy.condition === '*' || policy.condition === 'true') return true;
        // En producción: evaluar expresión contra rowAttributes
        return true;
      }
    }
    return false;
  }

  async listRlsPolicies(): Promise<Array<{ id: string; table: string; role: string; condition: string }>> {
    return Array.from(this.rlsPolicies.entries()).map(([id, p]) => ({ id, ...p }));
  }

  /**
   * DATAGOV-SEC-003: Dynamic Query Access Control (ABAC)
   */
  evaluateAbac(userId: string, resource: string, action: string, attributes: Record<string, unknown>): boolean {
    const userRole = attributes['role'] as string;
    const resourceClassification = attributes['classification'] as string;

    // Reglas simples
    if (userRole === 'admin') return true;
    if (resourceClassification === 'public') return true;
    if (userRole === 'steward' && resourceClassification !== 'restricted') return true;
    if (action === 'read' && (resourceClassification === 'internal' || resourceClassification === 'confidential')) {
      return true;
    }

    return false;
  }

  /**
   * DATAGOV-SEC-004: Data Usage Audit Log
   */
  logAccess(userId: string, entity: string, granted: boolean): void {
    this.accessLog.push({
      userId,
      entity,
      timestamp: new Date(),
      granted,
    });

    this.logger.debug(`Access log: user=${userId}, entity=${entity}, granted=${granted}`);
  }

  getAccessLog(limit: number = 100): Array<{ userId: string; entity: string; timestamp: Date; granted: boolean }> {
    return this.accessLog.slice(-limit).reverse();
  }
}
