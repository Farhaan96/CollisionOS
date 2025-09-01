// Tests for Advanced Animation Components
// Comprehensive testing for AnimatedButton and AnimatedCard components

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import '@testing-library/jest-dom';

import AnimatedButton, {
  PremiumButton,
  ExecutiveButton,
  GlassButton,
} from './AnimatedButton';

import AnimatedCard, {
  PremiumCard,
  GlassCard,
  ExecutiveCard,
  CardGrid,
} from './AnimatedCard';

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }) => children,
  useMotionValue: () => ({ set: jest.fn() }),
  useSpring: () => ({ set: jest.fn() }),
  useTransform: () => ({ set: jest.fn() }),
  useAnimation: () => ({
    start: jest.fn(),
    stop: jest.fn(),
    set: jest.fn(),
  }),
  useInView: () => true,
  useReducedMotion: () => false,
}));

// Test theme
const testTheme = createTheme();

const renderWithTheme = component => {
  return render(<ThemeProvider theme={testTheme}>{component}</ThemeProvider>);
};

describe('AnimatedButton', () => {
  it('renders with default props', () => {
    renderWithTheme(<AnimatedButton>Test Button</AnimatedButton>);

    expect(screen.getByText('Test Button')).toBeInTheDocument();
  });

  it('handles click events', async () => {
    const handleClick = jest.fn();
    const user = userEvent.setup();

    renderWithTheme(
      <AnimatedButton onClick={handleClick}>Clickable Button</AnimatedButton>
    );

    await user.click(screen.getByText('Clickable Button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('shows loading state correctly', () => {
    renderWithTheme(
      <AnimatedButton state='loading'>Loading Button</AnimatedButton>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows success state correctly', () => {
    renderWithTheme(
      <AnimatedButton state='success'>Success Button</AnimatedButton>
    );

    expect(screen.getByText('Success!')).toBeInTheDocument();
  });

  it('shows error state correctly', () => {
    renderWithTheme(
      <AnimatedButton state='error'>Error Button</AnimatedButton>
    );

    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  it('is disabled when disabled prop is true', () => {
    renderWithTheme(<AnimatedButton disabled>Disabled Button</AnimatedButton>);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('is disabled during loading state', () => {
    renderWithTheme(
      <AnimatedButton state='loading'>Loading Button</AnimatedButton>
    );

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('renders with icon', () => {
    const TestIcon = () => <span data-testid='test-icon'>Icon</span>;

    renderWithTheme(
      <AnimatedButton icon={<TestIcon />}>Button with Icon</AnimatedButton>
    );

    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  it('renders with end icon', () => {
    const EndIcon = () => <span data-testid='end-icon'>End</span>;

    renderWithTheme(
      <AnimatedButton endIcon={<EndIcon />}>
        Button with End Icon
      </AnimatedButton>
    );

    expect(screen.getByTestId('end-icon')).toBeInTheDocument();
  });

  it('applies fullWidth prop', () => {
    renderWithTheme(
      <AnimatedButton fullWidth>Full Width Button</AnimatedButton>
    );

    const buttonContainer = screen
      .getByText('Full Width Button')
      .closest('div');
    expect(buttonContainer).toHaveStyle('width: 100%');
  });

  describe('Button Variants', () => {
    it('renders PremiumButton correctly', () => {
      renderWithTheme(<PremiumButton>Premium</PremiumButton>);

      expect(screen.getByText('Premium')).toBeInTheDocument();
    });

    it('renders ExecutiveButton correctly', () => {
      renderWithTheme(<ExecutiveButton>Executive</ExecutiveButton>);

      expect(screen.getByText('Executive')).toBeInTheDocument();
    });

    it('renders GlassButton correctly', () => {
      renderWithTheme(<GlassButton>Glass</GlassButton>);

      expect(screen.getByText('Glass')).toBeInTheDocument();
    });
  });
});

describe('AnimatedCard', () => {
  it('renders with children content', () => {
    renderWithTheme(
      <AnimatedCard>
        <div>Card Content</div>
      </AnimatedCard>
    );

    expect(screen.getByText('Card Content')).toBeInTheDocument();
  });

  it('renders with header', () => {
    const header = {
      title: 'Card Title',
      subheader: 'Card Subtitle',
    };

    renderWithTheme(
      <AnimatedCard header={header}>Card with Header</AnimatedCard>
    );

    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('Card Subtitle')).toBeInTheDocument();
  });

  it('renders with actions', () => {
    const actions = <button data-testid='card-action'>Action Button</button>;

    renderWithTheme(
      <AnimatedCard actions={actions}>Card with Actions</AnimatedCard>
    );

    expect(screen.getByTestId('card-action')).toBeInTheDocument();
  });

  it('handles card click when interactive', async () => {
    const handleClick = jest.fn();
    const user = userEvent.setup();

    renderWithTheme(
      <AnimatedCard onCardClick={handleClick} interactive>
        Interactive Card
      </AnimatedCard>
    );

    await user.click(screen.getByText('Interactive Card'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('supports flippable functionality', async () => {
    const user = userEvent.setup();

    renderWithTheme(
      <AnimatedCard flippable backContent={<div>Back Content</div>}>
        Front Content
      </AnimatedCard>
    );

    // Initially shows front content
    expect(screen.getByText('Front Content')).toBeInTheDocument();

    // Click to flip
    await user.click(screen.getByText('Front Content'));

    // Should show back content (mocked animation)
    await waitFor(() => {
      expect(screen.getByText('Back Content')).toBeInTheDocument();
    });
  });

  describe('Card Variants', () => {
    it('renders PremiumCard correctly', () => {
      renderWithTheme(<PremiumCard>Premium Card Content</PremiumCard>);

      expect(screen.getByText('Premium Card Content')).toBeInTheDocument();
    });

    it('renders GlassCard correctly', () => {
      renderWithTheme(<GlassCard>Glass Card Content</GlassCard>);

      expect(screen.getByText('Glass Card Content')).toBeInTheDocument();
    });

    it('renders ExecutiveCard correctly', () => {
      renderWithTheme(<ExecutiveCard>Executive Card Content</ExecutiveCard>);

      expect(screen.getByText('Executive Card Content')).toBeInTheDocument();
    });
  });

  describe('CardGrid', () => {
    it('renders multiple cards in grid layout', () => {
      renderWithTheme(
        <CardGrid>
          <AnimatedCard>Card 1</AnimatedCard>
          <AnimatedCard>Card 2</AnimatedCard>
          <AnimatedCard>Card 3</AnimatedCard>
        </CardGrid>
      );

      expect(screen.getByText('Card 1')).toBeInTheDocument();
      expect(screen.getByText('Card 2')).toBeInTheDocument();
      expect(screen.getByText('Card 3')).toBeInTheDocument();
    });

    it('applies grid styles', () => {
      renderWithTheme(
        <CardGrid data-testid='card-grid'>
          <AnimatedCard>Card</AnimatedCard>
        </CardGrid>
      );

      const grid = screen.getByTestId('card-grid');
      expect(grid).toHaveStyle('display: grid');
    });
  });
});

describe('Accessibility', () => {
  it('AnimatedButton respects disabled state for accessibility', () => {
    renderWithTheme(<AnimatedButton disabled>Disabled Button</AnimatedButton>);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('disabled');
  });

  it('AnimatedCard maintains semantic structure', () => {
    renderWithTheme(
      <AnimatedCard>
        <h2>Card Heading</h2>
        <p>Card content paragraph</p>
      </AnimatedCard>
    );

    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
  });
});

describe('Performance', () => {
  it('does not cause memory leaks with rapid state changes', async () => {
    const { rerender } = renderWithTheme(
      <AnimatedButton state='idle'>Button</AnimatedButton>
    );

    // Rapidly change states
    const states = ['loading', 'success', 'error', 'idle'];

    for (let i = 0; i < 10; i++) {
      for (const state of states) {
        rerender(
          <ThemeProvider theme={testTheme}>
            <AnimatedButton state={state}>Button</AnimatedButton>
          </ThemeProvider>
        );
      }
    }

    // Should not throw or cause performance issues
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});

describe('Integration', () => {
  it('works with Material-UI theme', () => {
    const customTheme = createTheme({
      palette: {
        primary: {
          main: '#ff0000',
        },
      },
    });

    render(
      <ThemeProvider theme={customTheme}>
        <AnimatedButton>Themed Button</AnimatedButton>
      </ThemeProvider>
    );

    expect(screen.getByText('Themed Button')).toBeInTheDocument();
  });

  it('AnimatedButton and AnimatedCard work together', () => {
    renderWithTheme(
      <AnimatedCard>
        <AnimatedButton>Card Button</AnimatedButton>
      </AnimatedCard>
    );

    expect(screen.getByText('Card Button')).toBeInTheDocument();
  });
});
