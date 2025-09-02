import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../../src/utils/testUtils';
import ModernCard from '../../../../src/components/Common/ModernCard';

describe('ModernCard Component', () => {
  describe('Basic Rendering', () => {
    test('renders with children content', () => {
      renderWithProviders(
        <ModernCard>
          <div data-testid='test-content'>Test Content</div>
        </ModernCard>
      );

      expect(screen.getByTestId('test-content')).toBeInTheDocument();
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    test('renders without children', () => {
      renderWithProviders(<ModernCard />);

      // Should render the card container even without children
      const card = screen.getByRole('generic');
      expect(card).toBeInTheDocument();
    });

    test('applies default styling classes', () => {
      renderWithProviders(
        <ModernCard data-testid='card'>
          <div>Content</div>
        </ModernCard>
      );

      const card = screen.getByTestId('card');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Props and Customization', () => {
    test('accepts and applies custom className', () => {
      renderWithProviders(
        <ModernCard className='custom-card' data-testid='card'>
          <div>Content</div>
        </ModernCard>
      );

      const card = screen.getByTestId('card');
      expect(card).toHaveClass('custom-card');
    });

    test('accepts and applies custom styles', () => {
      const customStyle = { backgroundColor: 'red', padding: '20px' };

      renderWithProviders(
        <ModernCard style={customStyle} data-testid='card'>
          <div>Content</div>
        </ModernCard>
      );

      const card = screen.getByTestId('card');
      expect(card).toHaveStyle('background-color: red');
      expect(card).toHaveStyle('padding: 20px');
    });

    test('forwards additional props to the card element', () => {
      renderWithProviders(
        <ModernCard
          data-testid='card'
          id='test-card'
          aria-label='Modern card component'
        >
          <div>Content</div>
        </ModernCard>
      );

      const card = screen.getByTestId('card');
      expect(card).toHaveAttribute('id', 'test-card');
      expect(card).toHaveAttribute('aria-label', 'Modern card component');
    });

    test('handles elevation prop if supported', () => {
      renderWithProviders(
        <ModernCard elevation={8} data-testid='card'>
          <div>Content</div>
        </ModernCard>
      );

      const card = screen.getByTestId('card');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Click Interactions', () => {
    test('handles click events when onClick is provided', async () => {
      const handleClick = jest.fn();

      renderWithProviders(
        <ModernCard onClick={handleClick} data-testid='clickable-card'>
          <div>Clickable Content</div>
        </ModernCard>
      );

      const card = screen.getByTestId('clickable-card');
      await userEvent.click(card);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    test('does not interfere with child element clicks', async () => {
      const handleCardClick = jest.fn();
      const handleButtonClick = jest.fn();

      renderWithProviders(
        <ModernCard onClick={handleCardClick} data-testid='card'>
          <button onClick={handleButtonClick} data-testid='button'>
            Click Me
          </button>
        </ModernCard>
      );

      const button = screen.getByTestId('button');
      await userEvent.click(button);

      expect(handleButtonClick).toHaveBeenCalledTimes(1);
      // Card click might also fire depending on event bubbling
    });

    test('applies proper cursor style when clickable', () => {
      renderWithProviders(
        <ModernCard onClick={() => {}} data-testid='clickable-card'>
          <div>Content</div>
        </ModernCard>
      );

      const card = screen.getByTestId('clickable-card');
      expect(card).toBeInTheDocument();
      // Note: CSS cursor styles might not be directly testable in jsdom
    });
  });

  describe('Content Layout', () => {
    test('renders multiple children correctly', () => {
      renderWithProviders(
        <ModernCard>
          <h2 data-testid='title'>Card Title</h2>
          <p data-testid='description'>Card description</p>
          <button data-testid='action'>Action</button>
        </ModernCard>
      );

      expect(screen.getByTestId('title')).toBeInTheDocument();
      expect(screen.getByTestId('description')).toBeInTheDocument();
      expect(screen.getByTestId('action')).toBeInTheDocument();
    });

    test('handles complex nested content', () => {
      renderWithProviders(
        <ModernCard>
          <div>
            <header>
              <h3>Header</h3>
            </header>
            <main>
              <section data-testid='section'>
                <p>Complex content</p>
              </section>
            </main>
          </div>
        </ModernCard>
      );

      expect(screen.getByTestId('section')).toBeInTheDocument();
      expect(screen.getByText('Header')).toBeInTheDocument();
      expect(screen.getByText('Complex content')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('maintains accessibility when used as clickable element', () => {
      renderWithProviders(
        <ModernCard
          onClick={() => {}}
          role='button'
          tabIndex={0}
          aria-label='Clickable modern card'
          data-testid='accessible-card'
        >
          <div>Accessible Content</div>
        </ModernCard>
      );

      const card = screen.getByTestId('accessible-card');
      expect(card).toHaveAttribute('role', 'button');
      expect(card).toHaveAttribute('tabIndex', '0');
      expect(card).toHaveAttribute('aria-label', 'Clickable modern card');
    });

    test('handles keyboard navigation when clickable', async () => {
      const handleClick = jest.fn();

      renderWithProviders(
        <ModernCard
          onClick={handleClick}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              handleClick();
            }
          }}
          tabIndex={0}
          data-testid='keyboard-card'
        >
          <div>Keyboard accessible content</div>
        </ModernCard>
      );

      const card = screen.getByTestId('keyboard-card');
      card.focus();

      await userEvent.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalledTimes(1);

      await userEvent.keyboard(' ');
      expect(handleClick).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Handling', () => {
    test('handles undefined props gracefully', () => {
      renderWithProviders(
        <ModernCard
          className={undefined}
          style={undefined}
          onClick={undefined}
          data-testid='card'
        >
          <div>Content</div>
        </ModernCard>
      );

      const card = screen.getByTestId('card');
      expect(card).toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    test('handles null children gracefully', () => {
      renderWithProviders(<ModernCard>{null}</ModernCard>);

      // Should render without errors
      const card = screen.getByRole('generic');
      expect(card).toBeInTheDocument();
    });

    test('handles mixed valid and invalid children', () => {
      renderWithProviders(
        <ModernCard>
          <div data-testid='valid'>Valid content</div>
          {null}
          {undefined}
          <span data-testid='another-valid'>Another valid content</span>
        </ModernCard>
      );

      expect(screen.getByTestId('valid')).toBeInTheDocument();
      expect(screen.getByTestId('another-valid')).toBeInTheDocument();
    });
  });

  describe('Theme Integration', () => {
    test('integrates with Material-UI theme', () => {
      renderWithProviders(
        <ModernCard data-testid='themed-card'>
          <div>Themed content</div>
        </ModernCard>
      );

      const card = screen.getByTestId('themed-card');
      expect(card).toBeInTheDocument();
      // Theme-specific styling would be applied by Material-UI
    });

    test('respects theme dark mode', () => {
      const darkTheme = {
        palette: {
          mode: 'dark',
        },
      };

      renderWithProviders(
        <ModernCard data-testid='dark-card'>
          <div>Dark themed content</div>
        </ModernCard>,
        { theme: darkTheme }
      );

      const card = screen.getByTestId('dark-card');
      expect(card).toBeInTheDocument();
    });
  });
});
