import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import ValidationEngine, {
  ValidationDisplay,
  ValidationSummary,
  VALIDATION_TYPES,
  BUILT_IN_RULES,
} from '../../../../src/components/Forms/ValidationEngine';

const theme = createTheme();

const TestWrapper = ({ children }) => (
  <ThemeProvider theme={theme}>{children}</ThemeProvider>
);

describe('ValidationEngine', () => {
  let validationEngine;

  beforeEach(() => {
    validationEngine = new ValidationEngine();
  });

  describe('Built-in Validation Rules', () => {
    describe('REQUIRED validation', () => {
      it('validates required fields correctly', async () => {
        const result = await validationEngine.validateField('testField', '', {
          validation: [{ type: VALIDATION_TYPES.REQUIRED }],
        });

        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].message).toContain('required');
      });

      it('passes validation when required field has value', async () => {
        const result = await validationEngine.validateField(
          'testField',
          'value',
          { validation: [{ type: VALIDATION_TYPES.REQUIRED }] }
        );

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    describe('EMAIL validation', () => {
      it('validates email format correctly', async () => {
        const invalidEmails = [
          'invalid',
          'invalid@',
          '@invalid.com',
          'invalid@invalid',
        ];

        for (const email of invalidEmails) {
          const result = await validationEngine.validateField('email', email, {
            validation: [{ type: VALIDATION_TYPES.EMAIL }],
          });

          expect(result.isValid).toBe(false);
          expect(result.errors[0].message).toContain('email');
        }
      });

      it('passes validation for valid email addresses', async () => {
        const validEmails = [
          'test@example.com',
          'user.name@domain.co.uk',
          'firstname+lastname@example.com',
        ];

        for (const email of validEmails) {
          const result = await validationEngine.validateField('email', email, {
            validation: [{ type: VALIDATION_TYPES.EMAIL }],
          });

          expect(result.isValid).toBe(true);
          expect(result.errors).toHaveLength(0);
        }
      });

      it('passes validation for empty email when not required', async () => {
        const result = await validationEngine.validateField('email', '', {
          validation: [{ type: VALIDATION_TYPES.EMAIL }],
        });

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    describe('MIN_LENGTH validation', () => {
      it('validates minimum length correctly', async () => {
        const result = await validationEngine.validateField(
          'testField',
          'abc',
          {
            validation: [
              { type: VALIDATION_TYPES.MIN_LENGTH, options: { min: 5 } },
            ],
          }
        );

        expect(result.isValid).toBe(false);
        expect(result.errors[0].message).toContain('5 characters');
      });

      it('passes validation when length meets minimum', async () => {
        const result = await validationEngine.validateField(
          'testField',
          'abcdef',
          {
            validation: [
              { type: VALIDATION_TYPES.MIN_LENGTH, options: { min: 5 } },
            ],
          }
        );

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    describe('PATTERN validation', () => {
      it('validates pattern correctly', async () => {
        const result = await validationEngine.validateField(
          'testField',
          'abc123',
          {
            validation: [
              {
                type: VALIDATION_TYPES.PATTERN,
                options: {
                  regex: /^[a-zA-Z]+$/,
                  message: 'Only letters allowed',
                },
              },
            ],
          }
        );

        expect(result.isValid).toBe(false);
        expect(result.errors[0].message).toBe('Only letters allowed');
      });

      it('passes validation when pattern matches', async () => {
        const result = await validationEngine.validateField(
          'testField',
          'abcdef',
          {
            validation: [
              {
                type: VALIDATION_TYPES.PATTERN,
                options: { regex: /^[a-zA-Z]+$/ },
              },
            ],
          }
        );

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    describe('NUMBER validation', () => {
      it('validates number format correctly', async () => {
        const result = await validationEngine.validateField(
          'testField',
          'not-a-number',
          { validation: [{ type: VALIDATION_TYPES.NUMBER }] }
        );

        expect(result.isValid).toBe(false);
        expect(result.errors[0].message).toContain('valid number');
      });

      it('passes validation for valid numbers', async () => {
        const validNumbers = ['123', '123.45', '0', '-123'];

        for (const number of validNumbers) {
          const result = await validationEngine.validateField(
            'testField',
            number,
            { validation: [{ type: VALIDATION_TYPES.NUMBER }] }
          );

          expect(result.isValid).toBe(true);
          expect(result.errors).toHaveLength(0);
        }
      });
    });

    describe('URL validation', () => {
      it('validates URL format correctly', async () => {
        const invalidUrls = ['not-a-url', 'http://', 'ftp://invalid'];

        for (const url of invalidUrls) {
          const result = await validationEngine.validateField(
            'testField',
            url,
            { validation: [{ type: VALIDATION_TYPES.URL }] }
          );

          expect(result.isValid).toBe(false);
          expect(result.errors[0].message).toContain('valid URL');
        }
      });

      it('passes validation for valid URLs', async () => {
        const validUrls = [
          'https://example.com',
          'http://subdomain.example.co.uk',
          'https://example.com/path?query=value',
        ];

        for (const url of validUrls) {
          const result = await validationEngine.validateField(
            'testField',
            url,
            { validation: [{ type: VALIDATION_TYPES.URL }] }
          );

          expect(result.isValid).toBe(true);
          expect(result.errors).toHaveLength(0);
        }
      });
    });
  });

  describe('Custom Validation Rules', () => {
    it('allows adding custom validation rules', async () => {
      validationEngine.addRule('custom_uppercase', {
        validate: value => !value || value === value.toUpperCase(),
        message: 'Value must be uppercase',
        severity: 'error',
      });

      const result = await validationEngine.validateField(
        'testField',
        'lowercase',
        { validation: [{ type: 'custom_uppercase' }] }
      );

      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toBe('Value must be uppercase');
    });

    it('supports custom validation functions in schema', async () => {
      const result = await validationEngine.validateField('testField', 'test', {
        validation: [
          {
            type: VALIDATION_TYPES.CUSTOM,
            validate: value =>
              value.length > 5 || 'Must be longer than 5 characters',
            message: 'Custom validation failed',
          },
        ],
      });

      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toBe('Must be longer than 5 characters');
    });
  });

  describe('Async Validation', () => {
    it('handles async validation correctly', async () => {
      const asyncValidator = jest.fn().mockResolvedValue({
        message: 'Async validation failed',
        severity: 'error',
      });

      validationEngine.addAsyncValidator('testField', asyncValidator);

      const result = await validationEngine.validateField(
        'testField',
        'test-value',
        {},
        {}
      );

      expect(asyncValidator).toHaveBeenCalledWith('test-value', {});
      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toBe('Async validation failed');
      expect(result.errors[0].async).toBe(true);
    });

    it('handles async validation success', async () => {
      const asyncValidator = jest.fn().mockResolvedValue(true);
      validationEngine.addAsyncValidator('testField', asyncValidator);

      const result = await validationEngine.validateField(
        'testField',
        'test-value',
        {},
        {}
      );

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('handles async validation errors', async () => {
      const asyncValidator = jest
        .fn()
        .mockRejectedValue(new Error('Network error'));
      validationEngine.addAsyncValidator('testField', asyncValidator);

      const result = await validationEngine.validateField(
        'testField',
        'test-value',
        {},
        {}
      );

      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toBe('Validation service error');
      expect(result.errors[0].async).toBe(true);
    });
  });

  describe('Cross-field Validation', () => {
    it('validates cross-field dependencies', async () => {
      const crossFieldValidator = jest.fn().mockResolvedValue({
        confirmPassword: {
          isValid: false,
          errors: [{ message: 'Passwords do not match', severity: 'error' }],
        },
      });

      validationEngine.addCrossFieldValidator(crossFieldValidator);

      const result = await validationEngine.validateCrossFields({
        password: 'password123',
        confirmPassword: 'different',
      });

      expect(crossFieldValidator).toHaveBeenCalledWith({
        password: 'password123',
        confirmPassword: 'different',
      });
      expect(result.confirmPassword.errors[0].message).toBe(
        'Passwords do not match'
      );
    });
  });

  describe('Validation Caching', () => {
    it('caches validation results by default', async () => {
      const mockValidate = jest.spyOn(
        BUILT_IN_RULES[VALIDATION_TYPES.EMAIL],
        'validate'
      );

      // First validation
      await validationEngine.validateField('email', 'test@example.com', {
        validation: [{ type: VALIDATION_TYPES.EMAIL }],
      });

      // Second validation with same parameters
      await validationEngine.validateField('email', 'test@example.com', {
        validation: [{ type: VALIDATION_TYPES.EMAIL }],
      });

      // Should only validate once due to caching
      expect(mockValidate).toHaveBeenCalledTimes(1);
    });

    it('can clear validation cache', async () => {
      await validationEngine.validateField('email', 'test@example.com', {
        validation: [{ type: VALIDATION_TYPES.EMAIL }],
      });

      validationEngine.clearCache();

      const mockValidate = jest.spyOn(
        BUILT_IN_RULES[VALIDATION_TYPES.EMAIL],
        'validate'
      );

      await validationEngine.validateField('email', 'test@example.com', {
        validation: [{ type: VALIDATION_TYPES.EMAIL }],
      });

      expect(mockValidate).toHaveBeenCalled();
    });
  });

  describe('Validation Severity Levels', () => {
    it('supports different severity levels', async () => {
      const result = await validationEngine.validateField('testField', 'test', {
        validation: [
          {
            type: VALIDATION_TYPES.MIN_LENGTH,
            options: { min: 10 },
            severity: 'warning',
          },
        ],
      });

      expect(result.isValid).toBe(true); // Warnings don't make field invalid
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].severity).toBe('warning');
    });
  });
});

describe('ValidationDisplay Component', () => {
  const mockValidationResult = {
    isValid: false,
    errors: [
      {
        message: 'This field is required',
        severity: 'error',
        type: 'required',
      },
    ],
    warnings: [
      {
        message: 'Consider using a longer password',
        severity: 'warning',
        type: 'password_strength',
      },
    ],
    infos: [
      { message: 'Password strength: Medium', severity: 'info', type: 'info' },
    ],
  };

  it('renders validation errors', () => {
    render(
      <TestWrapper>
        <ValidationDisplay validationResult={mockValidationResult} />
      </TestWrapper>
    );

    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('shows expand button when multiple issues exist', () => {
    render(
      <TestWrapper>
        <ValidationDisplay validationResult={mockValidationResult} />
      </TestWrapper>
    );

    expect(screen.getByText('+2 more')).toBeInTheDocument();
  });

  it('expands to show all validation issues', async () => {

    render(
      <TestWrapper>
        <ValidationDisplay validationResult={mockValidationResult} />
      </TestWrapper>
    );

    const expandButton = screen.getByLabelText(/expand/i);
    await userEvent.click(expandButton);

    expect(
      screen.getByText('Consider using a longer password')
    ).toBeInTheDocument();
    expect(screen.getByText('Password strength: Medium')).toBeInTheDocument();
  });

  it('shows retry button for async validation errors', async () => {
    const mockRetry = jest.fn();
    const asyncValidationResult = {
      isValid: false,
      errors: [
        { message: 'Server validation failed', severity: 'error', async: true },
      ],
    };

    render(
      <TestWrapper>
        <ValidationDisplay
          validationResult={asyncValidationResult}
          onRetryAsync={mockRetry}
        />
      </TestWrapper>
    );

    const retryButton = screen.getByLabelText(/retry/i);
    expect(retryButton).toBeInTheDocument();

    await userEvent.click(retryButton);
    expect(mockRetry).toHaveBeenCalled();
  });

  it('shows success chip for valid fields', () => {
    const validResult = {
      isValid: true,
      errors: [],
      warnings: [],
      infos: [],
    };

    render(
      <TestWrapper>
        <ValidationDisplay validationResult={validResult} />
      </TestWrapper>
    );

    expect(screen.getByText('Valid')).toBeInTheDocument();
  });
});

describe('ValidationSummary Component', () => {
  const mockValidationResults = {
    firstName: {
      isValid: true,
      errors: [],
      warnings: [],
      infos: [],
    },
    email: {
      isValid: false,
      errors: [{ message: 'Invalid email format', severity: 'error' }],
      warnings: [],
      infos: [],
    },
    password: {
      isValid: true,
      errors: [],
      warnings: [
        { message: 'Consider using a stronger password', severity: 'warning' },
      ],
      infos: [],
    },
  };

  it('renders validation summary with correct stats', () => {
    render(
      <TestWrapper>
        <ValidationSummary validationResults={mockValidationResults} />
      </TestWrapper>
    );

    expect(screen.getByText('Form Validation Summary')).toBeInTheDocument();
    expect(screen.getByText('1 Valid')).toBeInTheDocument();
    expect(screen.getByText('1 Errors')).toBeInTheDocument();
    expect(screen.getByText('1 Warnings')).toBeInTheDocument();
  });

  it('calculates overall validation score', () => {
    render(
      <TestWrapper>
        <ValidationSummary validationResults={mockValidationResults} />
      </TestWrapper>
    );

    // Should show percentage based on valid + half-weight warnings
    // (1 valid + 0.5 * 1 warning) / 3 total = 50%
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('shows progress bar with correct color', () => {
    render(
      <TestWrapper>
        <ValidationSummary validationResults={mockValidationResults} />
      </TestWrapper>
    );

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveAttribute('aria-valuenow', '50');
  });

  it('expands to show detailed field information', async () => {

    render(
      <TestWrapper>
        <ValidationSummary validationResults={mockValidationResults} />
      </TestWrapper>
    );

    const expandButton = screen.getByLabelText(/expand/i);
    await userEvent.click(expandButton);

    expect(screen.getByText('Fields with Errors')).toBeInTheDocument();
    expect(screen.getByText('email')).toBeInTheDocument();
    expect(screen.getByText('• Invalid email format')).toBeInTheDocument();
  });

  it('calls onFieldFocus when field is clicked', async () => {
    const mockOnFieldFocus = jest.fn();

    render(
      <TestWrapper>
        <ValidationSummary
          validationResults={mockValidationResults}
          onFieldFocus={mockOnFieldFocus}
        />
      </TestWrapper>
    );

    // Expand first
    const expandButton = screen.getByLabelText(/expand/i);
    await userEvent.click(expandButton);

    // Click on email field
    const emailField = screen.getByText('email');
    await userEvent.click(emailField);

    expect(mockOnFieldFocus).toHaveBeenCalledWith('email');
  });

  it('hides warnings when showWarnings is false', () => {
    render(
      <TestWrapper>
        <ValidationSummary
          validationResults={mockValidationResults}
          showWarnings={false}
        />
      </TestWrapper>
    );

    expect(screen.queryByText('1 Warnings')).not.toBeInTheDocument();
  });

  it('shows valid fields when showSuccessFields is true', async () => {

    render(
      <TestWrapper>
        <ValidationSummary
          validationResults={mockValidationResults}
          showSuccessFields={true}
        />
      </TestWrapper>
    );

    // Expand first
    const expandButton = screen.getByLabelText(/expand/i);
    await userEvent.click(expandButton);

    expect(screen.getByText('Valid Fields')).toBeInTheDocument();
    expect(screen.getByText('firstName')).toBeInTheDocument();
  });
});
