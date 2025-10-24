import React from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import {
  Breadcrumbs as MuiBreadcrumbs,
  Typography,
  Box,
  useMediaQuery,
} from '@mui/material';
import { NavigateNext, Home } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { generateBreadcrumbs } from '../../config/navigation';

/**
 * Breadcrumbs component for showing current location hierarchy
 * Automatically generates breadcrumbs from route configuration
 */
const Breadcrumbs = () => {
  const location = useLocation();
  const params = useParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const breadcrumbs = generateBreadcrumbs(location.pathname, params);

  // On mobile, show only last 2 breadcrumbs
  const displayBreadcrumbs = isMobile
    ? breadcrumbs.slice(-2)
    : breadcrumbs;

  return (
    <Box
      sx={{
        mb: 3,
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <MuiBreadcrumbs
        separator={<NavigateNext fontSize="small" />}
        aria-label="breadcrumb"
        sx={{
          '& .MuiBreadcrumbs-separator': {
            color: 'text.secondary',
          },
        }}
      >
        {displayBreadcrumbs.map((crumb, index) => {
          const isLast = index === displayBreadcrumbs.length - 1;
          const isHome = crumb.path === '/dashboard';

          if (isLast || crumb.isCurrentPage) {
            return (
              <Typography
                key={crumb.path}
                color="text.primary"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  fontWeight: 600,
                  fontSize: { xs: '0.875rem', sm: '0.875rem' },
                }}
              >
                {isHome && <Home fontSize="small" sx={{ fontSize: 18 }} />}
                {crumb.label}
              </Typography>
            );
          }

          return (
            <Link
              key={crumb.path}
              to={crumb.path}
              style={{ textDecoration: 'none' }}
            >
              <Typography
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  color: 'text.secondary',
                  fontSize: { xs: '0.875rem', sm: '0.875rem' },
                  transition: 'color 0.2s ease',
                  '&:hover': {
                    color: 'primary.main',
                  },
                }}
              >
                {isHome && <Home fontSize="small" sx={{ fontSize: 18 }} />}
                {crumb.label}
              </Typography>
            </Link>
          );
        })}
      </MuiBreadcrumbs>
    </Box>
  );
};

export default Breadcrumbs;
