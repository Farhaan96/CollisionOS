/**
 * useApi Hooks - Usage Examples
 *
 * This file demonstrates how to use the custom API hooks
 * in real-world CollisionOS scenarios
 */

import React from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Alert,
  List,
  ListItem,
  Typography,
  TextField,
} from '@mui/material';
import { useApi, useMutation, useApiWithPagination, useApiCache } from './useApi';
import roService from '../services/roService';
import customerService from '../services/customerService';
import partsService from '../services/partsService';
import { toast } from 'react-hot-toast';

// ============================================================================
// Example 1: Simple Data Fetching with useApi
// ============================================================================

export function RepairOrdersList() {
  const { data: repairOrders, loading, error, refetch } = useApi(
    () => roService.getRepairOrders({ limit: 100 }),
    [] // Empty deps = fetch once on mount
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" action={<Button onClick={refetch}>Retry</Button>}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Button onClick={refetch} sx={{ mb: 2 }}>
        Refresh
      </Button>
      <List>
        {repairOrders.map((ro) => (
          <ListItem key={ro.id}>
            {ro.ro_number} - {ro.customer?.first_name} {ro.customer?.last_name}
          </ListItem>
        ))}
      </List>
    </Box>
  );
}

// ============================================================================
// Example 2: Mutations with useMutation
// ============================================================================

export function CustomerManagement() {
  // Fetch customers list
  const { data: customers, loading, refetch } = useApi(
    () => customerService.getAll(),
    []
  );

  // Delete mutation
  const { mutate: deleteCustomer, loading: deleting } = useMutation(
    (id) => customerService.delete(id),
    {
      onSuccess: (data, customerId) => {
        toast.success('Customer deleted successfully');
        refetch(); // Reload customers list
      },
      onError: (err) => {
        toast.error(`Failed to delete: ${err.message}`);
      },
    }
  );

  // Update mutation
  const { mutate: updateCustomer, loading: updating } = useMutation(
    (id, data) => customerService.update(id, data),
    {
      onSuccess: () => {
        toast.success('Customer updated');
        refetch();
      },
    }
  );

  const handleDelete = (customerId) => {
    if (window.confirm('Are you sure?')) {
      deleteCustomer(customerId);
    }
  };

  if (loading) return <CircularProgress />;

  return (
    <Box>
      <List>
        {customers?.map((customer) => (
          <ListItem
            key={customer.id}
            secondaryAction={
              <Button
                onClick={() => handleDelete(customer.id)}
                disabled={deleting}
                color="error"
              >
                Delete
              </Button>
            }
          >
            <Typography>
              {customer.first_name} {customer.last_name}
            </Typography>
          </ListItem>
        ))}
      </List>
    </Box>
  );
}

// ============================================================================
// Example 3: Paginated Data with useApiWithPagination
// ============================================================================

export function PartsCatalog() {
  const {
    data: parts,
    loading,
    error,
    page,
    limit,
    setPage,
    setLimit,
    setFilters,
    totalPages,
    totalCount,
    refetch,
  } = useApiWithPagination(
    (params) => partsService.getAll(params),
    { page: 1, limit: 25 }
  );

  const [searchTerm, setSearchTerm] = React.useState('');

  const handleSearch = () => {
    setFilters({ search: searchTerm });
  };

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
        <TextField
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search parts..."
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <Button onClick={handleSearch}>Search</Button>
      </Box>

      <Typography variant="body2" sx={{ mb: 2 }}>
        Showing {parts?.length || 0} of {totalCount} parts
      </Typography>

      <List>
        {parts?.map((part) => (
          <ListItem key={part.id}>
            {part.description} - ${part.unit_cost}
          </ListItem>
        ))}
      </List>

      <Box sx={{ mt: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
        <Button
          onClick={() => setPage(page - 1)}
          disabled={page === 1}
        >
          Previous
        </Button>
        <Typography>
          Page {page} of {totalPages}
        </Typography>
        <Button
          onClick={() => setPage(page + 1)}
          disabled={page === totalPages}
        >
          Next
        </Button>
      </Box>
    </Box>
  );
}

// ============================================================================
// Example 4: Cached Data with useApiCache
// ============================================================================

export function VehicleMakeSelector() {
  // This data will be cached for 10 minutes
  const { data: makes, loading, invalidate } = useApiCache(
    'vehicle-makes',
    () => vehicleService.getMakes(),
    10 * 60 * 1000 // Cache for 10 minutes
  );

  if (loading) return <CircularProgress size={20} />;

  return (
    <Box>
      <select>
        <option value="">Select Make</option>
        {makes?.map((make) => (
          <option key={make.id} value={make.id}>
            {make.name}
          </option>
        ))}
      </select>
      <Button size="small" onClick={invalidate}>
        Clear Cache
      </Button>
    </Box>
  );
}

// ============================================================================
// Example 5: Dependent Queries
// ============================================================================

export function CustomerOrdersView({ customerId }) {
  // First, fetch customer details
  const {
    data: customer,
    loading: customerLoading,
    error: customerError,
  } = useApi(() => customerService.getById(customerId), [customerId]);

  // Then fetch their orders (only when customer is loaded)
  const {
    data: orders,
    loading: ordersLoading,
    error: ordersError,
  } = useApi(
    () => roService.getRepairOrders({ customerId: customer?.id }),
    [customer?.id],
    {
      immediate: !!customer, // Only fetch if customer exists
    }
  );

  if (customerLoading) return <CircularProgress />;
  if (customerError) return <Alert severity="error">{customerError}</Alert>;

  return (
    <Box>
      <Typography variant="h6">
        {customer?.first_name} {customer?.last_name}'s Orders
      </Typography>

      {ordersLoading ? (
        <CircularProgress />
      ) : ordersError ? (
        <Alert severity="error">{ordersError}</Alert>
      ) : (
        <List>
          {orders?.map((order) => (
            <ListItem key={order.id}>{order.ro_number}</ListItem>
          ))}
        </List>
      )}
    </Box>
  );
}

// ============================================================================
// Example 6: Optimistic Updates
// ============================================================================

export function PartStatusUpdater({ partId, initialStatus }) {
  const [localStatus, setLocalStatus] = React.useState(initialStatus);

  const { mutate: updateStatus, loading } = useMutation(
    (newStatus) => partsService.updateStatus(partId, newStatus),
    {
      onMutate: (newStatus) => {
        // Optimistically update UI immediately
        setLocalStatus(newStatus);
      },
      onError: (err) => {
        // Revert on error
        setLocalStatus(initialStatus);
        toast.error('Failed to update status');
      },
      onSuccess: (data, newStatus) => {
        toast.success('Status updated');
        // Keep the optimistic update
      },
    }
  );

  return (
    <Box>
      <Typography>Current Status: {localStatus}</Typography>
      <Button
        onClick={() => updateStatus('ordered')}
        disabled={loading}
      >
        Mark as Ordered
      </Button>
      <Button
        onClick={() => updateStatus('received')}
        disabled={loading}
      >
        Mark as Received
      </Button>
    </Box>
  );
}

// ============================================================================
// Example 7: Polling (Real-time Updates)
// ============================================================================

export function LiveROStatus({ roId }) {
  const { data: ro, loading, refetch } = useApi(
    () => roService.getRepairOrder(roId),
    [roId]
  );

  // Poll every 5 seconds
  React.useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 5000);

    return () => clearInterval(interval);
  }, [refetch]);

  if (loading && !ro) return <CircularProgress />;

  return (
    <Box>
      <Typography variant="h6">{ro?.ro_number}</Typography>
      <Typography>Status: {ro?.status}</Typography>
      <Typography variant="caption" color="text.secondary">
        Auto-refreshing every 5 seconds
      </Typography>
    </Box>
  );
}

// ============================================================================
// Example 8: Complex Form with Multiple Mutations
// ============================================================================

export function RepairOrderCreator() {
  const [formData, setFormData] = React.useState({
    customerId: '',
    vehicleId: '',
    description: '',
  });

  // Create RO mutation
  const { mutate: createRO, loading: creating } = useMutation(
    (data) => roService.createRepairOrder(data),
    {
      onSuccess: (newRO) => {
        toast.success('Repair order created!');
        // Navigate to new RO detail page
        window.location.href = `/ro/${newRO.id}`;
      },
      onError: (err) => {
        toast.error(`Failed to create: ${err.message}`);
      },
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    createRO(formData);
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <TextField
        label="Customer ID"
        value={formData.customerId}
        onChange={(e) =>
          setFormData({ ...formData, customerId: e.target.value })
        }
        required
      />
      <TextField
        label="Vehicle ID"
        value={formData.vehicleId}
        onChange={(e) =>
          setFormData({ ...formData, vehicleId: e.target.value })
        }
        required
      />
      <TextField
        label="Description"
        value={formData.description}
        onChange={(e) =>
          setFormData({ ...formData, description: e.target.value })
        }
        multiline
        rows={4}
      />
      <Button type="submit" disabled={creating} variant="contained">
        {creating ? 'Creating...' : 'Create Repair Order'}
      </Button>
    </Box>
  );
}

// Export all examples
export default {
  RepairOrdersList,
  CustomerManagement,
  PartsCatalog,
  VehicleMakeSelector,
  CustomerOrdersView,
  PartStatusUpdater,
  LiveROStatus,
  RepairOrderCreator,
};
