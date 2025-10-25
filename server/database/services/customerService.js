const { Customer, Vehicle, RepairOrderManagement } = require('../models');
const { queryHelpers } = require('../../utils/queryHelpers');
const { Op } = require('sequelize');

/**
 * Customer Service - Sequelize integration for customer management
 */
class CustomerService {
  constructor() {
    // No table name needed - using Sequelize models
  }

  /**
   * Find customers by criteria
   */
  async findCustomers(criteria = {}, shopId) {
    try {
      // Build where clause
      const where = {
        ...queryHelpers.forShop(shopId),
      };

      // Apply filters based on criteria
      if (criteria.email) {
        where.email = criteria.email;
      }
      if (criteria.phone) {
        where.phone = criteria.phone;
      }
      if (criteria.firstName && criteria.lastName) {
        where.firstName = criteria.firstName;
        where.lastName = criteria.lastName;
      }
      if (criteria.id) {
        where.id = criteria.id;
      }

      const customers = await Customer.findAll({ where });

      return customers.map(c => c.toJSON());
    } catch (error) {
      console.error('CustomerService.findCustomers error:', error);
      throw error;
    }
  }

  /**
   * Create a new customer
   */
  async createCustomer(customerData, shopId) {
    try {
      // Generate customer number if not provided
      const customerNumber =
        customerData.customerNumber || `CUST-${Date.now()}`;

      // Build customer record with camelCase fields
      const customerRecord = {
        customerNumber: customerNumber,
        firstName:
          customerData.firstName || customerData.name?.split(' ')[0] || '',
        lastName:
          customerData.lastName ||
          customerData.name?.split(' ').slice(1).join(' ') ||
          '',
        shopId: shopId,
        customerType: customerData.customerType || 'individual',
        customerStatus: customerData.status || 'active',
        isActive: true,
      };

      // Add optional fields only if provided
      if (customerData.email) customerRecord.email = customerData.email;
      if (customerData.phone) customerRecord.phone = customerData.phone;
      if (customerData.address) customerRecord.address = customerData.address;
      if (customerData.city) customerRecord.city = customerData.city;
      if (customerData.state) customerRecord.state = customerData.state;
      if (customerData.zip || customerData.zipCode) {
        customerRecord.zipCode = customerData.zip || customerData.zipCode;
      }

      const customer = await Customer.create(customerRecord);

      console.log('Customer created successfully:', customer.id);

      // Convert back to frontend format
      return this.transformToFrontend(customer.toJSON());
    } catch (error) {
      console.error('CustomerService.createCustomer error:', error);
      throw error;
    }
  }

  /**
   * Update existing customer
   */
  async updateCustomer(customerId, updateData, shopId) {
    try {
      const customerRecord = {
        firstName: updateData.firstName,
        lastName: updateData.lastName,
        email: updateData.email,
        phone: updateData.phone,
        address: updateData.address,
        city: updateData.city,
        state: updateData.state,
        zipCode: updateData.zip || updateData.zipCode,
      };

      // Remove undefined values
      Object.keys(customerRecord).forEach(key => {
        if (customerRecord[key] === undefined) {
          delete customerRecord[key];
        }
      });

      const [affectedRows] = await Customer.update(customerRecord, {
        where: { id: customerId },
      });

      if (affectedRows === 0) {
        throw new Error('Customer not found or no changes made');
      }

      const customer = await Customer.findByPk(customerId);

      console.log('Customer updated successfully:', customerId);

      // Convert back to frontend format
      return this.transformToFrontend(customer.toJSON());
    } catch (error) {
      console.error('CustomerService.updateCustomer error:', error);
      throw error;
    }
  }

  /**
   * Get customer by ID
   */
  async getCustomerById(customerId) {
    try {
      const customer = await Customer.findByPk(customerId);

      if (!customer) {
        return null; // Not found
      }

      return this.transformToFrontend(customer.toJSON());
    } catch (error) {
      console.error('CustomerService.getCustomerById error:', error);
      throw error;
    }
  }

  /**
   * Get all customers
   */
  async getAllCustomers(options = {}, shopId) {
    try {
      const where = {
        ...queryHelpers.forShop(shopId),
      };

      const queryOptions = { where };

      // Apply sorting
      if (options.sortBy) {
        queryOptions.order = [[options.sortBy, options.ascending !== false ? 'ASC' : 'DESC']];
      } else {
        queryOptions.order = [['createdAt', 'DESC']];
      }

      // Apply pagination
      if (options.limit) {
        queryOptions.limit = options.limit;
      }
      if (options.offset) {
        queryOptions.offset = options.offset;
      }

      const customers = await Customer.findAll(queryOptions);

      return customers.map(customer => this.transformToFrontend(customer.toJSON()));
    } catch (error) {
      console.error('CustomerService.getAllCustomers error:', error);
      throw error;
    }
  }

  /**
   * Search customers by text
   */
  async searchCustomers(searchTerm, shopId) {
    try {
      const where = {
        ...queryHelpers.forShop(shopId),
        ...queryHelpers.search(
          ['firstName', 'lastName', 'email', 'phone'],
          searchTerm
        ),
      };

      const customers = await Customer.findAll({
        where,
        order: [['createdAt', 'DESC']],
      });

      return customers.map(customer => this.transformToFrontend(customer.toJSON()));
    } catch (error) {
      console.error('CustomerService.searchCustomers error:', error);
      throw error;
    }
  }

  /**
   * Delete customer
   */
  async deleteCustomer(customerId, shopId) {
    try {
      const affectedRows = await Customer.destroy({
        where: {
          id: customerId,
          shopId: shopId,
        },
      });

      if (affectedRows === 0) {
        throw new Error('Customer not found');
      }

      console.log('Customer deleted successfully:', customerId);
      return { success: true };
    } catch (error) {
      console.error('CustomerService.deleteCustomer error:', error);
      throw error;
    }
  }

  /**
   * Transform database record to frontend format
   */
  transformToFrontend(customerRecord) {
    if (!customerRecord) return null;

    return {
      id: customerRecord.id,
      firstName: customerRecord.firstName || '',
      lastName: customerRecord.lastName || '',
      name: `${customerRecord.firstName || ''} ${customerRecord.lastName || ''}`.trim(),
      email: customerRecord.email || '',
      phone: customerRecord.phone || '',
      address: customerRecord.address || '',
      city: customerRecord.city || '',
      state: customerRecord.state || '',
      zip: customerRecord.zipCode || '',
      zipCode: customerRecord.zipCode || '',
      insurance:
        customerRecord.primaryInsuranceCompany || '',
      customerType: customerRecord.customerType || 'individual',
      status: customerRecord.customerStatus || 'active',
      createdAt: customerRecord.createdAt,
      updatedAt: customerRecord.updatedAt,
    };
  }
}

module.exports = { customerService: new CustomerService(), CustomerService };
