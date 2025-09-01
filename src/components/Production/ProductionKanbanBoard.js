import React from 'react';
import { Box, Typography } from '@mui/material';

// This component has been replaced by ProductionKanbanBoardNew.js
// This stub exists only to prevent compilation errors during migration
const ProductionKanbanBoard = props => {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: 400,
        bgcolor: 'background.paper',
        borderRadius: 1,
        border: '2px dashed',
        borderColor: 'warning.main',
      }}
    >
      <Typography variant='h6' color='warning.main'>
        This component has been migrated to ProductionKanbanBoardNew.js
      </Typography>
    </Box>
  );
};

export default ProductionKanbanBoard;
