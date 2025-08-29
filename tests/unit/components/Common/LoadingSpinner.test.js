import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../../src/utils/testUtils';
import { LoadingSpinner } from '../../../../src/components/Common/LoadingSpinner';

describe('LoadingSpinner Component', () => {
  describe('Basic Rendering', () => {
    test('renders loading spinner with default props', () => {
      renderWithProviders(<LoadingSpinner />);
      
      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toBeInTheDocument();
      expect(progressbar).toHaveClass('MuiCircularProgress-root');
    });

    test('renders with custom size', () => {
      renderWithProviders(<LoadingSpinner size={60} />);
      
      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toBeInTheDocument();
    });

    test('renders with loading text when provided', () => {
      renderWithProviders(<LoadingSpinner message="Loading data..." />);
      
      expect(screen.getByText('Loading data...')).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    test('renders without text when text prop is empty', () => {
      renderWithProviders(<LoadingSpinner message="" />);
      
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.queryByText('')).not.toBeInTheDocument();
    });
  });

  describe('Color Variants', () => {
    test('renders with primary color', () => {
      renderWithProviders(<LoadingSpinner color="primary" />);
      
      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toBeInTheDocument();
    });

    test('renders with secondary color', () => {
      renderWithProviders(<LoadingSpinner color="secondary" />);
      
      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA role', () => {
      renderWithProviders(<LoadingSpinner />);
      
      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('role', 'progressbar');
    });

    test('includes accessible text when provided', () => {
      renderWithProviders(<LoadingSpinner message="Loading application data" />);
      
      const text = screen.getByText('Loading application data');
      expect(text).toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    test('maintains consistent structure with text', () => {
      renderWithProviders(<LoadingSpinner message="Please wait..." />);
      
      // Should have both spinner and text
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.getByText('Please wait...')).toBeInTheDocument();
    });

    test('maintains consistent structure without text', () => {
      renderWithProviders(<LoadingSpinner />);
      
      // Should only have spinner
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('Props Handling', () => {
    test('handles undefined props gracefully', () => {
      renderWithProviders(<LoadingSpinner size={undefined} color={undefined} message={undefined} />);
      
      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toBeInTheDocument();
    });

    test('handles null props gracefully', () => {
      renderWithProviders(<LoadingSpinner size={null} color={null} message={null} />);
      
      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toBeInTheDocument();
    });
  });
});