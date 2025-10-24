# Custom React Hooks for API Management

This directory contains reusable React hooks for managing API calls, data fetching, mutations, and caching in CollisionOS.

## Available Hooks

### 1. `useApi` - For GET requests (data fetching)

Automatically handles loading states, errors, and cleanup. Perfect for fetching data on component mount.

```jsx
import { useApi } from '../hooks/useApi';
import roService from '../services/roService';

function RepairOrderList() {
  const { data: repairOrders, loading, error, refetch } = useApi(
    () => roService.getRepairOrders({ limit: 100 }),
    [] // Dependencies - refetch when these change
  );

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <div>
      <Button onClick={refetch}>Refresh</Button>
      {repairOrders.map(ro => (
        <div key={ro.id}>{ro.ro_number}</div>
      ))}
    </div>
  );
}
```

**Options:**
- `immediate` (default: true) - Whether to fetch immediately on mount
- `onSuccess` - Callback function called on successful fetch
- `onError` - Callback function called on error

### 2. `useMutation` - For POST, PUT, DELETE requests

Handles mutations with loading and error states. Perfect for create, update, delete operations.

```jsx
import { useMutation } from '../hooks/useApi';
import { useApi } from '../hooks/useApi';
import customerService from '../services/customerService';
import { toast } from 'react-hot-toast';

function CustomerList() {
  const { data: customers, refetch } = useApi(
    () => customerService.getAll(),
    []
  );

  const { mutate: deleteCustomer, loading: deleting } = useMutation(
    (id) => customerService.delete(id),
    {
      onSuccess: () => {
        toast.success('Customer deleted');
        refetch(); // Reload the list
      },
      onError: (err) => {
        toast.error(err.message);
      }
    }
  );

  const handleDelete = async (customerId) => {
    if (confirm('Are you sure?')) {
      await deleteCustomer(customerId);
    }
  };

  return (
    <List>
      {customers.map(customer => (
        <ListItem key={customer.id}>
          <Button
            onClick={() => handleDelete(customer.id)}
            disabled={deleting}
          >
            Delete
          </Button>
        </ListItem>
      ))}
    </List>
  );
}
```

**Options:**
- `onSuccess(data, ...args)` - Called on successful mutation
- `onError(error, ...args)` - Called on error
- `onSettled()` - Called after success or error

### 3. `useApiWithPagination` - For paginated data

Handles pagination state automatically.

```jsx
import { useApiWithPagination } from '../hooks/useApi';
import partsService from '../services/partsService';

function PartsList() {
  const {
    data: parts,
    loading,
    error,
    page,
    setPage,
    totalPages,
    totalCount,
    setFilters
  } = useApiWithPagination(
    (params) => partsService.getAll(params),
    { page: 1, limit: 25 }
  );

  return (
    <div>
      <Typography>Total: {totalCount} parts</Typography>

      {/* Your parts table here */}

      <TablePagination
        count={totalCount}
        page={page - 1}
        rowsPerPage={25}
        onPageChange={(e, newPage) => setPage(newPage + 1)}
      />
    </div>
  );
}
```

### 4. `useApiCache` - For cached API responses

Caches responses in sessionStorage to reduce unnecessary API calls.

```jsx
import { useApiCache } from '../hooks/useApi';
import vehicleService from '../services/vehicleService';

function VehicleMakeSelector() {
  const { data: makes, loading } = useApiCache(
    'vehicle-makes',
    () => vehicleService.getMakes(),
    10 * 60 * 1000 // Cache for 10 minutes
  );

  if (loading) return <CircularProgress />;

  return (
    <Select>
      {makes.map(make => (
        <MenuItem key={make.id} value={make.id}>
          {make.name}
        </MenuItem>
      ))}
    </Select>
  );
}
```

## Migration Guide

### Before (Manual State Management)

```jsx
const [data, setData] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  let cancelled = false;

  async function fetchData() {
    try {
      setLoading(true);
      const response = await api.get('/endpoint');
      if (!cancelled) {
        setData(response.data);
      }
    } catch (err) {
      if (!cancelled) {
        setError(err.message);
      }
    } finally {
      if (!cancelled) {
        setLoading(false);
      }
    }
  }

  fetchData();

  return () => {
    cancelled = true;
  };
}, []);
```

### After (Using useApi)

```jsx
const { data, loading, error } = useApi(
  () => api.get('/endpoint'),
  []
);
```

## Benefits

✅ **Reduced Boilerplate** - No more manual loading/error state management
✅ **Memory Leak Prevention** - Automatic cleanup on unmount
✅ **Request Cancellation** - Cancels pending requests when component unmounts
✅ **Consistent Patterns** - Same API across all components
✅ **Better Error Handling** - Centralized error handling logic
✅ **TypeScript Ready** - Full TypeScript support (coming soon)
✅ **Caching Support** - Built-in caching with `useApiCache`

## Best Practices

1. **Always provide dependencies array** to `useApi`:
   ```jsx
   // Good
   useApi(() => api.get(`/users/${userId}`), [userId]);

   // Bad - will never refetch
   useApi(() => api.get(`/users/${userId}`));
   ```

2. **Use useMutation for mutations**:
   ```jsx
   // Good
   const { mutate: updateUser } = useMutation(api.updateUser);

   // Bad - should use useMutation instead
   const { data } = useApi(() => api.updateUser(userId), []);
   ```

3. **Handle loading and error states**:
   ```jsx
   const { data, loading, error } = useApi(...);

   if (loading) return <LoadingSpinner />;
   if (error) return <ErrorAlert message={error} />;

   return <YourComponent data={data} />;
   ```

4. **Use callbacks for side effects**:
   ```jsx
   const { mutate } = useMutation(
     api.createUser,
     {
       onSuccess: (newUser) => {
         toast.success('User created!');
         navigate(`/users/${newUser.id}`);
       }
     }
   );
   ```

## Advanced Patterns

### Dependent Queries

```jsx
// Only fetch orders if customer is loaded
const { data: customer } = useApi(() => getCustomer(id), [id]);

const { data: orders } = useApi(
  () => getCustomerOrders(customer.id),
  [customer?.id],
  { immediate: !!customer } // Only fetch if customer exists
);
```

### Optimistic Updates

```jsx
const { mutate: updateStatus } = useMutation(
  (id, status) => api.updateStatus(id, status),
  {
    onMutate: (id, status) => {
      // Optimistically update UI before API call
      setLocalData(prev =>
        prev.map(item =>
          item.id === id ? { ...item, status } : item
        )
      );
    },
    onError: () => {
      // Revert on error
      refetch();
    }
  }
);
```

### Polling

```jsx
useEffect(() => {
  const interval = setInterval(() => {
    refetch();
  }, 5000); // Refetch every 5 seconds

  return () => clearInterval(interval);
}, [refetch]);
```

## Testing

```jsx
import { renderHook, waitFor } from '@testing-library/react';
import { useApi } from './useApi';

test('useApi fetches data successfully', async () => {
  const mockApi = jest.fn().mockResolvedValue({ data: [1, 2, 3] });

  const { result } = renderHook(() => useApi(mockApi, []));

  expect(result.current.loading).toBe(true);

  await waitFor(() => {
    expect(result.current.loading).toBe(false);
  });

  expect(result.current.data).toEqual([1, 2, 3]);
});
```

## Troubleshooting

**Issue**: Hook not refetching when dependencies change
- **Solution**: Make sure you're passing the correct dependencies array

**Issue**: Memory warnings about state updates on unmounted component
- **Solution**: The hooks handle this automatically - check if you're also manually managing cleanup

**Issue**: Stale data in cache
- **Solution**: Use `invalidate()` from `useApiCache` or reduce `cacheTime`

## Future Enhancements

- [ ] TypeScript type definitions
- [ ] React Query integration option
- [ ] WebSocket support for real-time data
- [ ] Infinite scroll helper hook
- [ ] Query deduplication
- [ ] Background refetching
- [ ] Retry logic with exponential backoff
