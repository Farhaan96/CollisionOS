import { Card } from '@mui/material';
import { motion } from 'framer-motion';
import React from 'react';

const MotionCard = motion(Card);

export const GlassCard = ({ children, asMotion = true, sx, ...props }) => {
  const baseStyles = {
    p: 2.5,
    borderRadius: 4,
    background: 'rgba(255,255,255,0.08)',
    backdropFilter: 'saturate(160%) blur(18px)',
    border: '1px solid rgba(255,255,255,0.12)',
    // Add transform-style to prevent layout issues
    transformStyle: 'preserve-3d',
    willChange: 'transform',
    // Ensure proper stacking context
    position: 'relative',
    zIndex: 1
  };

  if (!asMotion) {
    return (
      <Card className="glassmorphic-card" sx={{ ...baseStyles, ...sx }} {...props}>
        {children}
      </Card>
    );
  }

  return (
    <MotionCard
      className="glassmorphic-card"
      whileHover={{ 
        scale: 1.01, // Reduced from 1.02 to minimize focus issues
        y: -2 // Add subtle lift instead of just scale
      }}
      transition={{ 
        type: 'spring', 
        stiffness: 300, // Reduced stiffness for smoother animation
        damping: 25, // Increased damping for less bounce
        duration: 0.2 // Faster animation
      }}
      sx={{ 
        ...baseStyles, 
        ...sx,
        // Ensure hover doesn't break layout
        '&:hover': {
          zIndex: 2 // Slightly higher z-index on hover
        }
      }}
      {...props}
    >
      {children}
    </MotionCard>
  );
};

export default GlassCard;