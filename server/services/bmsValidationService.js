/**
 * BMS Validation Service (Simplified)
 * Basic validation for BMS processing and automated sourcing
 */

class BMSValidationService {
  constructor() {
    // Initialize validation service
  }

  /**
   * Validate BMS data for automated sourcing
   */
  async validateBMSData(bmsData, options = {}) {
    const result = {
      isValid: true,
      errors: [],
      warnings: [],
      info: [],
      automatedSourcingReady: false,
      recommendations: []
    };

    try {
      // Basic validation checks
      if (!bmsData.vehicle || !bmsData.vehicle.year) {
        result.errors.push({
          code: 'MISSING_VEHICLE_YEAR',
          message: 'Vehicle year is required',
          severity: 'critical'
        });
      }

      if (!bmsData.customer || !bmsData.customer.lastName) {
        result.errors.push({
          code: 'MISSING_CUSTOMER_NAME',
          message: 'Customer name is required',
          severity: 'critical'
        });
      }

      if (!bmsData.parts || bmsData.parts.length === 0) {
        result.warnings.push({
          code: 'NO_PARTS_FOUND',
          message: 'No parts found for sourcing',
          severity: 'warning'
        });
      }

      // Check VIN format
      if (bmsData.vehicle?.vin && bmsData.vehicle.vin.length !== 17) {
        result.warnings.push({
          code: 'INVALID_VIN_LENGTH',
          message: 'VIN should be 17 characters',
          severity: 'warning'
        });
      }

      result.isValid = result.errors.length === 0;
      result.automatedSourcingReady = result.isValid && bmsData.parts?.length > 0;

      // Add recommendations
      if (result.automatedSourcingReady) {
        result.recommendations.push({
          type: 'automation',
          action: 'enable_automated_sourcing',
          message: 'Data is ready for automated parts sourcing',
          priority: 'high'
        });
      }

      if (result.warnings.length > 0) {
        result.recommendations.push({
          type: 'enhancement',
          action: 'review_warnings',
          message: 'Review warnings to improve data quality',
          priority: 'medium'
        });
      }

      return result;

    } catch (error) {
      console.error('Validation error:', error);
      return {
        isValid: false,
        errors: [{
          code: 'VALIDATION_ERROR',
          message: error.message,
          severity: 'critical'
        }],
        warnings: [],
        info: [],
        automatedSourcingReady: false,
        recommendations: []
      };
    }
  }

  /**
   * Validate for automated sourcing readiness
   */
  validateForAutomatedSourcing(bmsData) {
    const errors = [];
    const warnings = [];

    if (!bmsData.vehicle?.year || !bmsData.vehicle?.make) {
      errors.push({
        code: 'INSUFFICIENT_VEHICLE_INFO',
        message: 'Vehicle year and make are required for sourcing',
        severity: 'critical'
      });
    }

    if (!bmsData.parts || bmsData.parts.length === 0) {
      errors.push({
        code: 'NO_PARTS_TO_SOURCE',
        message: 'No parts available for sourcing',
        severity: 'critical'
      });
    }

    const sourcingReadyParts = bmsData.parts?.filter(part => 
      part.description || part.partName
    ).length || 0;

    return {
      isValid: errors.length === 0,
      canProceedWithSourcing: errors.length === 0,
      errors,
      warnings,
      sourcingReadyParts
    };
  }
}

module.exports = { BMSValidationService };