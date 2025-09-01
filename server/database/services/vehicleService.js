const { supabase, supabaseAdmin } = require('../../config/supabase');

/**
 * Vehicle Service - Supabase integration for vehicle management
 */
class VehicleService {
  constructor() {
    this.table = 'vehicles';
  }

  /**
   * Find vehicles by criteria
   */
  async findVehicles(criteria = {}) {
    try {
      // Use admin client to bypass RLS for system operations
      const client = supabaseAdmin || supabase;
      let query = client.from(this.table).select('*');

      // Apply filters based on criteria
      if (criteria.vin) {
        query = query.eq('vin', criteria.vin);
      }
      if (criteria.customerId) {
        query = query.eq('customer_id', criteria.customerId);
      }
      if (criteria.license) {
        query = query.eq('license_plate', criteria.license);
      }
      if (criteria.id) {
        query = query.eq('id', criteria.id);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error finding vehicles:', error);
        throw error;
      }

      return data || [];
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
      // Start with minimal required fields only
      const vehicleRecord = {
        customer_id: customerId,
        shop_id:
          vehicleData.shopId ||
          process.env.DEV_SHOP_ID ||
          '00000000-0000-4000-8000-000000000001',
        year: vehicleData.year || null,
        make: vehicleData.make || '',
        model: vehicleData.model || '',
        vin: vehicleData.vin || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Add optional fields only if they exist in schema
      if (vehicleData.license || vehicleData.licensePlate) {
        vehicleRecord.license_plate =
          vehicleData.license || vehicleData.licensePlate;
      }
      if (vehicleData.mileage) {
        vehicleRecord.mileage = vehicleData.mileage;
      }
      // Remove columns that don't exist in Supabase schema for now
      // if (vehicleData.color) vehicleRecord.color = vehicleData.color;
      // if (vehicleData.engine) vehicleRecord.engine = vehicleData.engine;
      // if (vehicleData.transmission) vehicleRecord.transmission = vehicleData.transmission;

      // Use admin client to bypass RLS for system operations
      const client = supabaseAdmin || supabase;
      const { data, error } = await client
        .from(this.table)
        .insert([vehicleRecord])
        .select()
        .single();

      if (error) {
        console.error('Error creating vehicle:', error);
        throw error;
      }

      console.log('Vehicle created successfully:', data.id);

      // Convert back to frontend format
      return this.transformToFrontend(data);
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
        license_plate: updateData.license || updateData.licensePlate,
        mileage: updateData.mileage,
        color: updateData.color,
        engine: updateData.engine,
        transmission: updateData.transmission,
        trim: updateData.trim,
        body_style: updateData.bodyStyle,
        fuel_type: updateData.fuelType,
        updated_at: new Date().toISOString(),
      };

      // Remove undefined values
      Object.keys(vehicleRecord).forEach(key => {
        if (vehicleRecord[key] === undefined) {
          delete vehicleRecord[key];
        }
      });

      const { data, error } = await supabase
        .from(this.table)
        .update(vehicleRecord)
        .eq('id', vehicleId)
        .select()
        .single();

      if (error) {
        console.error('Error updating vehicle:', error);
        throw error;
      }

      console.log('Vehicle updated successfully:', vehicleId);

      // Convert back to frontend format
      return this.transformToFrontend(data);
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
      const { data, error } = await supabase
        .from(this.table)
        .select(
          `
          *,
          customers (
            id,
            first_name,
            last_name,
            email,
            phone
          )
        `
        )
        .eq('id', vehicleId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        console.error('Error getting vehicle:', error);
        throw error;
      }

      return this.transformToFrontend(data);
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
      const { data, error } = await supabase
        .from(this.table)
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error getting customer vehicles:', error);
        throw error;
      }

      return (data || []).map(vehicle => this.transformToFrontend(vehicle));
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
      const { data, error } = await supabase
        .from(this.table)
        .select(
          `
          *,
          customers (
            id,
            first_name,
            last_name,
            email,
            phone
          )
        `
        )
        .or(
          `vin.ilike.%${searchTerm}%,license_plate.ilike.%${searchTerm}%,make.ilike.%${searchTerm}%,model.ilike.%${searchTerm}%`
        )
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error searching vehicles:', error);
        throw error;
      }

      return (data || []).map(vehicle => this.transformToFrontend(vehicle));
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
      const { error } = await supabase
        .from(this.table)
        .delete()
        .eq('id', vehicleId);

      if (error) {
        console.error('Error deleting vehicle:', error);
        throw error;
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
      customerId: vehicleRecord.customer_id,
      year: vehicleRecord.year,
      make: vehicleRecord.make || '',
      model: vehicleRecord.model || '',
      vin: vehicleRecord.vin || '',
      license: vehicleRecord.license_plate || '',
      licensePlate: vehicleRecord.license_plate || '',
      mileage: vehicleRecord.mileage,
      color: vehicleRecord.color || '',
      engine: vehicleRecord.engine || '',
      transmission: vehicleRecord.transmission || '',
      trim: vehicleRecord.trim || '',
      bodyStyle: vehicleRecord.body_style || '',
      fuelType: vehicleRecord.fuel_type || '',
      createdAt: vehicleRecord.created_at,
      updatedAt: vehicleRecord.updated_at,
    };

    // Add customer information if available
    if (vehicleRecord.customers) {
      transformed.customer = {
        id: vehicleRecord.customers.id,
        name: `${vehicleRecord.customers.first_name || ''} ${vehicleRecord.customers.last_name || ''}`.trim(),
        firstName: vehicleRecord.customers.first_name || '',
        lastName: vehicleRecord.customers.last_name || '',
        email: vehicleRecord.customers.email || '',
        phone: vehicleRecord.customers.phone || '',
      };
    }

    return transformed;
  }
}

module.exports = { vehicleService: new VehicleService(), VehicleService };
