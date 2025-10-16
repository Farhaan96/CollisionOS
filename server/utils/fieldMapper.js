/**
 * Field Mapper Utility
 * Converts between snake_case (database) and camelCase (frontend)
 */

/**
 * Convert snake_case to camelCase
 */
const snakeToCamel = (str) => {
  return str.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
};

/**
 * Convert camelCase to snake_case
 */
const camelToSnake = (str) => {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
};

/**
 * Convert object keys from snake_case to camelCase
 */
const objectToCamel = (obj) => {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => objectToCamel(item));
  }

  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = snakeToCamel(key);

    // Recursively convert nested objects
    if (value !== null && typeof value === 'object') {
      result[camelKey] = objectToCamel(value);
    } else {
      result[camelKey] = value;
    }
  }

  return result;
};

/**
 * Convert object keys from camelCase to snake_case
 */
const objectToSnake = (obj) => {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => objectToSnake(item));
  }

  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = camelToSnake(key);

    // Recursively convert nested objects
    if (value !== null && typeof value === 'object') {
      result[snakeKey] = objectToSnake(value);
    } else {
      result[snakeKey] = value;
    }
  }

  return result;
};

/**
 * Map job fields from database to frontend format
 */
const mapJobToFrontend = (job) => {
  if (!job) return null;

  return {
    id: job.id,
    roNumber: job.ro_number || job.jobNumber,
    jobNumber: job.job_number || job.jobNumber,
    customerId: job.customer_id || job.customerId,
    vehicleId: job.vehicle_id || job.vehicleId,
    status: job.status,
    priority: job.priority,
    customer: job.customer ? {
      name: job.customer.first_name
        ? `${job.customer.first_name} ${job.customer.last_name}`.trim()
        : job.customer.name,
      firstName: job.customer.first_name || job.customer.firstName,
      lastName: job.customer.last_name || job.customer.lastName,
      phone: job.customer.phone,
      email: job.customer.email,
    } : null,
    vehicle: job.vehicle ? {
      year: job.vehicle.year,
      make: job.vehicle.make,
      model: job.vehicle.model,
      vin: job.vehicle.vin,
      display: `${job.vehicle.year || ''} ${job.vehicle.make || ''} ${job.vehicle.model || ''}`.trim(),
    } : null,
    insurer: job.insurer || job.insurance_company,
    claimNumber: job.claim_number || job.claimNumber,
    estimator: job.estimator,
    dueDate: job.due_date || job.target_delivery_date || job.targetDeliveryDate,
    rentalCoverage: job.rental_coverage || job.rentalCoverage,
    totalAmount: job.total_amount || job.totalAmount,
    createdAt: job.created_at || job.createdAt,
    updatedAt: job.updated_at || job.updatedAt,
  };
};

/**
 * Map customer fields from database to frontend format
 */
const mapCustomerToFrontend = (customer) => {
  if (!customer) return null;

  return {
    id: customer.id,
    firstName: customer.first_name || customer.firstName,
    lastName: customer.last_name || customer.lastName,
    name: customer.first_name
      ? `${customer.first_name} ${customer.last_name}`.trim()
      : customer.name,
    phone: customer.phone,
    email: customer.email,
    address: customer.address || customer.address1,
    city: customer.city,
    state: customer.state,
    zip: customer.zip || customer.postal_code || customer.postalCode,
    createdAt: customer.created_at || customer.createdAt,
  };
};

/**
 * Map vehicle fields from database to frontend format
 */
const mapVehicleToFrontend = (vehicle) => {
  if (!vehicle) return null;

  return {
    id: vehicle.id,
    year: vehicle.year,
    make: vehicle.make,
    model: vehicle.model,
    vin: vehicle.vin,
    color: vehicle.color || vehicle.colour,
    licensePlate: vehicle.license_plate || vehicle.plate || vehicle.licensePlate,
    odometer: vehicle.odometer,
    display: `${vehicle.year || ''} ${vehicle.make || ''} ${vehicle.model || ''}`.trim(),
  };
};

module.exports = {
  snakeToCamel,
  camelToSnake,
  objectToCamel,
  objectToSnake,
  mapJobToFrontend,
  mapCustomerToFrontend,
  mapVehicleToFrontend,
};
