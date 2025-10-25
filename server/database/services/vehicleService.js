const { Vehicle, Customer } = require('../models');
const { queryHelpers } = require('../../utils/queryHelpers');
const { Op } = require('sequelize');

/**
 * Vehicle Service - Sequelize integration for vehicle management
 */
class VehicleService {
  constructor() {
    // No table name needed - using Sequelize models
  }

  /**
   * Find vehicles by criteria
   */
  async findVehicles(criteria = {}) {
    try {
      const where = {};

      // Apply filters based on criteria
      if (criteria.vin) {
        where.vin = criteria.vin;
      }
      if (criteria.customerId) {
        where.customerId = criteria.customerId;
      }
      if (criteria.license) {
        where.licensePlate = criteria.license;
      }
      if (criteria.id) {
        where.id = criteria.id;
      }

      const vehicles = await Vehicle.findAll({ where });

      return vehicles.map(v => v.toJSON());
    } catch (error) {
      console.error('VehicleService.findVehicles error:', error);
      throw error;
    }
  }

  /**
   * Create a new vehicle
   */
  async createVehicle(vehicleData, customerId) {
    try {
      // Build vehicle record with camelCase fields
      const vehicleRecord = {
        customerId: customerId,
        shopId:
          vehicleData.shopId ||
          process.env.DEV_SHOP_ID ||
          '00000000-0000-4000-8000-000000000001',
        year: vehicleData.year || null,
        make: vehicleData.make || '',
        model: vehicleData.model || '',
        vin: vehicleData.vin || null,
      };

      // Add optional fields
      if (vehicleData.license || vehicleData.licensePlate) {
        vehicleRecord.licensePlate =
          vehicleData.license || vehicleData.licensePlate;
      }
      if (vehicleData.mileage) {
        vehicleRecord.mileage = vehicleData.mileage;
      }
      if (vehicleData.color) {
        vehicleRecord.color = vehicleData.color;
      }
      if (vehicleData.engineSize || vehicleData.engine) {
        vehicleRecord.engineSize = vehicleData.engineSize || vehicleData.engine;
      }
      if (vehicleData.transmission) {
        vehicleRecord.transmission = vehicleData.transmission;
      }
      if (vehicleData.trim) {
        vehicleRecord.trim = vehicleData.trim;
      }
      if (vehicleData.bodyStyle) {
        vehicleRecord.bodyStyle = vehicleData.bodyStyle;
      }
      if (vehicleData.fuelType) {
        vehicleRecord.fuelType = vehicleData.fuelType;
      }

      const vehicle = await Vehicle.create(vehicleRecord);

      console.log('Vehicle created successfully:', vehicle.id);

      // Convert back to frontend format
      return this.transformToFrontend(vehicle.toJSON());
    } catch (error) {
      console.error('VehicleService.createVehicle error:', error);
      throw error;
    }
  }

  /**
   * Update existing vehicle
   */
  async updateVehicle(vehicleId, updateData) {
    try {
      const vehicleRecord = {
        year: updateData.year,
        make: updateData.make,
        model: updateData.model,
        vin: updateData.vin,
        licensePlate: updateData.license || updateData.licensePlate,
        mileage: updateData.mileage,
        color: updateData.color,
        engineSize: updateData.engine || updateData.engineSize,
        transmission: updateData.transmission,
        trim: updateData.trim,
        bodyStyle: updateData.bodyStyle,
        fuelType: updateData.fuelType,
      };

      // Remove undefined values
      Object.keys(vehicleRecord).forEach(key => {
        if (vehicleRecord[key] === undefined) {
          delete vehicleRecord[key];
        }
      });

      const [affectedRows] = await Vehicle.update(vehicleRecord, {
        where: { id: vehicleId },
      });

      if (affectedRows === 0) {
        throw new Error('Vehicle not found or no changes made');
      }

      const vehicle = await Vehicle.findByPk(vehicleId);

      console.log('Vehicle updated successfully:', vehicleId);

      // Convert back to frontend format
      return this.transformToFrontend(vehicle.toJSON());
    } catch (error) {
      console.error('VehicleService.updateVehicle error:', error);
      throw error;
    }
  }

  /**
   * Get vehicle by ID
   */
  async getVehicleById(vehicleId) {
    try {
      const vehicle = await Vehicle.findByPk(vehicleId, {
        include: [
          {
            model: Customer,
            as: 'customer',
            attributes: ['id', 'firstName', 'lastName', 'email', 'phone'],
          },
        ],
      });

      if (!vehicle) {
        return null; // Not found
      }

      return this.transformToFrontend(vehicle.toJSON());
    } catch (error) {
      console.error('VehicleService.getVehicleById error:', error);
      throw error;
    }
  }

  /**
   * Get vehicles by customer ID
   */
  async getVehiclesByCustomer(customerId) {
    try {
      const vehicles = await Vehicle.findAll({
        where: { customerId },
        order: [['createdAt', 'DESC']],
      });

      return vehicles.map(vehicle => this.transformToFrontend(vehicle.toJSON()));
    } catch (error) {
      console.error('VehicleService.getVehiclesByCustomer error:', error);
      throw error;
    }
  }

  /**
   * Search vehicles by text
   */
  async searchVehicles(searchTerm) {
    try {
      const where = {
        ...queryHelpers.search(
          ['vin', 'licensePlate', 'make', 'model'],
          searchTerm
        ),
      };

      const vehicles = await Vehicle.findAll({
        where,
        include: [
          {
            model: Customer,
            as: 'customer',
            attributes: ['id', 'firstName', 'lastName', 'email', 'phone'],
          },
        ],
        order: [['createdAt', 'DESC']],
      });

      return vehicles.map(vehicle => this.transformToFrontend(vehicle.toJSON()));
    } catch (error) {
      console.error('VehicleService.searchVehicles error:', error);
      throw error;
    }
  }

  /**
   * Find or create vehicle (useful for BMS import)
   */
  async findOrCreateVehicle(vehicleData, customerId) {
    try {
      // Try to find existing vehicle by VIN first
      if (vehicleData.vin) {
        const existingVehicles = await this.findVehicles({
          vin: vehicleData.vin,
        });
        if (existingVehicles.length > 0) {
          console.log('Found existing vehicle by VIN:', existingVehicles[0].id);
          return this.transformToFrontend(existingVehicles[0]);
        }
      }

      // Try to find by license plate for the same customer
      if (vehicleData.license && customerId) {
        const existingVehicles = await this.findVehicles({
          license: vehicleData.license,
          customerId: customerId,
        });
        if (existingVehicles.length > 0) {
          console.log(
            'Found existing vehicle by license plate:',
            existingVehicles[0].id
          );
          return this.transformToFrontend(existingVehicles[0]);
        }
      }

      // If not found, create new vehicle
      console.log('Creating new vehicle for customer:', customerId);
      return await this.createVehicle(vehicleData, customerId);
    } catch (error) {
      console.error('VehicleService.findOrCreateVehicle error:', error);
      throw error;
    }
  }

  /**
   * Delete vehicle
   */
  async deleteVehicle(vehicleId) {
    try {
      const affectedRows = await Vehicle.destroy({
        where: { id: vehicleId },
      });

      if (affectedRows === 0) {
        throw new Error('Vehicle not found');
      }

      console.log('Vehicle deleted successfully:', vehicleId);
      return { success: true };
    } catch (error) {
      console.error('VehicleService.deleteVehicle error:', error);
      throw error;
    }
  }

  /**
   * Transform database record to frontend format
   */
  transformToFrontend(vehicleRecord) {
    if (!vehicleRecord) return null;

    const transformed = {
      id: vehicleRecord.id,
      customerId: vehicleRecord.customerId,
      year: vehicleRecord.year,
      make: vehicleRecord.make || '',
      model: vehicleRecord.model || '',
      vin: vehicleRecord.vin || '',
      license: vehicleRecord.licensePlate || '',
      licensePlate: vehicleRecord.licensePlate || '',
      mileage: vehicleRecord.mileage,
      color: vehicleRecord.color || '',
      engine: vehicleRecord.engineSize || '',
      transmission: vehicleRecord.transmission || '',
      trim: vehicleRecord.trim || '',
      bodyStyle: vehicleRecord.bodyStyle || '',
      fuelType: vehicleRecord.fuelType || '',
      createdAt: vehicleRecord.createdAt,
      updatedAt: vehicleRecord.updatedAt,
    };

    // Add customer information if available
    if (vehicleRecord.customer) {
      transformed.customer = {
        id: vehicleRecord.customer.id,
        name: `${vehicleRecord.customer.firstName || ''} ${vehicleRecord.customer.lastName || ''}`.trim(),
        firstName: vehicleRecord.customer.firstName || '',
        lastName: vehicleRecord.customer.lastName || '',
        email: vehicleRecord.customer.email || '',
        phone: vehicleRecord.customer.phone || '',
      };
    }

    return transformed;
  }
}

module.exports = { vehicleService: new VehicleService(), VehicleService };
