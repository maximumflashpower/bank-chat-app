import { PrivacyByDesignService } from './privacy-by-design.service';

describe('PrivacyByDesignService', () => {
  let service: PrivacyByDesignService;

  beforeEach(() => {
    service = new PrivacyByDesignService();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getDefaultSettings', () => {
    it('should return settings with non-essential consents as false', () => {
      const result = service.getDefaultSettings();
      expect(result.settings.marketing).toBe(false);
      expect(result.settings.analytics).toBe(false);
      expect(result.settings.third_party_sharing).toBe(false);
      expect(result.settings.profiling).toBe(false);
      expect(result.settings.personalized_ads).toBe(false);
    });

    it('should return essential consents as true', () => {
      const result = service.getDefaultSettings();
      expect(result.settings.essential).toBe(true);
      expect(result.settings.security_monitoring).toBe(true);
      expect(result.settings.fraud_detection).toBe(true);
    });

    it('should include description and version', () => {
      const result = service.getDefaultSettings();
      expect(result.description).toBeTruthy();
      expect(result.version).toBeTruthy();
      expect(typeof result.version).toBe('string');
    });
  });

  describe('validateDataMinimization', () => {
    it('should return valid=true when no violations', () => {
      const fields = [
        { name: 'email', type: 'string', purpose: 'Account registration', required: true },
        { name: 'phone', type: 'string', purpose: 'Two-factor authentication', required: true },
      ];
      const result = service.validateDataMinimization('user_schema', fields);
      expect(result.valid).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('should flag sensitive fields as violations', () => {
      const fields = [
        { name: 'ssn', type: 'string', purpose: 'Identity verification', required: true },
        { name: 'biometric_hash', type: 'binary', purpose: 'Authentication', required: false },
      ];
      const result = service.validateDataMinimization('kyc_schema', fields);
      expect(result.violations.length).toBeGreaterThan(0);
      expect(result.violations.some(v => v.includes('ssn'))).toBe(true);
      expect(result.violations.some(v => v.includes('biometric_hash'))).toBe(true);
    });

    it('should flag fields with empty purpose', () => {
      const fields = [
        { name: 'nickname', type: 'string', purpose: '', required: false },
      ];
      const result = service.validateDataMinimization('profile_schema', fields);
      expect(result.violations.some(v => v.includes('nickname'))).toBe(true);
    });

    it('should recommend removing optional fields with short purpose', () => {
      const fields = [
        { name: 'avatar', type: 'binary', purpose: 'pic', required: false },
      ];
      const result = service.validateDataMinimization('profile_schema', fields);
      expect(result.recommendations.some(r => r.includes('avatar'))).toBe(true);
    });

    it('should not recommend removing optional fields with sufficient purpose', () => {
      const fields = [
        { name: 'avatar', type: 'binary', purpose: 'User profile picture for identification', required: false },
      ];
      const result = service.validateDataMinimization('profile_schema', fields);
      expect(result.recommendations.filter(r => r.includes('avatar'))).toHaveLength(0);
    });
  });

  describe('tagPurposeLimitation', () => {
    it('should tag fields with valid purposes as not restricted', () => {
      const fields = [
        { name: 'email', allowedPurposes: ['identity_verification', 'communication'] },
        { name: 'phone', allowedPurposes: ['service_delivery', 'security'] },
      ];
      const result = service.tagPurposeLimitation('user_schema', fields);
      expect(result.tagged).toHaveLength(2);
      expect(result.tagged[0].restricted).toBe(false);
      expect(result.tagged[1].restricted).toBe(false);
    });

    it('should mark fields with non-standard purposes as restricted', () => {
      const fields = [
        { name: 'purchase_history', allowedPurposes: ['profiling', 'targeted_ads'] },
      ];
      const result = service.tagPurposeLimitation('sales_schema', fields);
      expect(result.tagged[0].restricted).toBe(true);
    });

    it('should include summary with counts', () => {
      const fields = [
        { name: 'email', allowedPurposes: ['billing'] },
        { name: 'data', allowedPurposes: ['unknown_purpose'] },
      ];
      const result = service.tagPurposeLimitation('schema1', fields);
      expect(result.summary).toContain('2');
      expect(result.summary).toContain('1');
    });

    it('should handle mixed valid and invalid purposes on same field', () => {
      const fields = [
        { name: 'email', allowedPurposes: ['billing', 'unknown_purpose'] },
      ];
      const result = service.tagPurposeLimitation('mixed_schema', fields);
      expect(result.tagged[0].restricted).toBe(true);
      expect(result.tagged[0].allowedPurposes).toEqual(['billing', 'unknown_purpose']);
    });
  });
});
