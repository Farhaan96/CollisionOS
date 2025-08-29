/**
 * Unit Tests for Insurance Integration Service
 * Tests insurance provider integrations and claim/estimate handling
 */

const {
  InsuranceProvider,
  MitchellProvider,
  CCCProvider,
  AudatexProvider,
  InsuranceIntegrationService
} = require('../../server/services/insuranceIntegration');
const { ValidationError, APIError } = require('../../server/utils/errorHandler');
const { Job } = require('../../server/database/models');

// Mock database models
jest.mock('../../server/database/models', () => ({
  Job: {
    update: jest.fn()
  }
}));

// Mock real-time service
jest.mock('../../server/services/realtimeService', () => ({
  realtimeService: {
    broadcastInsuranceUpdate: jest.fn(),
    broadcastJobUpdate: jest.fn()
  }
}));

describe('Insurance Integration', () => {
  describe('InsuranceProvider', () => {
    let provider;

    beforeEach(() => {
      provider = new InsuranceProvider({
        name: 'Test Insurance',
        baseURL: 'https://api.testinsurance.com',
        authType: 'apikey',
        credentials: { apiKey: 'test-key' }
      });
      
      // Mock HTTP methods
      provider.post = jest.fn();
      provider.get = jest.fn();
      
      jest.clearAllMocks();
    });

    describe('Claim Data Validation', () => {
      test('should validate required claim fields', () => {
        const invalidClaimData = {
          customerInfo: { firstName: 'John' }
          // Missing required fields
        };

        const validation = provider.validateClaimData(invalidClaimData);
        
        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain('Policy number is required');
        expect(validation.errors).toContain('Date of loss is required');
        expect(validation.errors).toContain('Vehicle information is required');
        expect(validation.errors).toContain('Damage description is required');
      });

      test('should pass validation with complete claim data', () => {
        const validClaimData = {
          policyNumber: 'POL-123456',
          dateOfLoss: '2024-01-15',
          customerInfo: { firstName: 'John', lastName: 'Doe' },
          vehicleInfo: { vin: '1HGBH41JXMN109186', year: 2021 },
          damageDescription: 'Front end damage'
        };

        const validation = provider.validateClaimData(validClaimData);
        
        expect(validation.isValid).toBe(true);
        expect(validation.errors).toHaveLength(0);
      });
    });

    describe('Estimate Data Validation', () => {
      test('should validate required estimate fields', () => {
        const invalidEstimateData = {
          // Missing required fields
        };

        const validation = provider.validateEstimateData(invalidEstimateData);
        
        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain('Claim number is required');
        expect(validation.errors).toContain('Repair items are required');
        expect(validation.errors).toContain('Total amount is required');
      });

      test('should pass validation with complete estimate data', () => {
        const validEstimateData = {
          claimNumber: 'CLM-123456',
          repairItems: [{ description: 'Replace bumper', amount: 500 }],
          totalAmount: 500
        };

        const validation = provider.validateEstimateData(validEstimateData);
        
        expect(validation.isValid).toBe(true);
        expect(validation.errors).toHaveLength(0);
      });
    });

    describe('Claim Submission', () => {
      test('should submit valid claim successfully', async () => {
        const claimData = {
          policyNumber: 'POL-123456',
          dateOfLoss: '2024-01-15',
          customerInfo: { firstName: 'John', lastName: 'Doe' },
          vehicleInfo: { vin: '1HGBH41JXMN109186', year: 2021 },
          damageDescription: 'Front end damage',
          jobId: 'job-123'
        };

        const mockResponse = {
          claimNumber: 'CLM-789012',
          status: 'submitted'
        };

        provider.post.mockResolvedValue(mockResponse);
        Job.update.mockResolvedValue([1]);

        const result = await provider.submitClaim(claimData);

        expect(provider.post).toHaveBeenCalledWith('/claims', claimData);
        expect(Job.update).toHaveBeenCalledWith(
          { 
            insuranceClaimNumber: 'CLM-789012',
            claimStatus: 'submitted'
          },
          { where: { id: 'job-123' } }
        );
        expect(result).toEqual(mockResponse);
      });

      test('should throw validation error for invalid claim data', async () => {
        const invalidClaimData = {
          customerInfo: { firstName: 'John' }
          // Missing required fields
        };

        await expect(provider.submitClaim(invalidClaimData))
          .rejects.toThrow(ValidationError);
      });
    });

    describe('Estimate Submission', () => {
      test('should submit valid estimate successfully', async () => {
        const estimateData = {
          claimNumber: 'CLM-123456',
          repairItems: [{ description: 'Replace bumper', amount: 500 }],
          totalAmount: 500,
          jobId: 'job-123'
        };

        const mockResponse = {
          estimateId: 'EST-456789',
          status: 'submitted'
        };

        provider.post.mockResolvedValue(mockResponse);
        Job.update.mockResolvedValue([1]);

        const result = await provider.submitEstimate(estimateData);

        expect(provider.post).toHaveBeenCalledWith('/estimates', estimateData);
        expect(Job.update).toHaveBeenCalledWith(
          { 
            estimateStatus: 'submitted',
            estimateSubmittedAt: expect.any(Date)
          },
          { where: { id: 'job-123' } }
        );
        expect(result).toEqual(mockResponse);
      });

      test('should throw validation error for invalid estimate data', async () => {
        const invalidEstimateData = {};

        await expect(provider.submitEstimate(invalidEstimateData))
          .rejects.toThrow(ValidationError);
      });
    });

    describe('Status Queries', () => {
      test('should get claim status', async () => {
        const mockResponse = {
          claimNumber: 'CLM-123456',
          status: 'under_review'
        };

        provider.get.mockResolvedValue(mockResponse);

        const result = await provider.getClaimStatus('CLM-123456');

        expect(provider.get).toHaveBeenCalledWith('/claims/CLM-123456');
        expect(result).toEqual(mockResponse);
      });

      test('should get estimate status', async () => {
        const mockResponse = {
          estimateId: 'EST-456789',
          status: 'approved'
        };

        provider.get.mockResolvedValue(mockResponse);

        const result = await provider.getEstimateStatus('EST-456789');

        expect(provider.get).toHaveBeenCalledWith('/estimates/EST-456789');
        expect(result).toEqual(mockResponse);
      });
    });
  });

  describe('MitchellProvider', () => {
    let provider;

    beforeEach(() => {
      provider = new MitchellProvider({
        accessToken: 'test-token',
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret'
      });
    });

    test('should format claim data for Mitchell API', () => {
      const claimData = {
        policyNumber: 'POL-123456',
        effectiveDate: '2024-01-01',
        expirationDate: '2024-12-31',
        dateOfLoss: '2024-06-15',
        damageDescription: 'Front collision',
        lossLocation: 'Main St & Oak Ave',
        vehicleInfo: {
          vin: '1HGBH41JXMN109186',
          year: 2021,
          make: 'Honda',
          model: 'Accord',
          mileage: 25000
        },
        customerInfo: {
          firstName: 'John',
          lastName: 'Doe',
          phone: '555-1234',
          email: 'john@example.com',
          address: '123 Main St, Anytown, ST 12345'
        }
      };

      const formatted = provider.formatClaimData(claimData);

      expect(formatted).toHaveProperty('Policy');
      expect(formatted.Policy.PolicyNumber).toBe('POL-123456');
      expect(formatted).toHaveProperty('Claim');
      expect(formatted.Claim.LossDate).toBe('2024-06-15');
      expect(formatted).toHaveProperty('Vehicle');
      expect(formatted.Vehicle.VIN).toBe('1HGBH41JXMN109186');
      expect(formatted).toHaveProperty('Insured');
      expect(formatted.Insured.FirstName).toBe('John');
    });

    test('should format estimate data for Mitchell API', () => {
      const estimateData = {
        claimNumber: 'CLM-123456',
        totalAmount: 2500.00,
        laborTotal: 1500.00,
        partsTotal: 1000.00,
        repairItems: [
          {
            lineNumber: 1,
            description: 'Replace front bumper',
            laborHours: 3.5,
            laborRate: 85.00,
            partsAmount: 450.00
          }
        ]
      };

      const formatted = provider.formatEstimateData(estimateData);

      expect(formatted.ClaimNumber).toBe('CLM-123456');
      expect(formatted.EstimateTotal).toBe(2500.00);
      expect(formatted.RepairItems).toHaveLength(1);
      expect(formatted.RepairItems[0].LineNumber).toBe(1);
    });
  });

  describe('CCCProvider', () => {
    let provider;

    beforeEach(() => {
      provider = new CCCProvider({
        apiKey: 'test-api-key'
      });
    });

    test('should format claim data for CCC API', () => {
      const claimData = {
        policyNumber: 'POL-123456',
        dateOfLoss: '2024-06-15',
        damageDescription: 'Front collision',
        vehicleInfo: {
          vin: '1HGBH41JXMN109186',
          year: 2021,
          make: 'Honda',
          model: 'Accord'
        },
        customerInfo: {
          firstName: 'John',
          lastName: 'Doe',
          phone: '555-1234',
          email: 'john@example.com'
        }
      };

      const formatted = provider.formatClaimData(claimData);

      expect(formatted).toHaveProperty('claim');
      expect(formatted.claim.policy_number).toBe('POL-123456');
      expect(formatted.claim.loss_date).toBe('2024-06-15');
      expect(formatted.claim.vehicle.vin).toBe('1HGBH41JXMN109186');
      expect(formatted.claim.customer.first_name).toBe('John');
      expect(formatted.claim.customer.contact_info.email).toBe('john@example.com');
    });
  });

  describe('AudatexProvider', () => {
    let provider;

    beforeEach(() => {
      provider = new AudatexProvider({
        username: 'test-user',
        password: 'test-pass'
      });
    });

    test('should convert estimate data to XML format', () => {
      const estimateData = {
        claimNumber: 'CLM-123456',
        totalAmount: 2500.00,
        repairItems: [
          { description: 'Replace bumper', amount: 500 },
          { description: 'Paint repair', amount: 200 }
        ]
      };

      const xml = provider.convertToXML(estimateData);

      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(xml).toContain('<ClaimNumber>CLM-123456</ClaimNumber>');
      expect(xml).toContain('<TotalAmount>2500</TotalAmount>');
      expect(xml).toContain('<Description>Replace bumper</Description>');
      expect(xml).toContain('<Amount>500</Amount>');
    });

    test('should submit estimate with XML content type', async () => {
      const estimateData = {
        claimNumber: 'CLM-123456',
        totalAmount: 2500.00,
        repairItems: []
      };

      provider.post = jest.fn().mockResolvedValue('<?xml version="1.0"?><response><status>submitted</status></response>');
      provider.parseXMLResponse = jest.fn().mockReturnValue({ status: 'submitted', estimateId: 'AUD-123' });

      const result = await provider.submitEstimate(estimateData);

      expect(provider.post).toHaveBeenCalledWith(
        '/estimates',
        expect.stringContaining('<?xml'),
        { headers: { 'Content-Type': 'application/xml' } }
      );
      expect(result).toEqual({ status: 'submitted', estimateId: 'AUD-123' });
    });
  });

  describe('InsuranceIntegrationService', () => {
    let service;
    let mockProvider;

    beforeEach(() => {
      service = new InsuranceIntegrationService();
      mockProvider = {
        submitClaim: jest.fn(),
        submitEstimate: jest.fn(),
        getClaimStatus: jest.fn(),
        getEstimateStatus: jest.fn(),
        healthCheck: jest.fn()
      };
      
      jest.clearAllMocks();
    });

    test('should register provider successfully', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      service.registerProvider('test-provider', mockProvider);
      
      expect(service.providers.has('test-provider')).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith('✅ Insurance provider registered: test-provider');
      
      consoleSpy.mockRestore();
    });

    test('should get provider', () => {
      service.registerProvider('test-provider', mockProvider);
      
      const provider = service.getProvider('test-provider');
      expect(provider).toBe(mockProvider);
    });

    test('should throw error for non-existent provider', () => {
      expect(() => {
        service.getProvider('non-existent');
      }).toThrow(APIError);
    });

    test('should submit claim via provider', async () => {
      const claimData = { policyNumber: 'POL-123' };
      const expectedResponse = { claimNumber: 'CLM-456' };
      
      mockProvider.submitClaim.mockResolvedValue(expectedResponse);
      service.registerProvider('test-provider', mockProvider);
      
      const result = await service.submitClaim('test-provider', claimData);
      
      expect(mockProvider.submitClaim).toHaveBeenCalledWith(claimData);
      expect(result).toEqual(expectedResponse);
    });

    test('should submit estimate via provider', async () => {
      const estimateData = { claimNumber: 'CLM-123' };
      const expectedResponse = { estimateId: 'EST-789' };
      
      mockProvider.submitEstimate.mockResolvedValue(expectedResponse);
      service.registerProvider('test-provider', mockProvider);
      
      const result = await service.submitEstimate('test-provider', estimateData);
      
      expect(mockProvider.submitEstimate).toHaveBeenCalledWith(estimateData);
      expect(result).toEqual(expectedResponse);
    });

    test('should get claim status via provider', async () => {
      const expectedResponse = { claimNumber: 'CLM-123', status: 'approved' };
      
      mockProvider.getClaimStatus.mockResolvedValue(expectedResponse);
      service.registerProvider('test-provider', mockProvider);
      
      const result = await service.getClaimStatus('test-provider', 'CLM-123');
      
      expect(mockProvider.getClaimStatus).toHaveBeenCalledWith('CLM-123');
      expect(result).toEqual(expectedResponse);
    });

    test('should get all providers', () => {
      service.registerProvider('provider1', mockProvider);
      service.registerProvider('provider2', mockProvider);
      
      const providers = service.getProviders();
      
      expect(providers).toEqual(['provider1', 'provider2']);
    });

    test('should set default provider', () => {
      service.registerProvider('test-provider', mockProvider);
      
      service.setDefaultProvider('test-provider');
      
      expect(service.defaultProvider).toBe('test-provider');
    });

    test('should throw error when setting non-existent default provider', () => {
      expect(() => {
        service.setDefaultProvider('non-existent');
      }).toThrow(APIError);
    });

    test('should health check all providers', async () => {
      const provider1 = { healthCheck: jest.fn().mockResolvedValue({ status: 'healthy' }) };
      const provider2 = { healthCheck: jest.fn().mockResolvedValue({ status: 'healthy' }) };
      
      service.registerProvider('provider1', provider1);
      service.registerProvider('provider2', provider2);
      
      const results = await service.healthCheck();
      
      expect(results.provider1.status).toBe('healthy');
      expect(results.provider2.status).toBe('healthy');
    });

    test('should handle health check errors', async () => {
      const failingProvider = { 
        healthCheck: jest.fn().mockRejectedValue(new Error('Connection failed'))
      };
      
      service.registerProvider('failing-provider', failingProvider);
      
      const results = await service.healthCheck();
      
      expect(results['failing-provider'].status).toBe('error');
      expect(results['failing-provider'].error).toBe('Connection failed');
    });

    test('should get service statistics', () => {
      service.registerProvider('provider1', mockProvider);
      service.registerProvider('provider2', mockProvider);
      service.setDefaultProvider('provider1');
      
      const stats = service.getStatistics();
      
      expect(stats.totalProviders).toBe(2);
      expect(stats.defaultProvider).toBe('provider1');
      expect(stats.providers).toEqual(['provider1', 'provider2']);
    });

    describe('Webhook Handlers', () => {
      test('should handle claim status update', async () => {
        const payload = {
          claimNumber: 'CLM-123456',
          status: 'approved',
          updatedAt: new Date().toISOString()
        };

        Job.update.mockResolvedValue([1]);

        const result = await service.handleClaimStatusUpdate('test-provider', payload);

        expect(Job.update).toHaveBeenCalledWith(
          {
            claimStatus: 'approved',
            claimUpdatedAt: expect.any(Date)
          },
          {
            where: { insuranceClaimNumber: 'CLM-123456' }
          }
        );
        expect(result.success).toBe(true);
      });

      test('should handle estimate approval', async () => {
        const payload = {
          estimateId: 'EST-789012',
          status: 'approved',
          approvedAmount: 2500.00,
          notes: 'Approved with conditions'
        };

        const mockJob = {
          id: 'job-123',
          update: jest.fn().mockResolvedValue()
        };

        const Job = require('../../server/database/models').Job;
        Job.findOne = jest.fn().mockResolvedValue(mockJob);

        const result = await service.handleEstimateApproval('test-provider', payload);

        expect(mockJob.update).toHaveBeenCalledWith({
          estimateStatus: 'approved',
          approvedAmount: 2500.00,
          approvalNotes: 'Approved with conditions',
          estimateApprovedAt: expect.any(Date)
        });
        expect(result.success).toBe(true);
      });
    });
  });
});