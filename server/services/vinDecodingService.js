/**
 * VIN Decoding Service
 * Provides VIN decoding capabilities for enhanced parts matching
 */

const axios = require('axios');
const { APIError } = require('../utils/errorHandler');

class VINDecodingService {
  constructor() {
    // Configuration for VIN decoding APIs
    this.apiConfig = {
      nhtsa: {
        baseUrl: 'https://vpic.nhtsa.dot.gov/api/vehicles',
        timeout: 5000,
        enabled: true
      },
      // Additional providers can be added here
      fallback: {
        enabled: true,
        useLocalLookup: true
      }
    };

    // Cache decoded VINs for performance (1 hour TTL)
    this.vinCache = new Map();
    this.cacheTimeout = 60 * 60 * 1000; // 1 hour

    // Known VIN patterns and manufacturers
    this.vinPatterns = this.initializeVINPatterns();
  }

  /**
   * Decode VIN and return vehicle specifications
   * @param {string} vin - Vehicle Identification Number
   * @param {Object} options - Decoding options
   */
  async decodeVIN(vin, options = {}) {
    try {
      // Validate VIN format
      const validationResult = this.validateVIN(vin);
      if (!validationResult.isValid) {
        throw new Error(`Invalid VIN: ${validationResult.error}`);
      }

      const normalizedVIN = vin.toUpperCase().trim();

      // Check cache first
      if (this.vinCache.has(normalizedVIN)) {
        const cached = this.vinCache.get(normalizedVIN);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          console.log('Using cached VIN data for:', normalizedVIN);
          return {
            ...cached.data,
            source: 'cache',
            cached: true
          };
        }
      }

      // Try primary decoding method (NHTSA API)
      let decodedData = null;
      const decodingResults = {
        success: false,
        source: 'unknown',
        attempts: [],
        fallbackUsed: false
      };

      if (this.apiConfig.nhtsa.enabled) {
        try {
          decodedData = await this.decodeWithNHTSA(normalizedVIN);
          decodingResults.success = true;
          decodingResults.source = 'nhtsa';
          decodingResults.attempts.push({ method: 'nhtsa', success: true });
        } catch (nhtsaError) {
          console.warn('NHTSA VIN decoding failed:', nhtsaError.message);
          decodingResults.attempts.push({ 
            method: 'nhtsa', 
            success: false, 
            error: nhtsaError.message 
          });
        }
      }

      // Try fallback methods if primary failed
      if (!decodedData && this.apiConfig.fallback.enabled) {
        try {
          decodedData = await this.decodeWithFallback(normalizedVIN);
          decodingResults.success = true;
          decodingResults.source = 'fallback';
          decodingResults.fallbackUsed = true;
          decodingResults.attempts.push({ method: 'fallback', success: true });
        } catch (fallbackError) {
          console.warn('Fallback VIN decoding failed:', fallbackError.message);
          decodingResults.attempts.push({ 
            method: 'fallback', 
            success: false, 
            error: fallbackError.message 
          });
        }
      }

      if (!decodedData) {
        throw new Error('All VIN decoding methods failed');
      }

      // Enhance decoded data with additional processing
      const enhancedData = this.enhanceDecodedData(decodedData, normalizedVIN);
      
      // Cache the result
      this.vinCache.set(normalizedVIN, {
        timestamp: Date.now(),
        data: enhancedData
      });

      return {
        ...enhancedData,
        decodingResults,
        cached: false
      };

    } catch (error) {
      console.error('VIN decoding failed:', error);
      
      // Return basic information extracted from VIN pattern if possible
      const basicInfo = this.extractBasicVINInfo(vin);
      if (basicInfo) {
        return {
          ...basicInfo,
          decodingResults: {
            success: false,
            source: 'pattern_matching',
            error: error.message,
            fallbackUsed: true
          },
          reliable: false
        };
      }

      throw new APIError(`VIN decoding failed: ${error.message}`, 400);
    }
  }

  /**
   * Validate VIN format
   */
  validateVIN(vin) {
    if (!vin || typeof vin !== 'string') {
      return { isValid: false, error: 'VIN must be a non-empty string' };
    }

    const cleanVIN = vin.toUpperCase().trim();

    // Check length
    if (cleanVIN.length !== 17) {
      return { 
        isValid: false, 
        error: `VIN must be 17 characters long, got ${cleanVIN.length}` 
      };
    }

    // Check for invalid characters (I, O, Q are not allowed in VINs)
    const invalidChars = /[IOQ]/;
    if (invalidChars.test(cleanVIN)) {
      return { 
        isValid: false, 
        error: 'VIN contains invalid characters (I, O, Q not allowed)' 
      };
    }

    // Check for valid characters (alphanumeric except I, O, Q)
    const validPattern = /^[ABCDEFGHJKLMNPRSTUVWXYZ0123456789]{17}$/;
    if (!validPattern.test(cleanVIN)) {
      return { 
        isValid: false, 
        error: 'VIN contains invalid characters' 
      };
    }

    return { isValid: true };
  }

  /**
   * Decode VIN using NHTSA API
   */
  async decodeWithNHTSA(vin) {
    const url = `${this.apiConfig.nhtsa.baseUrl}/decodevinvalues/${vin}?format=json`;
    
    const response = await axios.get(url, {
      timeout: this.apiConfig.nhtsa.timeout,
      headers: {
        'User-Agent': 'CollisionOS-VIN-Decoder/1.0'
      }
    });

    if (!response.data || !response.data.Results || !response.data.Results[0]) {
      throw new Error('Invalid response from NHTSA API');
    }

    const result = response.data.Results[0];
    
    // Check if decoding was successful
    if (result.ErrorCode && result.ErrorCode !== '0') {
      throw new Error(result.ErrorText || 'NHTSA decoding failed');
    }

    return this.normalizeNHTSAResponse(result);
  }

  /**
   * Normalize NHTSA API response
   */
  normalizeNHTSAResponse(nhtsaData) {
    return {
      vin: nhtsaData.VIN,
      year: parseInt(nhtsaData.ModelYear) || null,
      make: nhtsaData.Make || null,
      model: nhtsaData.Model || null,
      subModel: nhtsaData.Trim || nhtsaData.Series || null,
      bodyStyle: nhtsaData.BodyClass || null,
      engine: {
        description: nhtsaData.EngineModel || null,
        displacement: nhtsaData.DisplacementL || nhtsaData.DisplacementCC || null,
        cylinders: nhtsaData.EngineCylinders || null,
        fuelType: nhtsaData.FuelTypePrimary || null
      },
      transmission: {
        type: nhtsaData.TransmissionStyle || null,
        speeds: nhtsaData.TransmissionSpeeds || null
      },
      drivetrain: nhtsaData.DriveType || null,
      manufacturerInfo: {
        name: nhtsaData.Manufacturer || null,
        country: nhtsaData.ManufacturerType || null,
        plantInfo: {
          city: nhtsaData.PlantCity || null,
          state: nhtsaData.PlantState || null,
          country: nhtsaData.PlantCountry || null
        }
      },
      vehicleType: nhtsaData.VehicleType || null,
      doors: nhtsaData.Doors || null,
      wheels: nhtsaData.Wheels || null,
      gvwr: nhtsaData.GVWR || null,
      bedType: nhtsaData.BedType || null,
      cabType: nhtsaData.CabType || null,
      safetyRatings: {
        ncapOverall: nhtsaData.NCSABodyType || null,
        ncapFront: null, // Would need separate API call
        ncapSide: null,  // Would need separate API call
        ncapRollover: null // Would need separate API call
      },
      recalls: [], // Would need separate API call
      source: 'nhtsa',
      decodedAt: new Date().toISOString(),
      reliable: true
    };
  }

  /**
   * Decode VIN using fallback methods (pattern matching + local lookup)
   */
  async decodeWithFallback(vin) {
    // Extract what we can from VIN pattern
    const basicInfo = this.extractBasicVINInfo(vin);
    
    if (!basicInfo) {
      throw new Error('Unable to extract basic information from VIN');
    }

    // Enhance with known patterns
    const enhancedInfo = await this.enhanceWithLocalLookup(basicInfo, vin);

    return {
      ...basicInfo,
      ...enhancedInfo,
      source: 'fallback',
      decodedAt: new Date().toISOString(),
      reliable: false,
      note: 'Decoded using pattern matching - may not be complete'
    };
  }

  /**
   * Extract basic information from VIN pattern
   */
  extractBasicVINInfo(vin) {
    if (!vin || vin.length !== 17) return null;

    const vinUpper = vin.toUpperCase();
    
    try {
      // World Manufacturer Identifier (WMI) - positions 1-3
      const wmi = vinUpper.substring(0, 3);
      const manufacturerInfo = this.getManufacturerFromWMI(wmi);
      
      // Vehicle Descriptor Section (VDS) - positions 4-9
      const vds = vinUpper.substring(3, 9);
      
      // Vehicle Identifier Section (VIS) - positions 10-17
      const vis = vinUpper.substring(9);
      
      // Model year (position 10)
      const yearChar = vinUpper.charAt(9);
      const year = this.getYearFromCode(yearChar);
      
      // Plant code (position 11)
      const plantCode = vinUpper.charAt(10);
      
      return {
        vin: vinUpper,
        wmi,
        vds,
        vis,
        year,
        manufacturerInfo,
        plantCode,
        serialNumber: vinUpper.substring(11), // Last 6 characters
        source: 'pattern_extraction'
      };
    } catch (error) {
      console.error('Error extracting basic VIN info:', error);
      return null;
    }
  }

  /**
   * Get manufacturer information from World Manufacturer Identifier
   */
  getManufacturerFromWMI(wmi) {
    const manufacturers = {
      '1G1': { name: 'Chevrolet', country: 'USA' },
      '1G6': { name: 'Cadillac', country: 'USA' },
      '1GC': { name: 'Chevrolet Truck', country: 'USA' },
      '1GK': { name: 'GMC', country: 'USA' },
      '1FA': { name: 'Ford', country: 'USA' },
      '1FD': { name: 'Ford Truck', country: 'USA' },
      '1FM': { name: 'Ford Motor Company', country: 'USA' },
      '1FT': { name: 'Ford Truck', country: 'USA' },
      '1HC': { name: 'Peterbilt', country: 'USA' },
      '1HG': { name: 'Honda', country: 'USA' },
      '1J4': { name: 'Jeep', country: 'USA' },
      '1L1': { name: 'Lincoln', country: 'USA' },
      '1ME': { name: 'Mercury', country: 'USA' },
      '1N4': { name: 'Nissan', country: 'USA' },
      '1N6': { name: 'Nissan Truck', country: 'USA' },
      '1NX': { name: 'NUMMI', country: 'USA' },
      '1VW': { name: 'Volkswagen', country: 'USA' },
      '1YV': { name: 'Mazda', country: 'USA' },
      '2C3': { name: 'Chrysler', country: 'Canada' },
      '2FA': { name: 'Ford', country: 'Canada' },
      '2FM': { name: 'Ford Motor Company', country: 'Canada' },
      '2FT': { name: 'Ford Truck', country: 'Canada' },
      '2G1': { name: 'Chevrolet', country: 'Canada' },
      '2G2': { name: 'Pontiac', country: 'Canada' },
      '2HG': { name: 'Honda', country: 'Canada' },
      '2HJ': { name: 'Honda', country: 'Canada' },
      '2HK': { name: 'Honda', country: 'Canada' },
      '2T1': { name: 'Toyota', country: 'Canada' },
      '3C3': { name: 'Chrysler', country: 'Mexico' },
      '3C4': { name: 'Chrysler', country: 'Mexico' },
      '3FA': { name: 'Ford', country: 'Mexico' },
      '3G1': { name: 'Chevrolet', country: 'Mexico' },
      '3G2': { name: 'Pontiac', country: 'Mexico' },
      '3N1': { name: 'Nissan', country: 'Mexico' },
      '4F2': { name: 'Mazda', country: 'USA' },
      '4F4': { name: 'Mazda', country: 'USA' },
      '4M2': { name: 'Mercury', country: 'USA' },
      '4S3': { name: 'Subaru', country: 'USA' },
      '4S4': { name: 'Subaru', country: 'USA' },
      '4T1': { name: 'Toyota', country: 'USA' },
      '4T3': { name: 'Toyota Truck', country: 'USA' },
      '5F2': { name: 'Honda', country: 'USA' },
      '5FN': { name: 'Honda', country: 'USA' },
      '5J6': { name: 'Honda', country: 'USA' },
      '5L2': { name: 'Lincoln', country: 'USA' },
      '5N1': { name: 'Nissan', country: 'USA' },
      '5NP': { name: 'Hyundai', country: 'USA' },
      '5TD': { name: 'Toyota Truck', country: 'USA' },
      '5TF': { name: 'Toyota', country: 'USA' },
      'JH4': { name: 'Acura', country: 'Japan' },
      'JHM': { name: 'Honda', country: 'Japan' },
      'JN1': { name: 'Nissan', country: 'Japan' },
      'JN6': { name: 'Nissan Truck', country: 'Japan' },
      'JT2': { name: 'Toyota', country: 'Japan' },
      'JT3': { name: 'Toyota Truck', country: 'Japan' },
      'JT6': { name: 'Toyota', country: 'Japan' },
      'JT8': { name: 'Toyota', country: 'Japan' },
      'JTD': { name: 'Toyota', country: 'Japan' },
      'JTE': { name: 'Toyota', country: 'Japan' },
      'JTF': { name: 'Toyota', country: 'Japan' },
      'JTG': { name: 'Toyota', country: 'Japan' },
      'JTH': { name: 'Toyota', country: 'Japan' },
      'JTJ': { name: 'Toyota', country: 'Japan' },
      'JTK': { name: 'Toyota', country: 'Japan' },
      'JTL': { name: 'Toyota', country: 'Japan' },
      'JTM': { name: 'Toyota', country: 'Japan' },
      'JTN': { name: 'Toyota', country: 'Japan' },
      // German manufacturers
      'WBA': { name: 'BMW', country: 'Germany' },
      'WBS': { name: 'BMW M', country: 'Germany' },
      'WBX': { name: 'BMW', country: 'Germany' },
      'WDB': { name: 'Mercedes-Benz', country: 'Germany' },
      'WDC': { name: 'Mercedes-Benz', country: 'Germany' },
      'WDD': { name: 'Mercedes-Benz', country: 'Germany' },
      'WDF': { name: 'Mercedes-Benz', country: 'Germany' },
      'WVG': { name: 'Volkswagen', country: 'Germany' },
      'WVW': { name: 'Volkswagen', country: 'Germany' },
      'WP0': { name: 'Porsche', country: 'Germany' },
      'WAU': { name: 'Audi', country: 'Germany' },
      // Korean manufacturers
      'KMH': { name: 'Hyundai', country: 'South Korea' },
      'KMJ': { name: 'Hyundai', country: 'South Korea' },
      'KNA': { name: 'Kia', country: 'South Korea' },
      'KNB': { name: 'Kia', country: 'South Korea' },
      'KNC': { name: 'Kia', country: 'South Korea' },
      'KND': { name: 'Kia', country: 'South Korea' }
    };

    return manufacturers[wmi] || { name: 'Unknown', country: 'Unknown' };
  }

  /**
   * Get model year from VIN year code
   */
  getYearFromCode(yearChar) {
    const yearCodes = {
      'A': 1980, 'B': 1981, 'C': 1982, 'D': 1983, 'E': 1984, 'F': 1985, 'G': 1986,
      'H': 1987, 'J': 1988, 'K': 1989, 'L': 1990, 'M': 1991, 'N': 1992, 'P': 1993,
      'R': 1994, 'S': 1995, 'T': 1996, 'V': 1997, 'W': 1998, 'X': 1999, 'Y': 2000,
      '1': 2001, '2': 2002, '3': 2003, '4': 2004, '5': 2005, '6': 2006, '7': 2007,
      '8': 2008, '9': 2009, 'A': 2010, 'B': 2011, 'C': 2012, 'D': 2013, 'E': 2014,
      'F': 2015, 'G': 2016, 'H': 2017, 'J': 2018, 'K': 2019, 'L': 2020, 'M': 2021,
      'N': 2022, 'P': 2023, 'R': 2024, 'S': 2025, 'T': 2026, 'V': 2027, 'W': 2028,
      'X': 2029, 'Y': 2030
    };

    return yearCodes[yearChar] || null;
  }

  /**
   * Enhance with local lookup data
   */
  async enhanceWithLocalLookup(basicInfo, vin) {
    // This would typically connect to a local database of vehicle specifications
    // For now, return enhanced structure based on known patterns
    
    const enhancement = {
      make: basicInfo.manufacturerInfo.name,
      bodyStyle: 'Unknown',
      engine: {
        description: 'Unknown',
        displacement: null,
        cylinders: null,
        fuelType: 'Unknown'
      },
      transmission: {
        type: 'Unknown',
        speeds: null
      },
      drivetrain: 'Unknown',
      doors: null,
      reliable: false
    };

    return enhancement;
  }

  /**
   * Enhance decoded data with additional processing
   */
  enhanceDecodedData(decodedData, vin) {
    // Add computed fields and enhancements
    const enhanced = { ...decodedData };

    // Normalize make/model names for better parts matching
    if (enhanced.make) {
      enhanced.makeNormalized = this.normalizeMakeName(enhanced.make);
    }

    if (enhanced.model) {
      enhanced.modelNormalized = this.normalizeModelName(enhanced.model);
    }

    // Add parts compatibility hints
    enhanced.partsCompatibility = this.generatePartsCompatibilityInfo(enhanced);

    // Add estimated vehicle value tier for parts sourcing
    enhanced.valueTier = this.estimateVehicleValueTier(enhanced);

    // Add common part categories for this vehicle type
    enhanced.commonPartCategories = this.getCommonPartCategories(enhanced);

    return enhanced;
  }

  /**
   * Normalize manufacturer name for consistency
   */
  normalizeMakeName(make) {
    const normalizations = {
      'CHEVROLET': 'Chevrolet',
      'FORD MOTOR COMPANY': 'Ford',
      'GENERAL MOTORS': 'GM',
      'TOYOTA MOTOR CORPORATION': 'Toyota',
      'HONDA MOTOR CO.': 'Honda',
      'NISSAN NORTH AMERICA': 'Nissan'
    };

    return normalizations[make.toUpperCase()] || make;
  }

  /**
   * Normalize model name
   */
  normalizeModelName(model) {
    return model.replace(/[^A-Za-z0-9\s]/g, '').trim();
  }

  /**
   * Generate parts compatibility information
   */
  generatePartsCompatibilityInfo(vehicleData) {
    const compatibility = {
      yearRange: {
        start: vehicleData.year,
        end: vehicleData.year
      },
      crossCompatibleMakes: [],
      engineCompatibility: vehicleData.engine?.description || 'Unknown',
      bodyStyleFamily: vehicleData.bodyStyle || 'Unknown'
    };

    // Add logic for known compatibility patterns
    if (vehicleData.make === 'Toyota') {
      if (vehicleData.model === 'Camry') {
        compatibility.yearRange = { start: vehicleData.year - 2, end: vehicleData.year + 2 };
        compatibility.crossCompatibleMakes = ['Lexus'];
      }
    }

    return compatibility;
  }

  /**
   * Estimate vehicle value tier for parts sourcing decisions
   */
  estimateVehicleValueTier(vehicleData) {
    const currentYear = new Date().getFullYear();
    const age = currentYear - (vehicleData.year || currentYear);

    const luxuryMakes = ['BMW', 'Mercedes-Benz', 'Audi', 'Lexus', 'Cadillac', 'Lincoln', 'Acura', 'Infiniti'];
    const economyMakes = ['Chevrolet', 'Ford', 'Toyota', 'Honda', 'Nissan', 'Hyundai', 'Kia'];

    if (luxuryMakes.includes(vehicleData.make)) {
      return age < 5 ? 'luxury_new' : age < 10 ? 'luxury_used' : 'luxury_old';
    }

    if (economyMakes.includes(vehicleData.make)) {
      return age < 3 ? 'economy_new' : age < 8 ? 'economy_used' : 'economy_old';
    }

    return age < 5 ? 'standard_new' : age < 10 ? 'standard_used' : 'standard_old';
  }

  /**
   * Get common part categories for vehicle type
   */
  getCommonPartCategories(vehicleData) {
    const categories = ['body', 'mechanical', 'electrical', 'interior'];

    if (vehicleData.bodyStyle) {
      const bodyStyle = vehicleData.bodyStyle.toLowerCase();
      if (bodyStyle.includes('truck') || bodyStyle.includes('pickup')) {
        categories.push('truck_specific');
      }
      if (bodyStyle.includes('convertible')) {
        categories.push('convertible_specific');
      }
    }

    return categories;
  }

  /**
   * Initialize VIN patterns for pattern matching
   */
  initializeVINPatterns() {
    return {
      wmiPatterns: this.getManufacturerFromWMI(''),
      yearCodes: this.getYearFromCode(''),
      commonEngines: {
        'Toyota': ['2.4L 4-Cyl', '3.5L V6', '2.0L Turbo'],
        'Honda': ['2.0L 4-Cyl', '3.0L V6', '1.5L Turbo'],
        'Ford': ['2.0L EcoBoost', '3.5L V6', '5.0L V8'],
        'Chevrolet': ['2.4L 4-Cyl', '3.6L V6', '6.2L V8']
      }
    };
  }

  /**
   * Clear VIN cache
   */
  clearCache() {
    this.vinCache.clear();
    console.log('VIN cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.vinCache.size,
      entries: Array.from(this.vinCache.keys())
    };
  }
}

module.exports = { VINDecodingService };