const axios = require('axios');
const { Vehicle } = require('../database/models');
const {
  ValidationError,
  ApiError,
  NotFoundError,
} = require('../utils/errorHandler');

/**
 * VIN Decoder Service
 * Provides comprehensive VIN (Vehicle Identification Number) decoding functionality
 * Supports both NHTSA API integration and local decoding with caching
 */
class VINDecoder {
  constructor() {
    this.nhtsaApiUrl = 'https://vpic.nhtsa.dot.gov/api/vehicles/decodevin';
    this.apiTimeout = 5000; // 5 seconds
    this.cacheExpiry = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
  }

  /**
   * Main VIN decoding method
   * @param {string} vin - 17-character VIN to decode
   * @param {boolean} useApiOnly - Force API usage, skip local fallback
   * @returns {Promise<Object>} Decoded vehicle information
   */
  async decode(vin, useApiOnly = false) {
    try {
      // Validate VIN format
      const validatedVIN = this.validateAndNormalizeVIN(vin);

      // Check cache first
      const cached = await this.checkCache(validatedVIN);
      if (cached) {
        console.log(`VIN ${validatedVIN} found in cache`);
        return {
          success: true,
          source: 'cache',
          vehicle: cached,
        };
      }

      // Try NHTSA API first
      try {
        const apiResult = await this.decodeWithNHTSA(validatedVIN);
        await this.cacheVehicleData(validatedVIN, apiResult);
        console.log(`VIN ${validatedVIN} decoded via NHTSA API`);
        return {
          success: true,
          source: 'nhtsa_api',
          vehicle: apiResult,
        };
      } catch (apiError) {
        console.warn(
          `NHTSA API failed for VIN ${validatedVIN}:`,
          apiError.message
        );

        if (useApiOnly) {
          throw new ApiError(
            'NHTSA API unavailable and local decoding disabled'
          );
        }

        // Fallback to local decoding
        const localResult = await this.decodeLocally(validatedVIN);
        await this.cacheVehicleData(validatedVIN, localResult);
        console.log(`VIN ${validatedVIN} decoded locally`);
        return {
          success: true,
          source: 'local_decoder',
          vehicle: localResult,
        };
      }
    } catch (error) {
      console.error('VIN decoding error:', error);
      throw error;
    }
  }

  /**
   * Validate and normalize VIN format
   * @param {string} vin - Raw VIN input
   * @returns {string} Normalized VIN
   * @throws {ValidationError} If VIN format is invalid
   */
  validateAndNormalizeVIN(vin) {
    if (!vin || typeof vin !== 'string') {
      throw new ValidationError('VIN must be provided as a string');
    }

    // Remove spaces and convert to uppercase
    const normalizedVIN = vin.replace(/\s/g, '').toUpperCase();

    // Check length
    if (normalizedVIN.length !== 17) {
      throw new ValidationError(
        `Invalid VIN length: expected 17 characters, got ${normalizedVIN.length}`
      );
    }

    // Check for invalid characters (I, O, Q are not used in VINs)
    if (/[IOQ]/i.test(normalizedVIN)) {
      throw new ValidationError(
        'VIN contains invalid characters (I, O, Q are not allowed)'
      );
    }

    // Validate alphanumeric
    if (!/^[A-HJ-NPR-Z0-9]{17}$/i.test(normalizedVIN)) {
      throw new ValidationError(
        'VIN must contain only letters and numbers (excluding I, O, Q)'
      );
    }

    // Validate check digit (position 9)
    if (!this.validateCheckDigit(normalizedVIN)) {
      throw new ValidationError('VIN check digit validation failed');
    }

    return normalizedVIN;
  }

  /**
   * Validate VIN check digit (9th position)
   * @param {string} vin - Normalized VIN
   * @returns {boolean} True if check digit is valid
   */
  validateCheckDigit(vin) {
    const weights = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];
    const values = {
      A: 1,
      B: 2,
      C: 3,
      D: 4,
      E: 5,
      F: 6,
      G: 7,
      H: 8,
      J: 1,
      K: 2,
      L: 3,
      M: 4,
      N: 5,
      P: 7,
      R: 9,
      S: 2,
      T: 3,
      U: 4,
      V: 5,
      W: 6,
      X: 7,
      Y: 8,
      Z: 9,
      0: 0,
      1: 1,
      2: 2,
      3: 3,
      4: 4,
      5: 5,
      6: 6,
      7: 7,
      8: 8,
      9: 9,
    };

    let sum = 0;
    for (let i = 0; i < 17; i++) {
      const char = vin[i];
      const value = values[char];
      sum += value * weights[i];
    }

    const checkDigit = sum % 11;
    const expectedChar = checkDigit === 10 ? 'X' : checkDigit.toString();

    return vin[8] === expectedChar;
  }

  /**
   * Decode VIN using NHTSA API
   * @param {string} vin - Validated VIN
   * @returns {Promise<Object>} Decoded vehicle data
   */
  async decodeWithNHTSA(vin) {
    const response = await axios.get(`${this.nhtsaApiUrl}/${vin}?format=json`, {
      timeout: this.apiTimeout,
      headers: {
        'User-Agent': 'CollisionOS-VINDecoder/1.0',
        Accept: 'application/json',
      },
    });

    if (response.status !== 200) {
      throw new ApiError(`NHTSA API returned status ${response.status}`);
    }

    return this.parseNHTSAResponse(response.data, vin);
  }

  /**
   * Parse NHTSA API response and map to our vehicle schema
   * @param {Object} data - NHTSA API response
   * @param {string} vin - Original VIN
   * @returns {Object} Mapped vehicle data
   */
  parseNHTSAResponse(data, vin) {
    if (!data || !data.Results || !Array.isArray(data.Results)) {
      throw new ApiError('Invalid NHTSA API response format');
    }

    const results = data.Results;
    const getValue = variable => {
      const item = results.find(r => r.Variable === variable);
      return item?.Value || null;
    };

    const vehicle = {
      vin: vin,
      year: this.parseYear(getValue('Model Year')),
      make: getValue('Make') || 'Unknown',
      model: getValue('Model') || 'Unknown',
      trim: getValue('Trim') || null,
      engine: this.formatEngine(
        getValue('Engine Number of Cylinders'),
        getValue('Displacement (L)')
      ),
      transmission: getValue('Transmission Style') || null,
      drivetrain: getValue('Drive Type') || null,
      body_type: this.normalizeBodyType(getValue('Body Class')),
      doors: this.parseDoors(getValue('Doors')),
      manufacturer: getValue('Manufacturer Name') || 'Unknown',
      plant_country: getValue('Plant Country') || null,
      plant_city: getValue('Plant City') || null,
      vehicle_type: getValue('Vehicle Type') || 'Passenger Car',
      fuel_type: this.normalizeFuelType(getValue('Fuel Type - Primary')),
      gross_weight_rating: getValue('Gross Vehicle Weight Rating From'),
      wheelbase: getValue('Wheelbase (inches)'),
      series: getValue('Series') || null,
      decoded_at: new Date().toISOString(),
      source: 'NHTSA',
    };

    return vehicle;
  }

  /**
   * Local VIN decoding fallback
   * @param {string} vin - Validated VIN
   * @returns {Object} Basic decoded vehicle data
   */
  async decodeLocally(vin) {
    const vehicle = {
      vin: vin,
      year: this.getYearFromVIN(vin),
      make: this.getMakeFromVIN(vin),
      model: 'Unknown', // Requires manufacturer-specific database
      trim: null,
      engine: null,
      transmission: null,
      drivetrain: null,
      body_type: 'other',
      doors: null,
      manufacturer: this.getManufacturerFromVIN(vin),
      plant_country: this.getPlantCountryFromVIN(vin),
      plant_city: null,
      vehicle_type: 'Passenger Car',
      fuel_type: null,
      gross_weight_rating: null,
      wheelbase: null,
      series: null,
      decoded_at: new Date().toISOString(),
      source: 'Local',
    };

    return vehicle;
  }

  /**
   * Extract year from VIN (10th position)
   * @param {string} vin - VIN string
   * @returns {number|null} Vehicle year
   */
  getYearFromVIN(vin) {
    const yearCode = vin.charAt(9);
    const yearMap = {
      // 1980s-1990s
      A: 1980,
      B: 1981,
      C: 1982,
      D: 1983,
      E: 1984,
      F: 1985,
      G: 1986,
      H: 1987,
      J: 1988,
      K: 1989,
      L: 1990,
      M: 1991,
      N: 1992,
      P: 1993,
      R: 1994,
      S: 1995,
      T: 1996,
      V: 1997,
      W: 1998,
      X: 1999,
      Y: 2000,
      // 2000s-2010s
      1: 2001,
      2: 2002,
      3: 2003,
      4: 2004,
      5: 2005,
      6: 2006,
      7: 2007,
      8: 2008,
      9: 2009,
      // 2010s-2020s (repeating pattern)
      A: 2010,
      B: 2011,
      C: 2012,
      D: 2013,
      E: 2014,
      F: 2015,
      G: 2016,
      H: 2017,
      J: 2018,
      K: 2019,
      L: 2020,
      M: 2021,
      N: 2022,
      P: 2023,
      R: 2024,
      S: 2025,
      T: 2026,
      V: 2027,
      W: 2028,
      X: 2029,
      Y: 2030,
    };

    // Handle dual mappings based on context
    const baseYear = yearMap[yearCode];
    if (!baseYear) return null;

    // For letters, determine decade based on VIN structure
    if (isNaN(yearCode)) {
      const currentYear = new Date().getFullYear();
      const decade1 = baseYear;
      const decade2 = baseYear + 30;

      // Choose the decade that makes most sense
      return Math.abs(currentYear - decade2) < Math.abs(currentYear - decade1)
        ? decade2
        : decade1;
    }

    return baseYear;
  }

  /**
   * Extract make/manufacturer from WMI (World Manufacturer Identifier)
   * @param {string} vin - VIN string
   * @returns {string} Vehicle make
   */
  getMakeFromVIN(vin) {
    const wmi = vin.substring(0, 3);

    // Comprehensive WMI to make mapping
    const makeMap = {
      // Honda
      '1HG': 'Honda',
      '1H1': 'Honda',
      '1H2': 'Honda',
      '1H3': 'Honda',
      '1H4': 'Honda',
      JHM: 'Honda',
      JHL: 'Honda',
      // Toyota
      '1NX': 'Toyota',
      '2T1': 'Toyota',
      '2T2': 'Toyota',
      '4T1': 'Toyota',
      '4T3': 'Toyota',
      JTD: 'Toyota',
      JTH: 'Toyota',
      JTK: 'Toyota',
      JTN: 'Toyota',
      // Ford
      '1FA': 'Ford',
      '1FB': 'Ford',
      '1FC': 'Ford',
      '1FD': 'Ford',
      '1FE': 'Ford',
      '1FF': 'Ford',
      '1FG': 'Ford',
      '1FH': 'Ford',
      '1FJ': 'Ford',
      '1FK': 'Ford',
      '1FL': 'Ford',
      '1FM': 'Ford',
      '1FN': 'Ford',
      '1FP': 'Ford',
      '1FR': 'Ford',
      '1FT': 'Ford',
      '1FU': 'Ford',
      '1FV': 'Ford',
      '1FW': 'Ford',
      '1FX': 'Ford',
      '1FY': 'Ford',
      '1FZ': 'Ford',
      // General Motors
      '1G1': 'Chevrolet',
      '1G2': 'Pontiac',
      '1G3': 'Oldsmobile',
      '1G4': 'Buick',
      '1G6': 'Cadillac',
      '1G8': 'Saturn',
      '1GT': 'GMC',
      '1GC': 'Chevrolet',
      '1GD': 'GMC',
      '1GE': 'GMC',
      '1GH': 'GMC',
      '1GK': 'GMC',
      // Chrysler
      '1C3': 'Chrysler',
      '1C4': 'Chrysler',
      '1C6': 'Chrysler',
      '1C8': 'Chrysler',
      '1D3': 'Dodge',
      '1D4': 'Dodge',
      '1D7': 'Dodge',
      '1D8': 'Dodge',
      // Nissan
      '1N4': 'Nissan',
      '1N6': 'Nissan',
      JN1: 'Nissan',
      JN8: 'Nissan',
      // BMW
      WBA: 'BMW',
      WBS: 'BMW',
      WBY: 'BMW',
      '4US': 'BMW',
      '5UX': 'BMW',
      // Mercedes-Benz
      WDB: 'Mercedes-Benz',
      WDC: 'Mercedes-Benz',
      WDD: 'Mercedes-Benz',
      WDF: 'Mercedes-Benz',
      '4JG': 'Mercedes-Benz',
      // Volkswagen
      '1VW': 'Volkswagen',
      '3VW': 'Volkswagen',
      WVW: 'Volkswagen',
      // Audi
      WA1: 'Audi',
      WAU: 'Audi',
      WUA: 'Audi',
      // Hyundai
      KMH: 'Hyundai',
      '5NM': 'Hyundai',
      '5NP': 'Hyundai',
      // Kia
      KNA: 'Kia',
      KND: 'Kia',
      '5XY': 'Kia',
      // Subaru
      JF1: 'Subaru',
      JF2: 'Subaru',
      '4S3': 'Subaru',
      '4S4': 'Subaru',
      // Mazda
      JM1: 'Mazda',
      JM3: 'Mazda',
      '4F2': 'Mazda',
      '4F4': 'Mazda',
      // Mitsubishi
      JA3: 'Mitsubishi',
      JA4: 'Mitsubishi',
      '4A3': 'Mitsubishi',
      '4A4': 'Mitsubishi',
      // Acura
      '19U': 'Acura',
      JH4: 'Acura',
      // Infiniti
      JNK: 'Infiniti',
      JNR: 'Infiniti',
      '5N1': 'Infiniti',
      // Lexus
      JTH: 'Lexus',
      JTK: 'Lexus',
      '2T2': 'Lexus',
      '5TD': 'Lexus',
      // Volvo
      YV1: 'Volvo',
      YV4: 'Volvo',
      LVY: 'Volvo',
      // Land Rover/Jaguar
      SAL: 'Land Rover',
      SAJ: 'Jaguar',
      SAT: 'Land Rover',
      // Porsche
      WP0: 'Porsche',
      WP1: 'Porsche',
    };

    return makeMap[wmi] || this.getMakeFromCountryCode(vin.charAt(0));
  }

  /**
   * Get manufacturer name from WMI
   * @param {string} vin - VIN string
   * @returns {string} Manufacturer name
   */
  getManufacturerFromVIN(vin) {
    const make = this.getMakeFromVIN(vin);

    // Map makes to full manufacturer names
    const manufacturerMap = {
      Honda: 'Honda Motor Company',
      Toyota: 'Toyota Motor Corporation',
      Ford: 'Ford Motor Company',
      Chevrolet: 'General Motors',
      GMC: 'General Motors',
      Buick: 'General Motors',
      Cadillac: 'General Motors',
      Pontiac: 'General Motors',
      Oldsmobile: 'General Motors',
      Saturn: 'General Motors',
      Chrysler: 'Stellantis (formerly FCA)',
      Dodge: 'Stellantis (formerly FCA)',
      Nissan: 'Nissan Motor Company',
      BMW: 'Bayerische Motoren Werke AG',
      'Mercedes-Benz': 'Mercedes-Benz Group AG',
      Volkswagen: 'Volkswagen AG',
      Audi: 'Audi AG',
      Hyundai: 'Hyundai Motor Company',
      Kia: 'Kia Corporation',
    };

    return manufacturerMap[make] || make;
  }

  /**
   * Get plant country from first character of VIN
   * @param {string} firstChar - First character of VIN
   * @returns {string|null} Country of manufacture
   */
  getPlantCountryFromVIN(firstChar) {
    const countryMap = {
      1: 'United States',
      2: 'Canada',
      3: 'Mexico',
      4: 'United States',
      5: 'United States',
      6: 'Australia',
      8: 'Argentina',
      9: 'Brazil',
      A: 'South Africa',
      B: 'Kenya',
      C: 'Benin',
      J: 'Japan',
      K: 'South Korea',
      L: 'China',
      M: 'India',
      N: 'Turkey',
      P: 'Italy',
      R: 'Taiwan',
      S: 'United Kingdom',
      T: 'Czechoslovakia',
      U: 'Romania',
      V: 'France',
      W: 'Germany',
      X: 'Russia',
      Y: 'Sweden',
      Z: 'Italy',
    };

    return countryMap[firstChar] || null;
  }

  /**
   * Get basic make from country code when WMI lookup fails
   * @param {string} countryCode - First character of VIN
   * @returns {string} Generic make based on country
   */
  getMakeFromCountryCode(countryCode) {
    const countryMakes = {
      1: 'American',
      2: 'American',
      3: 'American',
      4: 'American',
      5: 'American',
      J: 'Japanese',
      K: 'Korean',
      W: 'German',
      V: 'French',
      S: 'British',
      Y: 'Swedish',
    };

    return countryMakes[countryCode] || 'Unknown';
  }

  /**
   * Check if VIN is cached in database
   * @param {string} vin - Normalized VIN
   * @returns {Promise<Object|null>} Cached vehicle data or null
   */
  async checkCache(vin) {
    try {
      const cached = await Vehicle.findOne({
        where: {
          vin: vin,
          // Only use cache if it's recent enough
          updatedAt: {
            [require('sequelize').Op.gte]: new Date(
              Date.now() - this.cacheExpiry
            ),
          },
        },
      });

      if (cached) {
        return this.formatCachedVehicle(cached);
      }

      return null;
    } catch (error) {
      console.warn('Cache check failed:', error.message);
      return null;
    }
  }

  /**
   * Cache decoded vehicle data
   * @param {string} vin - VIN to cache
   * @param {Object} vehicleData - Decoded vehicle data
   */
  async cacheVehicleData(vin, vehicleData) {
    try {
      // Don't cache if we don't have basic required data
      if (!vehicleData.year || !vehicleData.make) {
        return;
      }

      await Vehicle.upsert({
        vin: vin,
        year: vehicleData.year,
        make: vehicleData.make,
        model: vehicleData.model,
        trim: vehicleData.trim,
        engineSize: vehicleData.engine,
        transmission: vehicleData.transmission,
        bodyStyle: this.mapBodyTypeToEnum(vehicleData.body_type),
        fuelType: this.mapFuelTypeToEnum(vehicleData.fuel_type),
        // Store additional decoded data in features JSON
        features: {
          decoded_data: vehicleData,
          cached_at: new Date().toISOString(),
        },
        vehicleStatus: 'active',
        isActive: true,
        // Temporary values for required fields
        customerId: null,
        shopId: null,
      });

      console.log(`Cached VIN ${vin} successfully`);
    } catch (error) {
      console.warn('Failed to cache vehicle data:', error.message);
    }
  }

  /**
   * Format cached vehicle for response
   * @param {Object} cachedVehicle - Database vehicle record
   * @returns {Object} Formatted vehicle data
   */
  formatCachedVehicle(cachedVehicle) {
    const decoded = cachedVehicle.features?.decoded_data || {};

    return {
      vin: cachedVehicle.vin,
      year: cachedVehicle.year,
      make: cachedVehicle.make,
      model: cachedVehicle.model,
      trim: cachedVehicle.trim,
      engine: cachedVehicle.engineSize,
      transmission: cachedVehicle.transmission,
      drivetrain: decoded.drivetrain,
      body_type: decoded.body_type || cachedVehicle.bodyStyle,
      doors: decoded.doors,
      manufacturer: decoded.manufacturer,
      plant_country: decoded.plant_country,
      plant_city: decoded.plant_city,
      vehicle_type: decoded.vehicle_type,
      fuel_type: cachedVehicle.fuelType,
      decoded_at: decoded.decoded_at || cachedVehicle.updatedAt,
      source: decoded.source || 'Cache',
    };
  }

  // Helper methods for data normalization
  parseYear(yearStr) {
    if (!yearStr) return null;
    const year = parseInt(yearStr);
    return year >= 1900 && year <= new Date().getFullYear() + 1 ? year : null;
  }

  parseDoors(doorsStr) {
    if (!doorsStr) return null;
    const doors = parseInt(doorsStr);
    return doors >= 2 && doors <= 5 ? doors : null;
  }

  formatEngine(cylinders, displacement) {
    const parts = [];
    if (displacement) parts.push(`${displacement}L`);
    if (cylinders) parts.push(`${cylinders}cyl`);
    return parts.length > 0 ? parts.join(' ') : null;
  }

  normalizeBodyType(bodyClass) {
    if (!bodyClass) return 'other';

    const bodyType = bodyClass.toLowerCase();
    if (bodyType.includes('sedan')) return 'sedan';
    if (bodyType.includes('suv') || bodyType.includes('sport utility'))
      return 'suv';
    if (bodyType.includes('truck') || bodyType.includes('pickup'))
      return 'truck';
    if (bodyType.includes('coupe')) return 'coupe';
    if (bodyType.includes('convertible')) return 'convertible';
    if (bodyType.includes('wagon')) return 'wagon';
    if (bodyType.includes('hatchback')) return 'hatchback';
    if (bodyType.includes('van')) return 'van';

    return 'other';
  }

  normalizeFuelType(fuelType) {
    if (!fuelType) return null;

    const fuel = fuelType.toLowerCase();
    if (fuel.includes('gasoline') || fuel.includes('gas')) return 'gasoline';
    if (fuel.includes('diesel')) return 'diesel';
    if (fuel.includes('hybrid'))
      return fuel.includes('plug') ? 'plug_in_hybrid' : 'hybrid';
    if (fuel.includes('electric')) return 'electric';
    if (fuel.includes('hydrogen')) return 'hydrogen';

    return 'other';
  }

  mapBodyTypeToEnum(bodyType) {
    const validTypes = [
      'sedan',
      'suv',
      'truck',
      'coupe',
      'convertible',
      'wagon',
      'hatchback',
      'van',
      'motorcycle',
      'other',
    ];
    return validTypes.includes(bodyType) ? bodyType : 'other';
  }

  mapFuelTypeToEnum(fuelType) {
    const validTypes = [
      'gasoline',
      'diesel',
      'hybrid',
      'electric',
      'plug_in_hybrid',
      'hydrogen',
      'other',
    ];
    return validTypes.includes(fuelType) ? fuelType : null;
  }
}

module.exports = VINDecoder;
