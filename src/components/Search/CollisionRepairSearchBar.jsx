import React from 'react';
import { Box, TextField } from '@mui/material';

/**
 * CollisionRepairSearchBar - Temporarily disabled during local database migration
 *
 * This component has been temporarily disabled while we migrate from Supabase to local SQLite.
 * Search functionality will be re-enabled once the local database API is implemented.
 */
const CollisionRepairSearchBar = ({
  shopId,
  onSearchResults,
  onItemSelect,
  placeholder = "Search RO#, Claim#, VIN, Customer...",
  showQuickActions = false,
  maxResults = 20
}) => {
  return (
    <Box sx={{ width: '100%', mb: 2 }}>
      <TextField
        fullWidth
        disabled
        placeholder="Search temporarily disabled during database migration"
        variant="outlined"
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            backgroundColor: '#f5f5f5'
          }
        }}
      />
    </Box>
  );
};

export default CollisionRepairSearchBar;
