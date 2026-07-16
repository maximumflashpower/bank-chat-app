import { Injectable } from '@nestjs/common';

/**
 * Data Masking Engine - Enmascaramiento dinámico y tokenización
 * Cubre funciones: DATAGOV-MASK-001 a 004
 */
@Injectable()
export class MaskingService {
  /**
   * DATAGOV-MASK-001: Dynamic Data Masking
   */
  maskEmail(email: string): string {
    if (!email || !email.includes('@')) return email;
    const [local, domain] = email.split('@');
    return `${this.maskPart(local)}@${domain}`;
  }

  maskPhone(phone: string): string {
    if (!phone) return phone;
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) return phone;
    return `***-${digits.slice(-3)}`;
  }

  maskSsn(ssn: string): string {
    if (!ssn) return ssn;
    const digits = ssn.replace(/\D/g, '');
    if (digits.length === 9) return `***-**-${digits.slice(4)}`;
    return ssn;
  }

  maskCardNumber(card: string): string {
    if (!card) return card;
    const digits = card.replace(/\D/g, '');
    if (digits.length >= 13) return `****-****-****-${digits.slice(-4)}`;
    return `****-****-****-${digits.slice(-4)}`;
  }

  /**
   * DATAGOV-MASK-002: Masking Rules by PII Type
   */
  maskByType(value: string, piiType: string): string {
    const lower = piiType.toLowerCase();

    switch (lower) {
      case 'email':
        return this.maskEmail(value);
      case 'phone':
        return this.maskPhone(value);
      case 'ssn':
        return this.maskSsn(value);
      case 'card':
        return this.maskCardNumber(value);
      case 'address':
        return this.maskAddress(value);
      case 'medical':
        return '[MEDICAL_DATA_MASKED]';
      default:
        return value;
    }
  }

  /**
   * DATAGOV-MASK-003: Format-Preserving Encryption (simplified)
   */
  formatPreservingEncrypt(value: string, key: string): string {
    if (!value || !key) return value;
    
    // Simulación simplificada de FPE
    // En producción usaría biblioteca criptográfica real
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let encrypted = '';
    const keyRepeat = key.repeat(Math.ceil(value.length / key.length));

    for (let i = 0; i < value.length; i++) {
      const char = value[i];
      const shift = keyRepeat.charCodeAt(i % keyRepeat.length) % chars.length;
      
      if (/\d/.test(char)) {
        encrypted += ((parseInt(char) + shift) % 10).toString();
      } else if (/[A-Za-z]/.test(char)) {
        const upper = char.toUpperCase();
        const idx = chars.indexOf(upper);
        const newIdx = (idx + shift) % chars.length;
        encrypted += char === upper ? chars[newIdx] : chars[newIdx].toLowerCase();
      } else {
        encrypted += char;
      }
    }

    return encrypted;
  }

  /**
   * DATAGOV-MASK-004: Tokenization Vault (interface)
   */
  tokenize(value: string, vaultId: string): string {
    if (!value) return value;
    
    // En producción: consultar vault externo para generar token
    // Aquí simulamos con hash determinista
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256').update(`${vaultId}:${value}`).digest('hex');
    return `TKN_${hash.substring(0, 16)}`;
  }

  detokenize(token: string, vaultId: string, originalValue: string): boolean {
    // En producción: validar contra vault
    const expectedToken = this.tokenize(originalValue, vaultId);
    return token === expectedToken;
  }

  /**
   * Helpers de masking
   */
  private maskPart(value: string): string {
    if (value.length <= 2) return '*'.repeat(value.length);
    return value.charAt(0) + '*'.repeat(value.length - 2) + value.slice(-1);
  }

  private maskAddress(address: string): string {
    if (!address) return address;
    const lines = address.split('\n');
    return lines.map(line => this.maskPart(line)).join('\n');
  }

  /**
   * Apply masking to entire dataset
   */
  maskDataset(data: Array<Record<string, unknown>>, fieldMappings: Record<string, string>): Array<Record<string, unknown>> {
    return data.map(row => {
      const masked = { ...row };

      for (const [field, piiType] of Object.entries(fieldMappings)) {
        if (masked[field]) {
          masked[field] = this.maskByType(String(masked[field]), piiType);
        }
      }

      return masked;
    });
  }
}
