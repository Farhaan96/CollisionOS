import { create } from 'zustand';
import { customerService } from '../services/customerService';

const useCustomerStore = create((set, get) => ({
  // State
  customers: [],
  loading: false,
  error: null,
  lastFetch: null,
  selectedCustomer: null,

  // Actions
  fetchCustomers: async (filters = {}) => {
    set({ loading: true, error: null });
    try {
      const data = await customerService.getCustomers(filters);
      set({ 
        customers: data, 
        loading: false, 
        lastFetch: new Date(),
        error: null 
      });
      return data;
    } catch (error) {
      console.error('Error fetching customers:', error);
      set({ 
        loading: false, 
        error: error.message 
      });
      throw error;
    }
  },

  createCustomer: async (customerData) => {
    set({ loading: true, error: null });
    try {
      const newCustomer = await customerService.createCustomer(customerData);
      
      // Optimistically update local state
      set(state => ({
        customers: [...state.customers, newCustomer],
        loading: false,
        lastFetch: new Date()
      }));

      // Emit real-time event
      window.dispatchEvent(new CustomEvent('customerCreated', {
        detail: { customer: newCustomer }
      }));

      return newCustomer;
    } catch (error) {
      console.error('Error creating customer:', error);
      set({ 
        loading: false, 
        error: error.message 
      });
      throw error;
    }
  },

  updateCustomer: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      const updatedCustomer = await customerService.updateCustomer(id, updates);
      
      // Optimistically update local state
      set(state => ({
        customers: state.customers.map(customer => 
          customer.id === id ? { ...customer, ...updatedCustomer } : customer
        ),
        loading: false,
        lastFetch: new Date()
      }));

      // Emit real-time event
      window.dispatchEvent(new CustomEvent('customerUpdated', {
        detail: { customer: updatedCustomer, id }
      }));

      return updatedCustomer;
    } catch (error) {
      console.error('Error updating customer:', error);
      set({ 
        loading: false, 
        error: error.message 
      });
      throw error;
    }
  },

  deleteCustomer: async (id) => {
    set({ loading: true, error: null });
    try {
      await customerService.deleteCustomer(id);
      
      // Optimistically update local state
      set(state => ({
        customers: state.customers.filter(customer => customer.id !== id),
        loading: false,
        lastFetch: new Date()
      }));

      // Emit real-time event
      window.dispatchEvent(new CustomEvent('customerDeleted', {
        detail: { id }
      }));

      return true;
    } catch (error) {
      console.error('Error deleting customer:', error);
      set({ 
        loading: false, 
        error: error.message 
      });
      throw error;
    }
  },

  getCustomerById: (id) => {
    const { customers } = get();
    return customers.find(customer => customer.id === id);
  },

  searchCustomers: async (query, filters = {}) => {
    set({ loading: true, error: null });
    try {
      const data = await customerService.searchCustomers(query, filters);
      set({ 
        customers: data, 
        loading: false, 
        lastFetch: new Date(),
        error: null 
      });
      return data;
    } catch (error) {
      console.error('Error searching customers:', error);
      set({ 
        loading: false, 
        error: error.message 
      });
      throw error;
    }
  },

  setSelectedCustomer: (customer) => {
    set({ selectedCustomer: customer });
  },

  clearSelectedCustomer: () => {
    set({ selectedCustomer: null });
  },

  // Real-time update handlers
  handleCustomerUpdate: (updateData) => {
    const { customers } = get();
    
    if (updateData.eventType === 'INSERT') {
      set({ customers: [...customers, updateData.new] });
    } else if (updateData.eventType === 'UPDATE') {
      set({
        customers: customers.map(customer => 
          customer.id === updateData.new.id ? { ...customer, ...updateData.new } : customer
        )
      });
    } else if (updateData.eventType === 'DELETE') {
      set({
        customers: customers.filter(customer => customer.id !== updateData.old.id)
      });
    }
  },

  // BMS import event handler
  handleBMSImport: async (eventData) => {
    const { result } = eventData;
    if (result?.createdCustomer) {
      // Refresh customer list to include newly imported customer
      const { fetchCustomers } = get();
      await fetchCustomers();
    }
  },

  // Manual refresh
  refresh: () => {
    const { fetchCustomers } = get();
    return fetchCustomers();
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },

  // Get customer statistics
  getCustomerStats: () => {
    const { customers } = get();
    return {
      total: customers.length,
      active: customers.filter(c => c.customerStatus === 'active').length,
      inactive: customers.filter(c => c.customerStatus === 'inactive').length,
      individual: customers.filter(c => c.customerType === 'individual').length,
      business: customers.filter(c => c.customerType === 'business').length,
    };
  }
}));

// Initialize global event listeners for BMS imports after store is defined
if (typeof window !== 'undefined') {
  window.addEventListener('bmsImported', async (event) => {
    const { result } = event.detail;
    if (result?.createdCustomer) {
      // Get the current store instance and refresh customers
      const store = useCustomerStore.getState();
      await store.fetchCustomers();
    }
  });
}

export { useCustomerStore };
export default useCustomerStore;
