import React from 'react';
import { 
  CardContent, 
  Typography, 
  Box, 
  IconButton,
  useTheme,
  alpha
} from '@mui/material';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from '@mui/icons-material';
import ModernCard from '../Common/ModernCard';

const ModernStatsCard = ({
  title,
  value,
  change,
  changeType = 'positive', // 'positive', 'negative', 'neutral'
  icon: Icon,
  color = 'primary',
  variant = 'glass',
  ...props
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const colorMap = {
    primary: theme.palette.primary.main,
    success: theme.palette.success.main,
    warning: theme.palette.warning.main,
    error: theme.palette.error.main,
    info: theme.palette.info.main,
  };

  const selectedColor = colorMap[color] || theme.palette.primary.main;

  const getChangeColor = () => {
    switch (changeType) {
      case 'positive':
        return theme.palette.success.main;
      case 'negative':
        return theme.palette.error.main;
      default:
        return theme.palette.text.secondary;
    }
  };

  const getChangeIcon = () => {
    switch (changeType) {
      case 'positive':
        return TrendingUp;
      case 'negative':
        return TrendingDown;
      default:
        return null;
    }
  };

  const ChangeIcon = getChangeIcon();

  return (
    <ModernCard 
      variant={variant}
      hover={true}
      sx={{
        height: '140px',
        background: variant === 'gradient' ? 
          `linear-gradient(135deg, ${alpha(selectedColor, isDark ? 0.15 : 0.08)} 0%, ${alpha(selectedColor, isDark ? 0.05 : 0.02)} 100%)`
          : undefined,
        ...props.sx
      }}
      {...props}
    >
      <CardContent 
        sx={{ 
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          p: 3,
          '&:last-child': { pb: 3 }
        }}
      >
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Typography 
            variant="subtitle2" 
            sx={{ 
              color: theme.palette.text.secondary,
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontSize: '0.75rem'
            }}
          >
            {title}
          </Typography>
          
          {Icon && (
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <IconButton
                size="small"
                sx={{
                  backgroundColor: alpha(selectedColor, isDark ? 0.2 : 0.1),
                  color: selectedColor,
                  width: 40,
                  height: 40,
                  '&:hover': {
                    backgroundColor: alpha(selectedColor, isDark ? 0.3 : 0.15),
                    transform: 'rotate(5deg)',
                  },
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                <Icon fontSize="small" />
              </IconButton>
            </motion.div>
          )}
        </Box>

        {/* Value */}
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center' }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 700,
              color: theme.palette.text.primary,
              background: isDark 
                ? `linear-gradient(135deg, ${selectedColor} 0%, ${alpha(selectedColor, 0.7)} 100%)`
                : `linear-gradient(135deg, ${selectedColor} 0%, ${alpha(selectedColor, 0.8)} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              lineHeight: 1,
            }}
          >
            {value}
          </Typography>
        </Box>

        {/* Change indicator */}
        {change !== undefined && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {ChangeIcon && (
              <ChangeIcon 
                sx={{ 
                  color: getChangeColor(),
                  fontSize: '1rem'
                }} 
              />
            )}
            <Typography
              variant="body2"
              sx={{
                color: getChangeColor(),
                fontWeight: 600,
                fontSize: '0.75rem'
              }}
            >
              {typeof change === 'number' ? `${change > 0 ? '+' : ''}${change}%` : change}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.text.secondary,
                fontSize: '0.75rem',
                ml: 0.5
              }}
            >
              vs last month
            </Typography>
          </Box>
        )}
      </CardContent>
    </ModernCard>
  );
};

export default ModernStatsCard;