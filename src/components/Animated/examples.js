// Example usage of advanced animation components
// This file demonstrates how to use the new animated components in CollisionOS

import React, { useState } from 'react';
import { Box, Typography, Grid } from '@mui/material';
import { PlayArrow, Save, Star, Settings } from '@mui/icons-material';

// Import animated components
import AnimatedButton, {
  PremiumButton,
  ExecutiveButton,
  GlassButton,
  MagneticButton,
} from './AnimatedButton';

import AnimatedCard, {
  PremiumCard,
  GlassCard,
  ExecutiveCard,
  FlipCard,
  CardGrid,
} from './AnimatedCard';

// Example: Button Showcase
export const ButtonShowcase = () => {
  const [buttonState, setButtonState] = useState('idle');

  const handleButtonClick = () => {
    setButtonState('loading');
    setTimeout(() => {
      setButtonState('success');
      setTimeout(() => {
        setButtonState('idle');
      }, 2000);
    }, 2000);
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant='h4' gutterBottom>
        Animated Button Examples
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Typography variant='h6' gutterBottom>
            Premium Buttons
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <PremiumButton
              state={buttonState}
              onClick={handleButtonClick}
              icon={<PlayArrow />}
            >
              Premium Action
            </PremiumButton>

            <ExecutiveButton icon={<Save />} endIcon={<Star />}>
              Executive Style
            </ExecutiveButton>

            <GlassButton variant='glass'>Glass Morphism</GlassButton>

            <MagneticButton>Magnetic Effect</MagneticButton>
          </Box>
        </Grid>

        <Grid item xs={12} md={6}>
          <Typography variant='h6' gutterBottom>
            Button Variants
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <AnimatedButton animation='ripple' variant='premium'>
              Ripple Animation
            </AnimatedButton>

            <AnimatedButton
              animation='glow'
              variant='executive'
              glowColor='#00ff88'
            >
              Custom Glow
            </AnimatedButton>

            <AnimatedButton animation='scale' variant='minimal' size='large'>
              Large Minimal
            </AnimatedButton>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

// Example: Card Showcase
export const CardShowcase = () => {
  return (
    <Box sx={{ p: 4 }}>
      <Typography variant='h4' gutterBottom>
        Animated Card Examples
      </Typography>

      <CardGrid>
        <PremiumCard
          header={{
            title: 'Premium Card',
            subheader: 'With 3D tilt effect',
          }}
          interactive
        >
          <Typography>
            This premium card has a 3D tilt effect when you hover over it. The
            glassmorphism background creates a modern, executive feel.
          </Typography>
        </PremiumCard>

        <GlassCard
          header={{
            title: 'Glass Morphism',
            subheader: 'Ultra-modern design',
          }}
          elevation='high'
        >
          <Typography>
            This glass card uses advanced backdrop filters and subtle
            transparency to create a sophisticated floating effect.
          </Typography>
        </GlassCard>

        <ExecutiveCard
          header={{
            title: 'Executive Style',
            subheader: 'Dark theme with glow',
          }}
          glowColor='#6366f1'
        >
          <Typography sx={{ color: 'white' }}>
            Executive cards feature dark themes with premium glow effects that
            convey authority and sophistication.
          </Typography>
        </ExecutiveCard>

        <FlipCard
          header={{
            title: 'Interactive Flip',
            subheader: 'Click to flip',
          }}
          backContent={
            <Box sx={{ textAlign: 'center' }}>
              <Settings sx={{ fontSize: 48, mb: 2, color: 'primary.main' }} />
              <Typography variant='h6'>Back Side Content</Typography>
              <Typography>
                This is the back of the card with different content!
              </Typography>
            </Box>
          }
        >
          <Typography>
            Click this card to see it flip with a 3D animation. Perfect for
            revealing additional information or actions.
          </Typography>
        </FlipCard>
      </CardGrid>
    </Box>
  );
};

// Example: Animation States Demo
export const AnimationStatesDemo = () => {
  const [cardState, setCardState] = useState('idle');

  const states = ['idle', 'loading', 'success', 'error'];

  const cycleState = () => {
    const currentIndex = states.indexOf(cardState);
    const nextIndex = (currentIndex + 1) % states.length;
    setCardState(states[nextIndex]);
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant='h4' gutterBottom>
        Animation States Demo
      </Typography>

      <Box sx={{ mb: 4 }}>
        <AnimatedButton onClick={cycleState}>
          Current State: {cardState} (Click to cycle)
        </AnimatedButton>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <AnimatedCard
            variant='premium'
            animation='scale'
            header={{
              title: `Card State: ${cardState}`,
              subheader: 'Premium variant',
            }}
          >
            <Typography>
              This card demonstrates different animation states. The current
              state is: <strong>{cardState}</strong>
            </Typography>
          </AnimatedCard>
        </Grid>

        <Grid item xs={12} md={4}>
          <AnimatedCard
            variant='glass'
            animation='glow'
            header={{
              title: 'Glass Variant',
              subheader: 'With glow animation',
            }}
          >
            <Typography>
              Glass morphism card with dynamic glow effects based on the current
              animation state.
            </Typography>
          </AnimatedCard>
        </Grid>

        <Grid item xs={12} md={4}>
          <AnimatedCard
            variant='executive'
            animation='tilt'
            header={{
              title: 'Executive Variant',
              subheader: '3D tilt interaction',
            }}
          >
            <Typography sx={{ color: 'white' }}>
              Executive style with 3D mouse tracking for premium interaction
              feedback.
            </Typography>
          </AnimatedCard>
        </Grid>
      </Grid>
    </Box>
  );
};

// Complete showcase component
export const AnimationShowcase = () => {
  return (
    <Box>
      <ButtonShowcase />
      <CardShowcase />
      <AnimationStatesDemo />
    </Box>
  );
};

export default AnimationShowcase;
