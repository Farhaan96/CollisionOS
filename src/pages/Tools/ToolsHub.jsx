import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Chip,
  useTheme,
  alpha,
  Stack,
} from '@mui/material';
import {
  CloudUpload,
  DirectionsCar,
  QrCode2,
  Build,
  VerifiedUser,
  Speed,
  Engineering,
  Assessment,
  AutoAwesome,
  TrendingUp,
} from '@mui/icons-material';

/**
 * Tools Hub - Central landing page for all collision repair shop tools
 * Provides quick access to essential utilities and features
 */
const ToolsHub = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const tools = [
    {
      id: 'bms-import',
      title: 'BMS Import',
      description: 'Import Mitchell Estimating BMS XML files to automatically create customers, vehicles, and repair orders',
      icon: CloudUpload,
      path: '/bms-import',
      color: theme.palette.primary.main,
      features: ['Auto-parse XML', 'Create customers', 'Import estimates', 'Parts extraction'],
      category: 'Integration',
      popular: true,
    },
    {
      id: 'vin-decoder',
      title: 'VIN Decoder',
      description: 'Decode Vehicle Identification Numbers using NHTSA database for accurate vehicle specifications',
      icon: QrCode2,
      path: '/tools/vin-decoder',
      color: theme.palette.info.main,
      features: ['NHTSA integration', 'Real-time validation', 'Batch decoding', 'Auto-population'],
      category: 'Identification',
      popular: true,
    },
    {
      id: 'courtesy-cars',
      title: 'Courtesy Cars',
      description: 'Manage loaner vehicle fleet, track assignments, maintenance, and availability',
      icon: DirectionsCar,
      path: '/courtesy-cars',
      color: theme.palette.success.main,
      features: ['Fleet management', 'Assignments', 'Maintenance tracking', 'Utilization reports'],
      category: 'Operations',
    },
    {
      id: 'technician',
      title: 'Technician Dashboard',
      description: 'Streamlined interface for technicians to view assigned jobs, track time, and update status',
      icon: Build,
      path: '/technician',
      color: theme.palette.warning.main,
      features: ['Job tracking', 'Time clock', 'Photo upload', 'Status updates'],
      category: 'Workforce',
    },
    {
      id: 'quality-control',
      title: 'Quality Control',
      description: 'Comprehensive QC inspections, checklists, and ADAS calibration tracking',
      icon: VerifiedUser,
      path: '/quality-control',
      color: theme.palette.error.main,
      features: ['Inspection checklists', 'ADAS tracking', 'Photo documentation', 'Compliance'],
      category: 'Quality',
      popular: true,
    },
  ];

  const stats = [
    {
      label: 'Active Tools',
      value: tools.length,
      icon: Engineering,
      color: theme.palette.primary.main,
    },
    {
      label: 'Categories',
      value: [...new Set(tools.map(t => t.category))].length,
      icon: Assessment,
      color: theme.palette.info.main,
    },
    {
      label: 'Time Saved',
      value: '40%',
      icon: Speed,
      color: theme.palette.success.main,
    },
  ];

  const handleToolClick = (path) => {
    navigate(path);
  };

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="xl">
        {/* Header */}
        <Box sx={{ mb: 6, textAlign: 'center' }}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 2,
              mb: 2,
              p: 2,
              borderRadius: '20px',
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.secondary.main, 0.1)})`,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            }}
          >
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: '16px',
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.3)}`,
              }}
            >
              <Engineering sx={{ color: 'white', fontSize: 28 }} />
            </Box>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
              }}
            >
              Tools Hub
            </Typography>
          </Box>

          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 700, mx: 'auto' }}>
            Professional tools and utilities designed specifically for collision repair shops
            to streamline operations and improve efficiency
          </Typography>
        </Box>

        {/* Stats */}
        <Grid container spacing={3} sx={{ mb: 6 }}>
          {stats.map((stat) => (
            <Grid item xs={12} md={4} key={stat.label}>
              <Card
                sx={{
                  background: `linear-gradient(135deg, ${alpha(stat.color, 0.1)}, ${alpha(stat.color, 0.05)})`,
                  border: `1px solid ${alpha(stat.color, 0.2)}`,
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                      sx={{
                        width: 56,
                        height: 56,
                        borderRadius: '12px',
                        background: `linear-gradient(135deg, ${stat.color}, ${alpha(stat.color, 0.8)})`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: `0 4px 12px ${alpha(stat.color, 0.3)}`,
                      }}
                    >
                      <stat.icon sx={{ color: 'white', fontSize: 28 }} />
                    </Box>
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: stat.color }}>
                        {stat.value}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {stat.label}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Tools Grid */}
        <Grid container spacing={3}>
          {tools.map((tool) => (
            <Grid item xs={12} sm={6} md={4} key={tool.id}>
              <Card
                sx={{
                  height: '100%',
                  position: 'relative',
                  overflow: 'visible',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: `0 12px 24px ${alpha(tool.color, 0.2)}`,
                  },
                }}
              >
                {tool.popular && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -12,
                      right: 16,
                      zIndex: 1,
                    }}
                  >
                    <Chip
                      label="Popular"
                      size="small"
                      icon={<TrendingUp />}
                      sx={{
                        bgcolor: theme.palette.secondary.main,
                        color: 'white',
                        fontWeight: 600,
                        boxShadow: `0 4px 12px ${alpha(theme.palette.secondary.main, 0.3)}`,
                      }}
                    />
                  </Box>
                )}
                <CardActionArea
                  onClick={() => handleToolClick(tool.path)}
                  sx={{ height: '100%', p: 3 }}
                >
                  <CardContent sx={{ p: 0 }}>
                    {/* Icon */}
                    <Box
                      sx={{
                        width: 64,
                        height: 64,
                        borderRadius: '16px',
                        background: `linear-gradient(135deg, ${tool.color}, ${alpha(tool.color, 0.7)})`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 2,
                        boxShadow: `0 8px 24px ${alpha(tool.color, 0.3)}`,
                      }}
                    >
                      <tool.icon sx={{ color: 'white', fontSize: 32 }} />
                    </Box>

                    {/* Category */}
                    <Chip
                      label={tool.category}
                      size="small"
                      sx={{
                        mb: 1.5,
                        bgcolor: alpha(tool.color, 0.1),
                        color: tool.color,
                        fontWeight: 600,
                        fontSize: '11px',
                      }}
                    />

                    {/* Title & Description */}
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                      {tool.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 60 }}>
                      {tool.description}
                    </Typography>

                    {/* Features */}
                    <Stack direction="row" flexWrap="wrap" gap={0.5}>
                      {tool.features.map((feature) => (
                        <Chip
                          key={feature}
                          label={feature}
                          size="small"
                          variant="outlined"
                          sx={{
                            fontSize: '10px',
                            height: 24,
                            borderColor: alpha(tool.color, 0.3),
                            color: 'text.secondary',
                          }}
                        />
                      ))}
                    </Stack>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Coming Soon Section */}
        <Box sx={{ mt: 8, textAlign: 'center' }}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
            <AutoAwesome sx={{ mr: 1, verticalAlign: 'middle' }} />
            More Tools Coming Soon
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            We're continuously developing new tools to help your shop operate more efficiently
          </Typography>
          <Grid container spacing={2} justifyContent="center">
            {['Labor Time Estimator', 'Paint Calculator', 'Parts Price Comparison', 'OEM Parts Lookup'].map(
              (comingSoon) => (
                <Grid item key={comingSoon}>
                  <Chip
                    label={comingSoon}
                    variant="outlined"
                    sx={{
                      borderColor: alpha(theme.palette.text.secondary, 0.2),
                      color: 'text.secondary',
                    }}
                  />
                </Grid>
              )
            )}
          </Grid>
        </Box>
      </Container>
    </Box>
  );
};

export default ToolsHub;
