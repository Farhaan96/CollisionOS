# Customer & Vehicle Components - Quick Usage Guide

**Quick reference for using the new Customer and Vehicle CRUD components**

---

## Quick Import Reference

```javascript
// Autocomplete Components
import { CustomerAutocomplete, VehicleAutocomplete } from '../../components/Common';

// Form Dialogs
import { CustomerForm } from '../../components/Customer/CustomerForm';
import VehicleFormDialog from '../../components/Vehicle/VehicleFormDialog';

// Services
import { customerService } from '../../services/customerService';
import { vehicleService } from '../../services/vehicleService';
import { vinService } from '../../services/vinService';
```

---

## 1. Using CustomerAutocomplete

### Basic Usage
```javascript
import React, { useState } from 'react';
import { CustomerAutocomplete } from '../../components/Common';

const MyComponent = () => {
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerFormOpen, setCustomerFormOpen] = useState(false);

  return (
    <>
      <CustomerAutocomplete
        value={selectedCustomer}
        onChange={setSelectedCustomer}
        onCreateNew={() => setCustomerFormOpen(true)}
        required
        label="Select Customer"
      />

      {/* Customer Form Dialog */}
      <CustomerForm
        open={customerFormOpen}
        onClose={() => setCustomerFormOpen(false)}
        onSave={(newCustomer) => {
          setSelectedCustomer(newCustomer);
          setCustomerFormOpen(false);
        }}
      />
    </>
  );
};
```

### With Validation
```javascript
const [errors, setErrors] = useState({});

<CustomerAutocomplete
  value={selectedCustomer}
  onChange={(customer) => {
    setSelectedCustomer(customer);
    setErrors(prev => ({ ...prev, customer: null }));
  }}
  onCreateNew={() => setCustomerFormOpen(true)}
  required
  error={!!errors.customer}
  helperText={errors.customer}
/>

// Validation
if (!selectedCustomer) {
  setErrors(prev => ({ ...prev, customer: 'Customer is required' }));
}
```

---

## 2. Using VehicleAutocomplete

### Basic Usage
```javascript
import React, { useState } from 'react';
import { VehicleAutocomplete } from '../../components/Common';

const MyComponent = () => {
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [vehicleFormOpen, setVehicleFormOpen] = useState(false);

  return (
    <>
      <VehicleAutocomplete
        value={selectedVehicle}
        onChange={setSelectedVehicle}
        onCreateNew={() => setVehicleFormOpen(true)}
        required
        label="Select Vehicle"
      />

      {/* Vehicle Form Dialog */}
      <VehicleFormDialog
        open={vehicleFormOpen}
        onClose={() => setVehicleFormOpen(false)}
        onSave={(newVehicle) => {
          setSelectedVehicle(newVehicle);
          setVehicleFormOpen(false);
        }}
      />
    </>
  );
};
```

### Filtered by Customer
```javascript
const [selectedCustomer, setSelectedCustomer] = useState(null);
const [selectedVehicle, setSelectedVehicle] = useState(null);

<VehicleAutocomplete
  value={selectedVehicle}
  onChange={setSelectedVehicle}
  customerId={selectedCustomer?.id}
  onCreateNew={() => setVehicleFormOpen(true)}
  required
  disabled={!selectedCustomer}
  label="Select Vehicle"
  helperText={!selectedCustomer ? 'Select a customer first' : ''}
/>
```

---

## 3. Complete RO Form Example

### Customer + Vehicle Selection
```javascript
import React, { useState } from 'react';
import { Grid } from '@mui/material';
import { CustomerAutocomplete, VehicleAutocomplete } from '../../components/Common';
import { CustomerForm } from '../../components/Customer/CustomerForm';
import VehicleFormDialog from '../../components/Vehicle/VehicleFormDialog';

const ROForm = () => {
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [customerFormOpen, setCustomerFormOpen] = useState(false);
  const [vehicleFormOpen, setVehicleFormOpen] = useState(false);
  const [errors, setErrors] = useState({});

  const handleCustomerChange = (customer) => {
    setSelectedCustomer(customer);
    setSelectedVehicle(null); // Reset vehicle when customer changes
    setErrors(prev => ({ ...prev, customer: null }));
  };

  const handleVehicleChange = (vehicle) => {
    setSelectedVehicle(vehicle);
    setErrors(prev => ({ ...prev, vehicle: null }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!selectedCustomer) newErrors.customer = 'Customer is required';
    if (!selectedVehicle) newErrors.vehicle = 'Vehicle is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    // Create RO with customer and vehicle
    const roData = {
      customerId: selectedCustomer.id,
      vehicleId: selectedVehicle.id,
      // ... other RO fields
    };

    // Submit RO...
  };

  return (
    <>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <CustomerAutocomplete
            value={selectedCustomer}
            onChange={handleCustomerChange}
            onCreateNew={() => setCustomerFormOpen(true)}
            required
            error={!!errors.customer}
            helperText={errors.customer}
            label="Customer *"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <VehicleAutocomplete
            value={selectedVehicle}
            onChange={handleVehicleChange}
            customerId={selectedCustomer?.id}
            onCreateNew={() => setVehicleFormOpen(true)}
            required
            error={!!errors.vehicle}
            helperText={errors.vehicle || (!selectedCustomer ? 'Select customer first' : '')}
            label="Vehicle *"
            disabled={!selectedCustomer}
          />
        </Grid>
      </Grid>

      {/* Dialogs */}
      <CustomerForm
        open={customerFormOpen}
        onClose={() => setCustomerFormOpen(false)}
        onSave={(newCustomer) => {
          setSelectedCustomer(newCustomer);
          setCustomerFormOpen(false);
        }}
      />

      <VehicleFormDialog
        open={vehicleFormOpen}
        customerId={selectedCustomer?.id}
        onClose={() => setVehicleFormOpen(false)}
        onSave={(newVehicle) => {
          setSelectedVehicle(newVehicle);
          setVehicleFormOpen(false);
        }}
      />
    </>
  );
};
```

---

## 4. Using Customer Service

### Get All Customers
```javascript
import { customerService } from '../../services/customerService';

const loadCustomers = async () => {
  try {
    const customers = await customerService.getCustomers({
      status: 'active',
      type: 'individual',
      search: 'john',
    });
    console.log(customers);
  } catch (error) {
    console.error('Error loading customers:', error);
  }
};
```

### Get Customer by ID
```javascript
const loadCustomer = async (customerId) => {
  try {
    const customer = await customerService.getCustomerById(customerId);
    console.log(customer);
  } catch (error) {
    console.error('Error loading customer:', error);
  }
};
```

### Create Customer
```javascript
const createCustomer = async () => {
  try {
    const newCustomer = await customerService.createCustomer({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '555-1234',
      customerType: 'individual',
      customerStatus: 'active',
    });
    console.log('Created:', newCustomer);
  } catch (error) {
    console.error('Error creating customer:', error);
  }
};
```

### Update Customer
```javascript
const updateCustomer = async (customerId) => {
  try {
    const updated = await customerService.updateCustomer(customerId, {
      email: 'newemail@example.com',
      phone: '555-5678',
    });
    console.log('Updated:', updated);
  } catch (error) {
    console.error('Error updating customer:', error);
  }
};
```

### Get Customer's Vehicles
```javascript
const loadCustomerVehicles = async (customerId) => {
  try {
    const vehicles = await customerService.getCustomerVehicles(customerId);
    console.log(vehicles);
  } catch (error) {
    console.error('Error loading vehicles:', error);
  }
};
```

---

## 5. Using Vehicle Service

### Get All Vehicles
```javascript
import { vehicleService } from '../../services/vehicleService';

const loadVehicles = async () => {
  try {
    const vehicles = await vehicleService.getVehicles({
      customerId: 'customer-id',
      year: 2020,
      make: 'Honda',
    });
    console.log(vehicles);
  } catch (error) {
    console.error('Error loading vehicles:', error);
  }
};
```

### Create Vehicle with VIN Decode
```javascript
const createVehicle = async () => {
  try {
    const newVehicle = await vehicleService.createVehicle({
      customerId: 'customer-id',
      vin: '1HGBH41JXMN109186',
      decodeVin: true, // Auto-decode VIN
      color: 'Blue',
      licensePlate: 'ABC123',
      mileage: 50000,
    });
    console.log('Created:', newVehicle);
  } catch (error) {
    console.error('Error creating vehicle:', error);
  }
};
```

### Manual VIN Decode
```javascript
const decodeVIN = async (vin) => {
  try {
    const result = await vehicleService.decodeVIN(vin);

    if (result.success) {
      console.log('Decoded vehicle:', result.vehicle);
      // Auto-fill form fields
      setFormData({
        year: result.vehicle.year,
        make: result.vehicle.make,
        model: result.vehicle.model,
        trim: result.vehicle.trim,
        engineSize: result.vehicle.engine,
        transmission: result.vehicle.transmission,
      });
    }
  } catch (error) {
    console.error('Error decoding VIN:', error);
  }
};
```

---

## 6. Using VIN Service

### Validate VIN Format (Client-Side)
```javascript
import { vinService } from '../../services/vinService';

const validateVIN = (vin) => {
  const result = vinService.validateVINFormat(vin);

  if (!result.valid) {
    console.error('Invalid VIN:', result.errors);
    return false;
  }

  console.log('Valid VIN:', result.normalized);
  return true;
};
```

### Decode VIN
```javascript
const decodeVIN = async (vin) => {
  try {
    const result = await vinService.decodeVIN(vin);

    console.log('Source:', result.source); // 'nhtsa_api', 'local_decoder', or 'cache'
    console.log('Vehicle:', result.vehicle);

    return result.vehicle;
  } catch (error) {
    console.error('VIN decode error:', error);
  }
};
```

### Extract Basic VIN Info (No API Call)
```javascript
const extractVINInfo = (vin) => {
  const info = vinService.extractBasicVINInfo(vin);

  console.log('WMI:', info.wmi); // World Manufacturer Identifier
  console.log('VDS:', info.vds); // Vehicle Descriptor Section
  console.log('Check Digit:', info.checkDigit);
  console.log('Model Year:', info.modelYear);
  console.log('Country:', vinService.getCountryFromVIN(info.countryCode));
};
```

---

## 7. Complete VehicleFormDialog Example

### Standalone Usage
```javascript
import React, { useState } from 'react';
import { Button } from '@mui/material';
import VehicleFormDialog from '../../components/Vehicle/VehicleFormDialog';

const VehicleManagement = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);

  const handleAddVehicle = () => {
    setEditingVehicle(null);
    setDialogOpen(true);
  };

  const handleEditVehicle = (vehicle) => {
    setEditingVehicle(vehicle);
    setDialogOpen(true);
  };

  const handleSave = async (vehicleData) => {
    console.log('Saved vehicle:', vehicleData);
    // Refresh vehicle list
    await loadVehicles();
    setDialogOpen(false);
  };

  return (
    <>
      <Button onClick={handleAddVehicle}>Add Vehicle</Button>

      <VehicleFormDialog
        open={dialogOpen}
        vehicle={editingVehicle}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
      />
    </>
  );
};
```

### Pre-fill Customer
```javascript
<VehicleFormDialog
  open={dialogOpen}
  vehicle={editingVehicle}
  customerId={selectedCustomer?.id} // Pre-select customer
  onClose={() => setDialogOpen(false)}
  onSave={handleSave}
/>
```

---

## 8. Navigation Examples

### Navigate to Customer Detail Page
```javascript
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();

// View customer details
const handleViewCustomer = (customer) => {
  navigate(`/customers/${customer.id}`);
};
```

### Navigate to Vehicle List
```javascript
// View all vehicles
navigate('/vehicles');

// View vehicles for specific customer
navigate('/vehicles', { state: { customerId: customer.id } });
```

---

## 9. Common Patterns

### Loading States
```javascript
const [loading, setLoading] = useState(false);

const loadData = async () => {
  setLoading(true);
  try {
    const data = await customerService.getCustomers();
    setCustomers(data);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    setLoading(false);
  }
};

return loading ? <LoadingSpinner /> : <DataTable data={customers} />;
```

### Error Handling
```javascript
const [error, setError] = useState(null);

const saveData = async () => {
  setError(null);
  try {
    await customerService.createCustomer(data);
  } catch (err) {
    setError(err.message || 'An error occurred');
  }
};

return (
  <>
    {error && <Alert severity="error">{error}</Alert>}
    {/* Form fields */}
  </>
);
```

### Debounced Search
```javascript
import { useDebounce } from '../../hooks/useDebounce';

const [searchTerm, setSearchTerm] = useState('');
const debouncedSearch = useDebounce(searchTerm, 300);

useEffect(() => {
  if (debouncedSearch) {
    performSearch(debouncedSearch);
  }
}, [debouncedSearch]);
```

---

## 10. Testing Tips

### Manual Testing Script
```javascript
// 1. Create customer
const customer = await customerService.createCustomer({
  firstName: 'Test',
  lastName: 'User',
  phone: '555-0001',
  email: 'test@example.com',
  customerType: 'individual',
});
console.log('Created customer:', customer);

// 2. Decode VIN
const decoded = await vinService.decodeVIN('1HGBH41JXMN109186');
console.log('Decoded VIN:', decoded);

// 3. Create vehicle
const vehicle = await vehicleService.createVehicle({
  customerId: customer.id,
  vin: '1HGBH41JXMN109186',
  decodeVin: true,
  color: 'Blue',
});
console.log('Created vehicle:', vehicle);

// 4. Load customer's vehicles
const vehicles = await customerService.getCustomerVehicles(customer.id);
console.log('Customer vehicles:', vehicles);
```

---

## Quick Reference Cheat Sheet

| Task | Component/Service | Key Method |
|------|------------------|------------|
| Select customer in form | `CustomerAutocomplete` | `onChange` |
| Select vehicle in form | `VehicleAutocomplete` | `onChange` |
| Create/edit customer | `CustomerForm` | `onSave` |
| Create/edit vehicle | `VehicleFormDialog` | `onSave` |
| List all customers | `customerService` | `getCustomers()` |
| List all vehicles | `vehicleService` | `getVehicles()` |
| Decode VIN | `vinService` | `decodeVIN()` |
| Get customer's vehicles | `customerService` | `getCustomerVehicles()` |
| Search customers | `customerService` | `getCustomerSuggestions()` |
| Validate VIN | `vinService` | `validateVINFormat()` |

---

**For more details, see `CUSTOMER_VEHICLE_CRUD_IMPLEMENTATION.md`**
