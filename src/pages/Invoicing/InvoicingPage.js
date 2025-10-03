import React from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Alert,
  Button,
} from '@mui/material';
import { Receipt, Construction } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

export default function InvoicingPage() {
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
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Receipt sx={{ mr: 2, fontSize: 40, color: 'primary.main' }} />
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Invoicing & Billing
          </Typography>
        </Box>

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
            Invoicing System Coming Soon
          </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            The invoicing and billing module is currently under development.
            Check back soon for invoice generation, payment tracking, and accounting features.
          </Typography>

          <Button
            variant="contained"
            onClick={() => navigate('/dashboard')}
          >
            Back to Dashboard
          </Button>
        </Paper>
      </Container>
    </Box>
  );
}
