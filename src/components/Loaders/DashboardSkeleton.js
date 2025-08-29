// Premium Dashboard Skeleton for CollisionOS
// Executive-level dashboard loading with widget grid, KPI cards, and sidebar navigation

import React, { forwardRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Box, 
  Paper, 
  useTheme, 
  useMediaQuery,
  Grid,
  Container
} from '@mui/material';
import { premiumDesignSystem } from '../../theme/premiumDesignSystem';
import { SkeletonLoader } from './SkeletonLoader';
import { animationUtils, containerAnimations } from '../../utils/animations';

// Animation variants for dashboard components
const dashboardVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
      when: 'beforeChildren'
    }
  }
};

const widgetVariants = {
  hidden: { 
    opacity: 0, 
    y: 20,
    scale: 0.95
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: 'easeOut'
    }
  }
};

// Header skeleton component
const HeaderSkeleton = ({ showUser = true, showNotifications = true }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  return (
    <motion.div variants={widgetVariants}>
      <Box 
        display="flex" 
        alignItems="center" 
        justifyContent="space-between"
        p={isMobile ? 2 : 3}
        mb={3}
        sx={{
          background: `linear-gradient(135deg, 
            ${theme.palette.background.paper}95 0%, 
            ${premiumDesignSystem.colors.primary[50]}20 100%
          )`,
          backdropFilter: 'blur(12px) saturate(180%)',
          WebkitBackdropFilter: 'blur(12px) saturate(180%)',
          borderRadius: premiumDesignSystem.borderRadius.xl,
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: premiumDesignSystem.shadows.glass.soft,
        }}
      >
        {/* Left side - Logo and greeting */}
        <Box display="flex" alignItems="center" gap={2}>
          <SkeletonLoader
            variant="avatar"
            size={isMobile ? 32 : 40}
            animation="pulse"
          />
          <Box>
            <SkeletonLoader
              variant="text"
              width={isMobile ? "120px" : "200px"}
              height="1.5em"
              animation="pulse"
            />
            <SkeletonLoader
              variant="text"
              width={isMobile ? "80px" : "150px"}
              height="1em"
              animation="pulse"
            />
          </Box>
        </Box>
        
        {/* Right side - Actions and user */}
        <Box display="flex" alignItems="center" gap={1}>
          {showNotifications && (
            <Box
              sx={{
                width: isMobile ? 32 : 36,
                height: isMobile ? 32 : 36,
                borderRadius: '50%',
                backgroundColor: 'rgba(0,0,0,0.08)',
                position: 'relative',
              }}
            >
              <motion.div
                style={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: premiumDesignSystem.colors.semantic.error.main,
                }}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </Box>
          )}
          
          {showUser && (
            <Box display="flex" alignItems="center" gap={1}>
              <SkeletonLoader
                variant="avatar"
                size={isMobile ? 28 : 32}
                animation="pulse"
              />
              {!isMobile && (
                <Box>
                  <SkeletonLoader
                    variant="text"
                    width="80px"
                    height="1em"
                    animation="pulse"
                  />
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Box>
    </motion.div>
  );
};

// KPI Card skeleton component
const KPICardSkeleton = ({ variant = 'default' }) => {
  const theme = useTheme();
  
  const cardHeight = variant === 'compact' ? 120 : variant === 'detailed' ? 180 : 140;
  
  return (
    <motion.div variants={widgetVariants}>
      <Paper
        sx={{
          p: 3,
          height: cardHeight,
          background: `linear-gradient(135deg, 
            ${theme.palette.background.paper}95 0%, 
            ${premiumDesignSystem.colors.primary[50]}10 100%
          )`,
          backdropFilter: 'blur(12px) saturate(180%)',
          WebkitBackdropFilter: 'blur(12px) saturate(180%)',
          borderRadius: premiumDesignSystem.borderRadius.xl,
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: premiumDesignSystem.shadows.glass.soft,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background decoration */}
        <Box
          sx={{
            position: 'absolute',
            top: -20,
            right: -20,
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: `linear-gradient(135deg, 
              ${premiumDesignSystem.colors.primary[200]}20 0%, 
              ${premiumDesignSystem.colors.primary[400]}10 100%
            )`,
          }}
        />
        
        <Box display="flex" flexDirection="column" justifyContent="space-between" height="100%" zIndex={1} position="relative">
          {/* Header */}
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <SkeletonLoader
              variant="text"
              width="120px"
              height="1.1em"
              animation="pulse"
            />
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                backgroundColor: 'rgba(0,0,0,0.08)',
              }}
            />
          </Box>
          
          {/* Value */}
          <Box>
            <SkeletonLoader
              variant="text"
              width="80px"
              height="2.5em"
              animation="pulse"
            />
            <SkeletonLoader
              variant="text"
              width="100px"
              height="1em"
              animation="pulse"
            />
          </Box>
          
          {/* Sparkline or progress */}
          {variant === 'detailed' && (
            <Box height={40} mt={1}>
              <svg width="100%" height="100%">
                <motion.path
                  d="M10,30 Q30,20 50,25 T90,15 T130,20 T170,10"
                  stroke={premiumDesignSystem.colors.primary[400]}
                  strokeWidth="2"
                  fill="none"
                  opacity="0.6"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                />
              </svg>
            </Box>
          )}
        </Box>
      </Paper>
    </motion.div>
  );
};

// Chart widget skeleton component
const ChartWidgetSkeleton = ({ type = 'line', height = 300 }) => {
  const theme = useTheme();
  
  return (
    <motion.div variants={widgetVariants}>
      <Paper
        sx={{
          p: 3,
          height,
          background: theme.palette.background.paper,
          backdropFilter: 'blur(12px) saturate(180%)',
          WebkitBackdropFilter: 'blur(12px) saturate(180%)',
          borderRadius: premiumDesignSystem.borderRadius.xl,
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: premiumDesignSystem.shadows.glass.soft,
        }}
      >
        {/* Header */}
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
          <SkeletonLoader
            variant="text"
            width="160px"
            height="1.5em"
            animation="pulse"
          />
          <Box display="flex" gap={1}>
            {[1, 2, 3].map((i) => (
              <Box
                key={i}
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: 1,
                  backgroundColor: 'rgba(0,0,0,0.08)',
                }}
              />
            ))}
          </Box>
        </Box>
        
        {/* Chart area */}
        <Box flex={1} position="relative" height={height - 100}>
          {type === 'line' && (
            <svg width="100%" height="100%">
              {/* Grid lines */}
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.line
                  key={i}
                  x1="0"
                  y1={`${(i * 20) + 10}%`}
                  x2="100%"
                  y2={`${(i * 20) + 10}%`}
                  stroke={theme.palette.divider}
                  strokeWidth="1"
                  opacity="0.3"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.5, delay: i * 0.1 }}
                />
              ))}
              
              {/* Animated chart line */}
              <motion.path
                d="M50,180 Q100,120 150,140 T250,100 T350,120 T450,80"
                stroke={premiumDesignSystem.colors.primary[500]}
                strokeWidth="3"
                fill="none"
                opacity="0.8"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
              />
            </svg>
          )}
          
          {type === 'bar' && (
            <Box display="flex" alignItems="end" height="100%" gap={1} px={2}>
              {Array.from({ length: 8 }, (_, i) => (
                <motion.div
                  key={i}
                  style={{
                    flex: 1,
                    borderRadius: premiumDesignSystem.borderRadius.sm,
                    background: `linear-gradient(to top, 
                      ${premiumDesignSystem.colors.primary[300]} 0%,
                      ${premiumDesignSystem.colors.primary[500]} 100%
                    )`,
                    opacity: 0.7,
                  }}
                  animate={{ 
                    height: [`${Math.random() * 40 + 20}%`, `${Math.random() * 60 + 40}%`] 
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity, 
                    repeatType: "reverse",
                    delay: i * 0.1 
                  }}
                />
              ))}
            </Box>
          )}
          
          {type === 'donut' && (
            <Box display="flex" justifyContent="center" alignItems="center" height="100%">
              <motion.div
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: '50%',
                  border: `20px solid ${premiumDesignSystem.colors.neutral[200]}`,
                  borderTopColor: premiumDesignSystem.colors.primary[500],
                  borderRightColor: premiumDesignSystem.colors.secondary[500],
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              />
            </Box>
          )}
        </Box>
        
        {/* Legend */}
        <Box display="flex" gap={3} justifyContent="center" mt={2} flexWrap="wrap">
          {Array.from({ length: 3 }, (_, i) => (
            <Box key={i} display="flex" alignItems="center" gap={1}>
              <Box 
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: [
                    premiumDesignSystem.colors.primary[500],
                    premiumDesignSystem.colors.secondary[500],
                    premiumDesignSystem.colors.semantic.success.main,
                  ][i],
                }}
              />
              <SkeletonLoader 
                variant="text" 
                width="60px" 
                height="0.9em"
                animation="pulse"
              />
            </Box>
          ))}
        </Box>
      </Paper>
    </motion.div>
  );
};

// Sidebar skeleton component
const SidebarSkeleton = ({ isCollapsed = false }) => {
  const theme = useTheme();
  const sidebarWidth = isCollapsed ? 70 : 280;
  
  const menuItems = [
    { hasIcon: true, hasSubItems: false },
    { hasIcon: true, hasSubItems: true },
    { hasIcon: true, hasSubItems: false },
    { hasIcon: true, hasSubItems: true },
    { hasIcon: true, hasSubItems: false },
    { hasIcon: true, hasSubItems: false },
  ];
  
  return (
    <motion.div variants={widgetVariants}>
      <Paper
        sx={{
          width: sidebarWidth,
          minHeight: 600,
          p: 2,
          background: theme.palette.background.paper,
          backdropFilter: 'blur(12px) saturate(180%)',
          WebkitBackdropFilter: 'blur(12px) saturate(180%)',
          borderRadius: premiumDesignSystem.borderRadius.xl,
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: premiumDesignSystem.shadows.glass.medium,
          transition: 'width 0.3s ease',
        }}
      >
        {/* Logo/Brand */}
        <Box display="flex" alignItems="center" gap={2} mb={4} px={1}>
          <SkeletonLoader
            variant="avatar"
            size={32}
            animation="pulse"
          />
          {!isCollapsed && (
            <SkeletonLoader
              variant="text"
              width="120px"
              height="1.2em"
              animation="pulse"
            />
          )}
        </Box>
        
        {/* Navigation items */}
        <Box display="flex" flexDirection="column" gap={1}>
          {menuItems.map((item, index) => (
            <Box key={index}>
              <Box
                display="flex"
                alignItems="center"
                gap={2}
                p={1.5}
                borderRadius={premiumDesignSystem.borderRadius.lg}
                sx={{
                  '&:hover': {
                    bgcolor: theme.palette.action.hover,
                  },
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease',
                }}
              >
                <Box
                  sx={{
                    width: 20,
                    height: 20,
                    borderRadius: 1,
                    backgroundColor: index === 1 ? 
                      premiumDesignSystem.colors.primary[500] + '40' : 
                      'rgba(0,0,0,0.08)',
                  }}
                />
                {!isCollapsed && (
                  <>
                    <SkeletonLoader
                      variant="text"
                      width="100px"
                      height="1em"
                      animation="pulse"
                    />
                    {item.hasSubItems && (
                      <Box
                        sx={{
                          width: 16,
                          height: 16,
                          borderRadius: 1,
                          backgroundColor: 'rgba(0,0,0,0.08)',
                          ml: 'auto',
                        }}
                      />
                    )}
                  </>
                )}
              </Box>
              
              {/* Sub-items for expanded menus */}
              {item.hasSubItems && !isCollapsed && index === 1 && (
                <Box ml={4} mt={1} display="flex" flexDirection="column" gap={0.5}>
                  {[1, 2, 3].map((subIndex) => (
                    <Box
                      key={subIndex}
                      display="flex"
                      alignItems="center"
                      gap={2}
                      p={1}
                      borderRadius={premiumDesignSystem.borderRadius.md}
                    >
                      <Box
                        sx={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          backgroundColor: 'rgba(0,0,0,0.08)',
                        }}
                      />
                      <SkeletonLoader
                        variant="text"
                        width="80px"
                        height="0.9em"
                        animation="pulse"
                      />
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          ))}
        </Box>
        
        {/* User section at bottom */}
        {!isCollapsed && (
          <Box mt="auto" pt={4}>
            <Box
              display="flex"
              alignItems="center"
              gap={2}
              p={1.5}
              borderRadius={premiumDesignSystem.borderRadius.lg}
              sx={{
                bgcolor: theme.palette.action.hover,
              }}
            >
              <SkeletonLoader
                variant="avatar"
                size={32}
                animation="pulse"
              />
              <Box flex={1}>
                <SkeletonLoader
                  variant="text"
                  width="100px"
                  height="1em"
                  animation="pulse"
                />
                <SkeletonLoader
                  variant="text"
                  width="80px"
                  height="0.8em"
                  animation="pulse"
                />
              </Box>
            </Box>
          </Box>
        )}
      </Paper>
    </motion.div>
  );
};

// Main DashboardSkeleton component
const DashboardSkeleton = forwardRef(({
  layout = 'default', // 'default', 'executive', 'minimal', 'mobile'
  showSidebar = true,
  showHeader = true,
  kpiCards = 4,
  chartWidgets = [
    { type: 'line', span: 8 },
    { type: 'donut', span: 4 },
    { type: 'bar', span: 6 },
    { type: 'line', span: 6 },
  ],
  sidebarCollapsed = false,
  variant = 'comfortable', // 'compact', 'comfortable', 'spacious'
  ...props
}, ref) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  
  // Adjust layout for mobile
  const effectiveLayout = isMobile ? 'mobile' : layout;
  const effectiveShowSidebar = showSidebar && !isMobile;
  const spacing = variant === 'compact' ? 2 : variant === 'spacious' ? 4 : 3;
  
  // Grid configuration
  const gridSpacing = isMobile ? 2 : spacing;
  const kpiCardSpan = isMobile ? 12 : isTablet ? 6 : 3;
  
  return (
    <motion.div
      ref={ref}
      variants={dashboardVariants}
      initial="hidden"
      animate="visible"
      style={{ ...animationUtils.optimizedTransform }}
      {...props}
    >
      <Box display="flex" gap={spacing} minHeight="100vh">
        {/* Sidebar */}
        {effectiveShowSidebar && (
          <SidebarSkeleton isCollapsed={sidebarCollapsed} />
        )}
        
        {/* Main content */}
        <Box flex={1} overflow="auto">
          <Container maxWidth={effectiveLayout === 'executive' ? false : 'xl'}>
            {/* Header */}
            {showHeader && (
              <HeaderSkeleton 
                showUser={!isMobile} 
                showNotifications={true}
              />
            )}
            
            {/* KPI Cards */}
            {kpiCards > 0 && (
              <motion.div variants={widgetVariants}>
                <Grid container spacing={gridSpacing} mb={spacing}>
                  {Array.from({ length: kpiCards }, (_, index) => (
                    <Grid item xs={12} sm={6} md={kpiCardSpan} key={index}>
                      <KPICardSkeleton 
                        variant={effectiveLayout === 'executive' ? 'detailed' : 'default'}
                      />
                    </Grid>
                  ))}
                </Grid>
              </motion.div>
            )}
            
            {/* Chart Widgets */}
            <motion.div variants={widgetVariants}>
              <Grid container spacing={gridSpacing}>
                {chartWidgets.map((widget, index) => (
                  <Grid 
                    item 
                    xs={12} 
                    md={isMobile ? 12 : isTablet ? (widget.span > 6 ? 12 : 6) : widget.span} 
                    key={index}
                  >
                    <ChartWidgetSkeleton
                      type={widget.type}
                      height={effectiveLayout === 'executive' ? 350 : 300}
                    />
                  </Grid>
                ))}
              </Grid>
            </motion.div>
            
            {/* Additional content area for executive layout */}
            {effectiveLayout === 'executive' && (
              <motion.div variants={widgetVariants}>
                <Box mt={spacing}>
                  <Grid container spacing={gridSpacing}>
                    <Grid item xs={12} md={8}>
                      <ChartWidgetSkeleton type="line" height={400} />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Box display="flex" flexDirection="column" gap={2} height={400}>
                        <Paper
                          sx={{
                            flex: 1,
                            p: 3,
                            background: theme.palette.background.paper,
                            borderRadius: premiumDesignSystem.borderRadius.xl,
                            border: `1px solid ${theme.palette.divider}`,
                          }}
                        >
                          <SkeletonLoader
                            variant="text"
                            width="140px"
                            height="1.5em"
                            animation="pulse"
                          />
                          <Box mt={2} display="flex" flexDirection="column" gap={1}>
                            {[1, 2, 3, 4, 5].map((i) => (
                              <Box key={i} display="flex" alignItems="center" gap={2}>
                                <SkeletonLoader
                                  variant="avatar"
                                  size={24}
                                  animation="pulse"
                                />
                                <SkeletonLoader
                                  variant="text"
                                  width="120px"
                                  height="1em"
                                  animation="pulse"
                                />
                              </Box>
                            ))}
                          </Box>
                        </Paper>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              </motion.div>
            )}
          </Container>
        </Box>
      </Box>
    </motion.div>
  );
});

DashboardSkeleton.displayName = 'DashboardSkeleton';

export default DashboardSkeleton;

export {
  HeaderSkeleton,
  KPICardSkeleton,
  ChartWidgetSkeleton,
  SidebarSkeleton,
};