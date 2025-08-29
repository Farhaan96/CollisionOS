import customerService from '../../../src/services/customerService';

// Mock fetch
global.fetch = jest.fn();

describe('CustomerService', () => {
  beforeEach(() => {
    fetch.mockClear();
    localStorage.setItem('token', 'test-token');
  });

  afterEach(() => {
    jest.resetAllMocks();
    localStorage.clear();
  });

  const mockCustomer = {
    id: 1,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '555-0123',
    address: '123 Main St',
    city: 'Anytown',
    state: 'ST',
    zipCode: '12345',
    insuranceCompany: 'State Farm',
    insurancePolicyNumber: 'SF123456'
  };

  describe('getCustomers', () => {
    test('successfully fetches customers list', async () => {
      const mockResponse = {
        success: true,
        data: [mockCustomer]
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse
      });

      const result = await customerService.getCustomers();

      expect(fetch).toHaveBeenCalledWith('/api/customers', {
        headers: {
          'Authorization': 'Bearer test-token'
        }
      });

      expect(result).toEqual([mockCustomer]);
    });

    test('handles empty customers list', async () => {
      const mockResponse = {
        success: true,
        data: []
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse
      });

      const result = await customerService.getCustomers();
      
      expect(result).toEqual([]);
    });

    test('handles fetch error', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Server error' })
      });

      await expect(customerService.getCustomers())
        .rejects.toThrow('Server error');
    });

    test('handles network error', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(customerService.getCustomers())
        .rejects.toThrow('Network error');
    });
  });

  describe('getCustomerById', () => {
    test('successfully fetches customer by ID', async () => {
      const mockResponse = {
        success: true,
        data: mockCustomer
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse
      });

      const result = await customerService.getCustomerById(1);

      expect(fetch).toHaveBeenCalledWith('/api/customers/1', {
        headers: {
          'Authorization': 'Bearer test-token'
        }
      });

      expect(result).toEqual(mockCustomer);
    });

    test('handles customer not found', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Customer not found' })
      });

      await expect(customerService.getCustomerById(999))
        .rejects.toThrow('Customer not found');
    });

    test('handles invalid customer ID', async () => {
      await expect(customerService.getCustomerById(null))
        .rejects.toThrow();
      
      await expect(customerService.getCustomerById(undefined))
        .rejects.toThrow();
      
      await expect(customerService.getCustomerById(''))
        .rejects.toThrow();
    });
  });

  describe('createCustomer', () => {
    test('successfully creates new customer', async () => {
      const newCustomerData = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        phone: '555-0456'
      };

      const mockResponse = {
        success: true,
        data: { ...newCustomerData, id: 2 }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockResponse
      });

      const result = await customerService.createCustomer(newCustomerData);

      expect(fetch).toHaveBeenCalledWith('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify(newCustomerData)
      });

      expect(result).toEqual({ ...newCustomerData, id: 2 });
    });

    test('handles validation errors', async () => {
      const invalidData = {
        firstName: '',
        lastName: '',
        email: 'invalid-email'
      };

      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ 
          error: 'Validation failed',
          details: ['First name is required', 'Last name is required', 'Invalid email format']
        })
      });

      await expect(customerService.createCustomer(invalidData))
        .rejects.toThrow('Validation failed');
    });

    test('handles missing required data', async () => {
      await expect(customerService.createCustomer(null))
        .rejects.toThrow();
      
      await expect(customerService.createCustomer({}))
        .rejects.toThrow();
    });
  });

  describe('updateCustomer', () => {
    test('successfully updates existing customer', async () => {
      const updateData = {
        firstName: 'Johnny',
        phone: '555-9999'
      };

      const updatedCustomer = { ...mockCustomer, ...updateData };

      const mockResponse = {
        success: true,
        data: updatedCustomer
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse
      });

      const result = await customerService.updateCustomer(1, updateData);

      expect(fetch).toHaveBeenCalledWith('/api/customers/1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify(updateData)
      });

      expect(result).toEqual(updatedCustomer);
    });

    test('handles update validation errors', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Invalid phone number format' })
      });

      await expect(customerService.updateCustomer(1, { phone: 'invalid' }))
        .rejects.toThrow('Invalid phone number format');
    });

    test('handles customer not found during update', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Customer not found' })
      });

      await expect(customerService.updateCustomer(999, { firstName: 'Test' }))
        .rejects.toThrow('Customer not found');
    });
  });

  describe('deleteCustomer', () => {
    test('successfully deletes customer', async () => {
      const mockResponse = {
        success: true,
        message: 'Customer deleted successfully'
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse
      });

      const result = await customerService.deleteCustomer(1);

      expect(fetch).toHaveBeenCalledWith('/api/customers/1', {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer test-token'
        }
      });

      expect(result).toEqual(mockResponse);
    });

    test('handles delete customer not found', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Customer not found' })
      });

      await expect(customerService.deleteCustomer(999))
        .rejects.toThrow('Customer not found');
    });

    test('handles delete with active jobs', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({ error: 'Cannot delete customer with active jobs' })
      });

      await expect(customerService.deleteCustomer(1))
        .rejects.toThrow('Cannot delete customer with active jobs');
    });
  });

  describe('searchCustomers', () => {
    test('successfully searches customers by query', async () => {
      const searchResults = [mockCustomer];
      const mockResponse = {
        success: true,
        data: searchResults
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse
      });

      const result = await customerService.searchCustomers('John');

      expect(fetch).toHaveBeenCalledWith('/api/customers/search?q=John', {
        headers: {
          'Authorization': 'Bearer test-token'
        }
      });

      expect(result).toEqual(searchResults);
    });

    test('handles empty search results', async () => {
      const mockResponse = {
        success: true,
        data: []
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse
      });

      const result = await customerService.searchCustomers('NonExistent');
      
      expect(result).toEqual([]);
    });

    test('handles empty search query', async () => {
      const result = await customerService.searchCustomers('');
      
      expect(result).toEqual([]);
      expect(fetch).not.toHaveBeenCalled();
    });
  });

  describe('authorization', () => {
    test('includes authorization header in all requests', async () => {
      fetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: [] })
      });

      await customerService.getCustomers();
      await customerService.getCustomerById(1);
      await customerService.createCustomer(mockCustomer);
      await customerService.updateCustomer(1, {});
      await customerService.deleteCustomer(1);
      await customerService.searchCustomers('test');

      // Check that all calls include authorization header
      const calls = fetch.mock.calls;
      calls.forEach(call => {
        const [, options] = call;
        expect(options.headers).toHaveProperty('Authorization', 'Bearer test-token');
      });
    });

    test('handles requests without token', async () => {
      localStorage.removeItem('token');

      await expect(customerService.getCustomers())
        .rejects.toThrow();
    });
  });
});