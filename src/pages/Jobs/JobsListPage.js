import React from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Alert,
  Button,
} from '@mui/material';
import { Construction } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

export default function JobsListPage() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        py: 4,
      }}
    >
      <Container maxWidth="lg">
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
          Jobs & Repair Orders
        </Typography>

        <Paper
          sx={{
            p: 4,
            textAlign: 'center',
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          }}
        >
          <Construction sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />

          <Typography variant="h6" sx={{ mb: 2 }}>
            Jobs List Coming Soon
          </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            This page is currently under development. Use the RO Search or Production Board instead.
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="contained"
              onClick={() => navigate('/search')}
            >
              Go to RO Search
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/production-board')}
            >
              Go to Production Board
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
