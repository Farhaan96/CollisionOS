/**
 * Insurance Company API Integration Service
 * Handles claims submission, estimate approvals, and status updates
 */

const { IntegrationClient } = require('./integrationFramework');
const { APIError, ValidationError } = require('../utils/errorHandler');
const { realtimeService } = require('./realtimeService');
const { Job } = require('../database/models');

/**
 * Generic Insurance Provider Client
 */
class InsuranceProvider extends IntegrationClient {
  constructor(config) {
    super({
      ...config,
      name: config.name || 'Insurance Provider',
    });
  }

  /**
   * Submit insurance claim
   */
  async submitClaim(claimData) {
    const validation = this.validateClaimData(claimData);
    if (!validation.isValid) {
      throw new ValidationError('Invalid claim data', validation.errors);
    }

    const formattedClaim = this.formatClaimData(claimData);
    const response = await this.post('/claims', formattedClaim);

    // Update job with claim number
    if (claimData.jobId && response.claimNumber) {
      await Job.update(
        {
          insuranceClaimNumber: response.claimNumber,
          claimStatus: 'submitted',
        },
        { where: { id: claimData.jobId } }
      );
    }

    return response;
  }

  /**
   * Submit estimate for approval
   */
  async submitEstimate(estimateData) {
    const validation = this.validateEstimateData(estimateData);
    if (!validation.isValid) {
      throw new ValidationError('Invalid estimate data', validation.errors);
    }

    const formattedEstimate = this.formatEstimateData(estimateData);
    const response = await this.post('/estimates', formattedEstimate);

    // Update job with estimate status
    if (estimateData.jobId) {
      await Job.update(
        {
          estimateStatus: 'submitted',
          estimateSubmittedAt: new Date(),
        },
        { where: { id: estimateData.jobId } }
      );
    }

    return response;
  }

  /**
   * Get claim status
   */
  async getClaimStatus(claimNumber) {
    const response = await this.get(`/claims/${claimNumber}`);
    return this.formatClaimStatus(response);
  }

  /**
   * Get estimate status
   */
  async getEstimateStatus(estimateId) {
    const response = await this.get(`/estimates/${estimateId}`);
    return this.formatEstimateStatus(response);
  }

  /**
   * Validate claim data (override in provider-specific classes)
   */
  validateClaimData(claimData) {
    const errors = [];

    if (!claimData.policyNumber) errors.push('Policy number is required');
    if (!claimData.dateOfLoss) errors.push('Date of loss is required');
    if (!claimData.customerInfo)
      errors.push('Customer information is required');
    if (!claimData.vehicleInfo) errors.push('Vehicle information is required');
    if (!claimData.damageDescription)
      errors.push('Damage description is required');

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate estimate data (override in provider-specific classes)
   */
  validateEstimateData(estimateData) {
    const errors = [];

    if (!estimateData.claimNumber) errors.push('Claim number is required');
    if (!estimateData.repairItems) errors.push('Repair items are required');
    if (!estimateData.totalAmount) errors.push('Total amount is required');

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Format claim data (override in provider-specific classes)
   */
  formatClaimData(claimData) {
    return claimData; // Default passthrough
  }

  /**
   * Format estimate data (override in provider-specific classes)
   */
  formatEstimateData(estimateData) {
    return estimateData; // Default passthrough
  }

  /**
   * Format claim status response
   */
  formatClaimStatus(response) {
    return response; // Default passthrough
  }

  /**
   * Format estimate status response
   */
  formatEstimateStatus(response) {
    return response; // Default passthrough
  }
}

/**
 * Mitchell International Integration
 */
class MitchellProvider extends InsuranceProvider {
  constructor(credentials) {
    super({
      name: 'Mitchell',
      baseURL: 'https://api.mitchell.com/v1',
      authType: 'oauth',
      credentials,
      timeout: 45000,
      retryAttempts: 3,
    });
  }

  formatClaimData(claimData) {
    return {
      Policy: {
        PolicyNumber: claimData.policyNumber,
        EffectiveDate: claimData.effectiveDate,
        ExpirationDate: claimData.expirationDate,
      },
      Claim: {
        LossDate: claimData.dateOfLoss,
        LossDescription: claimData.damageDescription,
        LossLocation: claimData.lossLocation,
      },
      Vehicle: {
        VIN: claimData.vehicleInfo.vin,
        Year: claimData.vehicleInfo.year,
        Make: claimData.vehicleInfo.make,
        Model: claimData.vehicleInfo.model,
        Mileage: claimData.vehicleInfo.mileage,
      },
      Insured: {
        FirstName: claimData.customerInfo.firstName,
        LastName: claimData.customerInfo.lastName,
        Phone: claimData.customerInfo.phone,
        Email: claimData.customerInfo.email,
        Address: claimData.customerInfo.address,
      },
    };
  }

  formatEstimateData(estimateData) {
    return {
      ClaimNumber: estimateData.claimNumber,
      EstimateTotal: estimateData.totalAmount,
      LaborTotal: estimateData.laborTotal,
      PartsTotal: estimateData.partsTotal,
      RepairItems: estimateData.repairItems.map(item => ({
        LineNumber: item.lineNumber,
        Description: item.description,
        LaborHours: item.laborHours,
        LaborRate: item.laborRate,
        PartsAmount: item.partsAmount,
      })),
    };
  }
}

/**
 * CCC Information Services Integration
 */
class CCCProvider extends InsuranceProvider {
  constructor(credentials) {
    super({
      name: 'CCC',
      baseURL: 'https://api.cccis.com/v2',
      authType: 'apikey',
      credentials,
      timeout: 30000,
    });
  }

  formatClaimData(claimData) {
    return {
      claim: {
        policy_number: claimData.policyNumber,
        loss_date: claimData.dateOfLoss,
        damage_description: claimData.damageDescription,
        vehicle: {
          vin: claimData.vehicleInfo.vin,
          year: claimData.vehicleInfo.year,
          make: claimData.vehicleInfo.make,
          model: claimData.vehicleInfo.model,
        },
        customer: {
          first_name: claimData.customerInfo.firstName,
          last_name: claimData.customerInfo.lastName,
          contact_info: {
            phone: claimData.customerInfo.phone,
            email: claimData.customerInfo.email,
          },
        },
      },
    };
  }
}

/**
 * Audatex Integration
 */
class AudatexProvider extends InsuranceProvider {
  constructor(credentials) {
    super({
      name: 'Audatex',
      baseURL: 'https://api.audatex.com/v1',
      authType: 'basic',
      credentials,
      timeout: 40000,
    });
  }

  async submitEstimate(estimateData) {
    // Audatex requires XML format
    const xmlData = this.convertToXML(estimateData);

    const response = await this.post('/estimates', xmlData, {
      headers: {
        'Content-Type': 'application/xml',
      },
    });

    return this.parseXMLResponse(response);
  }

  convertToXML(estimateData) {
    // Convert estimate data to Audatex XML format
    return `<?xml version="1.0" encoding="UTF-8"?>
    <Estimate>
      <ClaimNumber>${estimateData.claimNumber}</ClaimNumber>
      <TotalAmount>${estimateData.totalAmount}</TotalAmount>
      <RepairItems>
        ${estimateData.repairItems
          .map(
            item =>
              `<Item>
            <Description>${item.description}</Description>
            <Amount>${item.amount}</Amount>
          </Item>`
          )
          .join('')}
      </RepairItems>
    </Estimate>`;
  }

  parseXMLResponse(xmlResponse) {
    // Parse XML response (simplified - would use proper XML parser in production)
    return {
      status: 'submitted',
      estimateId: 'AUD-' + Date.now(),
    };
  }
}

/**
 * Insurance Integration Service
 */
class InsuranceIntegrationService {
  constructor() {
    this.providers = new Map();
    this.defaultProvider = null;
  }

  /**
   * Register insurance provider
   */
  registerProvider(name, provider) {
    this.providers.set(name, provider);

    // Set up webhook handlers
    this.setupWebhookHandlers(name, provider);

    console.log(`✅ Insurance provider registered: ${name}`);
  }

  /**
   * Set up webhook handlers for real-time updates
   */
  setupWebhookHandlers(providerName, provider) {
    const { integrationManager } = require('./integrationFramework');

    // Claim status updates
    integrationManager.registerWebhookHandler(
      providerName,
      'claim_status_update',
      async payload => {
        await this.handleClaimStatusUpdate(providerName, payload);
      }
    );

    // Estimate approval updates
    integrationManager.registerWebhookHandler(
      providerName,
      'estimate_approval',
      async payload => {
        await this.handleEstimateApproval(providerName, payload);
      }
    );
  }

  /**
   * Handle claim status update webhook
   */
  async handleClaimStatusUpdate(providerName, payload) {
    try {
      const { claimNumber, status, updatedAt } = payload;

      // Update job status
      await Job.update(
        {
          claimStatus: status,
          claimUpdatedAt: new Date(updatedAt),
        },
        {
          where: { insuranceClaimNumber: claimNumber },
        }
      );

      // Broadcast update
      realtimeService.broadcastInsuranceUpdate({
        provider: providerName,
        type: 'claim_status',
        claimNumber,
        status,
      });

      console.log(`📋 Claim status updated: ${claimNumber} -> ${status}`);

      return { success: true, claimNumber, status };
    } catch (error) {
      console.error('Error handling claim status update:', error);
      throw error;
    }
  }

  /**
   * Handle estimate approval webhook
   */
  async handleEstimateApproval(providerName, payload) {
    try {
      const { estimateId, status, approvedAmount, notes } = payload;

      // Update job with approval info
      const job = await Job.findOne({
        where: { estimateId },
      });

      if (job) {
        await job.update({
          estimateStatus: status,
          approvedAmount,
          approvalNotes: notes,
          estimateApprovedAt: new Date(),
        });

        // Broadcast update
        realtimeService.broadcastInsuranceUpdate({
          provider: providerName,
          type: 'estimate_approval',
          jobId: job.id,
          status,
          approvedAmount,
        });

        console.log(
          `💰 Estimate approved: ${estimateId} -> $${approvedAmount}`
        );
      }

      return { success: true, estimateId, status, approvedAmount };
    } catch (error) {
      console.error('Error handling estimate approval:', error);
      throw error;
    }
  }

  /**
   * Submit claim to insurance provider
   */
  async submitClaim(providerName, claimData) {
    const provider = this.getProvider(providerName);
    return await provider.submitClaim(claimData);
  }

  /**
   * Submit estimate to insurance provider
   */
  async submitEstimate(providerName, estimateData) {
    const provider = this.getProvider(providerName);
    return await provider.submitEstimate(estimateData);
  }

  /**
   * Get claim status
   */
  async getClaimStatus(providerName, claimNumber) {
    const provider = this.getProvider(providerName);
    return await provider.getClaimStatus(claimNumber);
  }

  /**
   * Get estimate status
   */
  async getEstimateStatus(providerName, estimateId) {
    const provider = this.getProvider(providerName);
    return await provider.getEstimateStatus(estimateId);
  }

  /**
   * Get provider instance
   */
  getProvider(name) {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new APIError(`Insurance provider '${name}' not found`, 404);
    }
    return provider;
  }

  /**
   * Get all registered providers
   */
  getProviders() {
    return Array.from(this.providers.keys());
  }

  /**
   * Set default provider
   */
  setDefaultProvider(name) {
    if (!this.providers.has(name)) {
      throw new APIError(`Provider '${name}' is not registered`, 404);
    }
    this.defaultProvider = name;
  }

  /**
   * Health check all providers
   */
  async healthCheck() {
    const results = {};

    for (const [name, provider] of this.providers) {
      try {
        results[name] = await provider.healthCheck();
      } catch (error) {
        results[name] = {
          status: 'error',
          error: error.message,
        };
      }
    }

    return results;
  }

  /**
   * Get statistics
   */
  getStatistics() {
    return {
      totalProviders: this.providers.size,
      defaultProvider: this.defaultProvider,
      providers: Array.from(this.providers.keys()),
    };
  }
}

// Export provider classes and service
module.exports = {
  InsuranceProvider,
  MitchellProvider,
  CCCProvider,
  AudatexProvider,
  InsuranceIntegrationService,
};
