import React from 'react';
import { Box } from '@mui/material';
import { motion } from 'framer-motion';

export const BentoGrid = React.memo(({ children, cols = 12, gap = 2 }) => (
  <Box component={motion.div}
       initial={{ opacity: 0 }}
       animate={{ opacity: 1 }}
       transition={{ duration: 0.2 }} // Reduced from 0.3 for faster loading
       sx={{
         display: 'grid',
         gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
         gap
       }}>
    {children}
  </Box>
));

export const BentoItem = React.memo(({ children, span }) => (
  <Box
    component={motion.div}
    variants={{ 
      hidden: { y: 10, opacity: 0 }, // Reduced y movement for less jarring animation
      visible: { 
        y: 0, 
        opacity: 1, 
        transition: { 
          type: 'spring', 
          stiffness: 100, // Reduced stiffness for smoother animation
          damping: 20, // Increased damping for less bounce
          duration: 0.3 // Faster animation
        } 
      } 
    }}
    initial="hidden"
    animate="visible"
    sx={{
      gridColumn: {
        xs: `span ${span?.xs ?? 12}`,
        sm: `span ${span?.sm ?? span?.xs ?? 12}`,
        md: `span ${span?.md ?? span?.sm ?? 6}`,
        lg: `span ${span?.lg ?? span?.md ?? 4}`,
        xl: `span ${span?.xl ?? span?.lg ?? 3}`,
      }
    }}
  >
    {children}
  </Box>
));

export default BentoGrid;