/**
 * BMSFileUpload Component Unit Tests
 * Tests the BMS file upload UI component functionality
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import BMSFileUpload from '../../../src/components/Common/BMSFileUpload';
import bmsService from '../../../src/services/bmsService';

// Mock the BMS service
jest.mock('../../../src/services/bmsService');

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    paper: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }) => children,
  useSpring: () => ({}),
}));

const theme = createTheme();

const renderWithTheme = component => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

// Helper function to create mock files
const createMockFile = (
  name = 'test.xml',
  content = '<xml>test</xml>',
  type = 'text/xml'
) => {
  const file = new File([content], name, { type });
  return file;
};

describe('BMSFileUpload Component', () => {
  const mockOnUploadComplete = jest.fn();
  const mockOnError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock FileReader
    global.FileReader = jest.fn(() => ({
      readAsText: jest.fn(),
      onload: null,
      onerror: null,
      result: null,
    }));
  });

  afterEach(() => {
    delete global.FileReader;
  });

  describe('Initial Rendering', () => {
    it('should render upload area correctly', () => {
      renderWithTheme(<BMSFileUpload />);

      expect(screen.getByText('Upload BMS Files')).toBeInTheDocument();
      expect(
        screen.getByText(/Drag and drop BMS XML files here/)
      ).toBeInTheDocument();
      expect(screen.getByLabelText('Upload BMS XML files')).toBeInTheDocument();
    });

    it('should display supported format chips', () => {
      renderWithTheme(<BMSFileUpload />);

      expect(screen.getByText('XML Format')).toBeInTheDocument();
      expect(screen.getByText('Fast Processing')).toBeInTheDocument();
      expect(screen.getByText('Auto Parse')).toBeInTheDocument();
    });

    it('should show support information', () => {
      renderWithTheme(<BMSFileUpload />);

      expect(
        screen.getByText(/Supports Mitchell Estimating BMS XML files/)
      ).toBeInTheDocument();
      expect(screen.getByText(/Multiple files supported/)).toBeInTheDocument();
    });
  });

  describe('File Selection', () => {
    it('should handle file selection through input', async () => {
      const user = userEvent.setup();
      renderWithTheme(
        <BMSFileUpload onUploadComplete={mockOnUploadComplete} />
      );

      const fileInput = screen.getByLabelText('Upload BMS XML files');
      const mockFile = createMockFile();

      // Mock successful BMS service response
      bmsService.uploadBMSFile.mockResolvedValue({
        success: true,
        data: { customer: {}, vehicle: {}, job: {} },
        message: 'BMS file processed successfully',
      });

      // Mock FileReader
      const mockFileReader = {
        readAsText: jest.fn(),
        onload: null,
        onerror: null,
        result: '<xml>test</xml>',
      };
      global.FileReader = jest.fn(() => mockFileReader);

      await user.upload(fileInput, mockFile);

      // Simulate FileReader success
      setTimeout(() => {
        mockFileReader.onload({ target: { result: '<xml>test</xml>' } });
      }, 0);

      await waitFor(() => {
        expect(bmsService.uploadBMSFile).toHaveBeenCalledWith(mockFile);
      });
    });

    it('should handle multiple file selection', async () => {
      const user = userEvent.setup();
      renderWithTheme(
        <BMSFileUpload onUploadComplete={mockOnUploadComplete} />
      );

      const fileInput = screen.getByLabelText('Upload BMS XML files');
      const mockFiles = [
        createMockFile('test1.xml'),
        createMockFile('test2.xml'),
      ];

      bmsService.uploadBMSFile.mockResolvedValue({
        success: true,
        data: {},
        message: 'Success',
      });

      await user.upload(fileInput, mockFiles);

      expect(fileInput.files).toHaveLength(2);
    });

    it('should filter non-XML files', async () => {
      const user = userEvent.setup();
      renderWithTheme(<BMSFileUpload onError={mockOnError} />);

      const fileInput = screen.getByLabelText('Upload BMS XML files');

      // Try to upload a non-XML file through drag and drop
      const mockEvent = {
        preventDefault: jest.fn(),
        dataTransfer: {
          files: [createMockFile('test.txt', 'text content', 'text/plain')],
        },
      };

      const uploadArea =
        screen.getByText('Upload BMS Files').closest('[role="button"]') ||
        screen.getByText('Upload BMS Files').closest('div');

      if (uploadArea) {
        fireEvent.drop(uploadArea, mockEvent);

        await waitFor(() => {
          expect(
            screen.getByText(/Please upload valid BMS XML files/)
          ).toBeInTheDocument();
        });
      }
    });
  });

  describe('Drag and Drop Functionality', () => {
    it('should handle drag over events', async () => {
      renderWithTheme(<BMSFileUpload />);

      const uploadArea = screen.getByText('Upload BMS Files').closest('div');

      fireEvent.dragOver(uploadArea, {
        dataTransfer: {
          files: [createMockFile()],
        },
      });

      // Should show "Drop Files Here" when dragging
      await waitFor(() => {
        expect(screen.getByText('Drop Files Here')).toBeInTheDocument();
      });
    });

    it('should handle drag leave events', async () => {
      renderWithTheme(<BMSFileUpload />);

      const uploadArea = screen.getByText('Upload BMS Files').closest('div');

      // First drag over
      fireEvent.dragOver(uploadArea);

      // Then drag leave
      fireEvent.dragLeave(uploadArea);

      // Should return to normal state
      await waitFor(() => {
        expect(screen.getByText('Upload BMS Files')).toBeInTheDocument();
      });
    });

    it('should handle file drop events', async () => {
      renderWithTheme(
        <BMSFileUpload onUploadComplete={mockOnUploadComplete} />
      );

      const uploadArea = screen.getByText('Upload BMS Files').closest('div');
      const mockFile = createMockFile();

      bmsService.uploadBMSFile.mockResolvedValue({
        success: true,
        data: {},
        message: 'Success',
      });

      const mockFileReader = {
        readAsText: jest.fn(),
        onload: null,
        onerror: null,
        result: '<xml>test</xml>',
      };
      global.FileReader = jest.fn(() => mockFileReader);

      fireEvent.drop(uploadArea, {
        dataTransfer: {
          files: [mockFile],
        },
      });

      // Simulate FileReader success
      setTimeout(() => {
        mockFileReader.onload({ target: { result: '<xml>test</xml>' } });
      }, 0);

      await waitFor(() => {
        expect(bmsService.uploadBMSFile).toHaveBeenCalledWith(mockFile);
      });
    });
  });

  describe('Upload Progress and Feedback', () => {
    it('should show progress during upload', async () => {
      const user = userEvent.setup();
      renderWithTheme(<BMSFileUpload />);

      const fileInput = screen.getByLabelText('Upload BMS XML files');
      const mockFile = createMockFile();

      // Mock delayed response to see progress
      bmsService.uploadBMSFile.mockImplementation(
        () =>
          new Promise(resolve =>
            setTimeout(
              () => resolve({ success: true, data: {}, message: 'Success' }),
              1000
            )
          )
      );

      const mockFileReader = {
        readAsText: jest.fn(),
        onload: null,
        onerror: null,
        result: '<xml>test</xml>',
      };
      global.FileReader = jest.fn(() => mockFileReader);

      await user.upload(fileInput, mockFile);

      // Simulate FileReader success
      setTimeout(() => {
        mockFileReader.onload({ target: { result: '<xml>test</xml>' } });
      }, 0);

      // Should show processing indication
      await waitFor(() => {
        expect(screen.getByText('Processing BMS Files')).toBeInTheDocument();
      });
    });

    it('should show success animation after completion', async () => {
      const user = userEvent.setup();
      renderWithTheme(<BMSFileUpload />);

      const fileInput = screen.getByLabelText('Upload BMS XML files');
      const mockFile = createMockFile();

      bmsService.uploadBMSFile.mockResolvedValue({
        success: true,
        data: {
          customer: { name: 'Test Customer' },
          vehicle: { year: 2020, make: 'Toyota', model: 'Camry' },
          claimInfo: { claimNumber: 'CLM-001' },
        },
        message: 'Success',
      });

      const mockFileReader = {
        readAsText: jest.fn(),
        onload: null,
        onerror: null,
        result: '<xml>test</xml>',
      };
      global.FileReader = jest.fn(() => mockFileReader);

      await user.upload(fileInput, mockFile);

      // Simulate FileReader success
      setTimeout(() => {
        mockFileReader.onload({ target: { result: '<xml>test</xml>' } });
      }, 0);

      await waitFor(() => {
        expect(screen.getByText('Upload Complete!')).toBeInTheDocument();
      });
    });

    it('should display upload statistics', async () => {
      const user = userEvent.setup();
      renderWithTheme(<BMSFileUpload />);

      const fileInput = screen.getByLabelText('Upload BMS XML files');
      const mockFiles = [
        createMockFile('test1.xml'),
        createMockFile('test2.xml'),
      ];

      bmsService.uploadBMSFile
        .mockResolvedValueOnce({ success: true, data: {}, message: 'Success' })
        .mockResolvedValueOnce({ success: true, data: {}, message: 'Success' });

      const mockFileReader = {
        readAsText: jest.fn(),
        onload: null,
        onerror: null,
        result: '<xml>test</xml>',
      };
      global.FileReader = jest.fn(() => mockFileReader);

      await user.upload(fileInput, mockFiles);

      // Simulate FileReader success for each file
      setTimeout(() => {
        mockFileReader.onload({ target: { result: '<xml>test</xml>' } });
      }, 0);

      await waitFor(() => {
        expect(screen.getByText('Successful')).toBeInTheDocument();
        expect(screen.getByText('Errors')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error messages on upload failure', async () => {
      const user = userEvent.setup();
      renderWithTheme(<BMSFileUpload onError={mockOnError} />);

      const fileInput = screen.getByLabelText('Upload BMS XML files');
      const mockFile = createMockFile();

      bmsService.uploadBMSFile.mockResolvedValue({
        success: false,
        error: 'Invalid BMS format',
        message: 'Upload failed',
      });

      const mockFileReader = {
        readAsText: jest.fn(),
        onload: null,
        onerror: null,
        result: '<xml>test</xml>',
      };
      global.FileReader = jest.fn(() => mockFileReader);

      await user.upload(fileInput, mockFile);

      setTimeout(() => {
        mockFileReader.onload({ target: { result: '<xml>test</xml>' } });
      }, 0);

      await waitFor(() => {
        expect(screen.getByText(/Processing Error/)).toBeInTheDocument();
        expect(mockOnError).toHaveBeenCalledWith(
          'Invalid BMS format',
          mockFile
        );
      });
    });

    it('should handle FileReader errors', async () => {
      const user = userEvent.setup();
      renderWithTheme(<BMSFileUpload />);

      const fileInput = screen.getByLabelText('Upload BMS XML files');
      const mockFile = createMockFile();

      const mockFileReader = {
        readAsText: jest.fn(),
        onload: null,
        onerror: null,
        result: null,
      };
      global.FileReader = jest.fn(() => mockFileReader);

      await user.upload(fileInput, mockFile);

      // Simulate FileReader error
      setTimeout(() => {
        mockFileReader.onerror(new Error('File read failed'));
      }, 0);

      await waitFor(() => {
        expect(screen.getByText(/Processing Error/)).toBeInTheDocument();
      });
    });
  });

  describe('File Management', () => {
    it('should display uploaded files list', async () => {
      const user = userEvent.setup();
      renderWithTheme(<BMSFileUpload />);

      const fileInput = screen.getByLabelText('Upload BMS XML files');
      const mockFile = createMockFile('test.xml');

      bmsService.uploadBMSFile.mockResolvedValue({
        success: true,
        data: {
          customer: { name: 'Test Customer' },
          vehicle: { year: 2020, make: 'Toyota', model: 'Camry', vin: '12345' },
          claimInfo: { claimNumber: 'CLM-001' },
        },
        message: 'Success',
      });

      const mockFileReader = {
        readAsText: jest.fn(),
        onload: null,
        onerror: null,
        result: '<xml>test</xml>',
      };
      global.FileReader = jest.fn(() => mockFileReader);

      await user.upload(fileInput, mockFile);

      setTimeout(() => {
        mockFileReader.onload({ target: { result: '<xml>test</xml>' } });
      }, 0);

      await waitFor(() => {
        expect(screen.getByText('Processed Files')).toBeInTheDocument();
        expect(screen.getByText('test.xml')).toBeInTheDocument();
      });
    });

    it('should allow file removal', async () => {
      const user = userEvent.setup();
      renderWithTheme(<BMSFileUpload />);

      const fileInput = screen.getByLabelText('Upload BMS XML files');
      const mockFile = createMockFile('test.xml');

      bmsService.uploadBMSFile.mockResolvedValue({
        success: true,
        data: {},
        message: 'Success',
      });

      const mockFileReader = {
        readAsText: jest.fn(),
        onload: null,
        onerror: null,
        result: '<xml>test</xml>',
      };
      global.FileReader = jest.fn(() => mockFileReader);

      await user.upload(fileInput, mockFile);

      setTimeout(() => {
        mockFileReader.onload({ target: { result: '<xml>test</xml>' } });
      }, 0);

      await waitFor(() => {
        expect(screen.getByText('test.xml')).toBeInTheDocument();
      });

      // Find and click remove button
      const removeButton =
        screen.getByTitle('Remove file') ||
        screen.getByLabelText('Remove file');
      await user.click(removeButton);

      await waitFor(() => {
        expect(screen.queryByText('test.xml')).not.toBeInTheDocument();
      });
    });

    it('should allow file data download', async () => {
      const user = userEvent.setup();

      // Mock URL.createObjectURL and related methods
      global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
      global.URL.revokeObjectURL = jest.fn();

      // Mock document.createElement and click
      const mockLink = {
        href: '',
        download: '',
        click: jest.fn(),
      };
      jest.spyOn(document, 'createElement').mockReturnValue(mockLink);

      renderWithTheme(<BMSFileUpload />);

      const fileInput = screen.getByLabelText('Upload BMS XML files');
      const mockFile = createMockFile('test.xml');

      bmsService.uploadBMSFile.mockResolvedValue({
        success: true,
        data: { test: 'data' },
        message: 'Success',
      });

      const mockFileReader = {
        readAsText: jest.fn(),
        onload: null,
        onerror: null,
        result: '<xml>test</xml>',
      };
      global.FileReader = jest.fn(() => mockFileReader);

      await user.upload(fileInput, mockFile);

      setTimeout(() => {
        mockFileReader.onload({ target: { result: '<xml>test</xml>' } });
      }, 0);

      await waitFor(() => {
        expect(screen.getByTitle('Download parsed data')).toBeInTheDocument();
      });

      const downloadButton = screen.getByTitle('Download parsed data');
      await user.click(downloadButton);

      expect(mockLink.click).toHaveBeenCalled();
      expect(global.URL.createObjectURL).toHaveBeenCalled();
    });

    it('should allow file details expansion', async () => {
      const user = userEvent.setup();
      renderWithTheme(<BMSFileUpload />);

      const fileInput = screen.getByLabelText('Upload BMS XML files');
      const mockFile = createMockFile('test.xml');

      bmsService.uploadBMSFile.mockResolvedValue({
        success: true,
        data: {
          documentInfo: { documentNumber: 'DOC-001' },
          claimInfo: { claimNumber: 'CLM-001' },
          vehicle: { year: 2020, make: 'Toyota', model: 'Camry', vin: '12345' },
          damage: { totalAmount: 1500, damageLines: [{}] },
        },
        message: 'Success',
      });

      const mockFileReader = {
        readAsText: jest.fn(),
        onload: null,
        onerror: null,
        result: '<xml>test</xml>',
      };
      global.FileReader = jest.fn(() => mockFileReader);

      await user.upload(fileInput, mockFile);

      setTimeout(() => {
        mockFileReader.onload({ target: { result: '<xml>test</xml>' } });
      }, 0);

      await waitFor(() => {
        const expandButton =
          screen.getByTitle(/Expand details/) ||
          screen.getByTitle(/Collapse details/);
        expect(expandButton).toBeInTheDocument();
      });

      const expandButton =
        screen.getByTitle(/Expand details/) ||
        screen.getByTitle(/Collapse details/);
      await user.click(expandButton);

      await waitFor(() => {
        expect(screen.getByText('Parsed Data Preview')).toBeInTheDocument();
      });
    });
  });

  describe('Callback Functions', () => {
    it('should call onUploadComplete callback on successful upload', async () => {
      const user = userEvent.setup();
      renderWithTheme(
        <BMSFileUpload onUploadComplete={mockOnUploadComplete} />
      );

      const fileInput = screen.getByLabelText('Upload BMS XML files');
      const mockFile = createMockFile();
      const mockData = { customer: {}, vehicle: {}, job: {} };

      bmsService.uploadBMSFile.mockResolvedValue({
        success: true,
        data: mockData,
        message: 'Success',
      });

      const mockFileReader = {
        readAsText: jest.fn(),
        onload: null,
        onerror: null,
        result: '<xml>test</xml>',
      };
      global.FileReader = jest.fn(() => mockFileReader);

      await user.upload(fileInput, mockFile);

      setTimeout(() => {
        mockFileReader.onload({ target: { result: '<xml>test</xml>' } });
      }, 0);

      await waitFor(() => {
        expect(mockOnUploadComplete).toHaveBeenCalledWith(mockData, mockFile);
      });
    });

    it('should call onError callback on upload failure', async () => {
      const user = userEvent.setup();
      renderWithTheme(<BMSFileUpload onError={mockOnError} />);

      const fileInput = screen.getByLabelText('Upload BMS XML files');
      const mockFile = createMockFile();

      bmsService.uploadBMSFile.mockResolvedValue({
        success: false,
        error: 'Test error',
        message: 'Upload failed',
      });

      const mockFileReader = {
        readAsText: jest.fn(),
        onload: null,
        onerror: null,
        result: '<xml>test</xml>',
      };
      global.FileReader = jest.fn(() => mockFileReader);

      await user.upload(fileInput, mockFile);

      setTimeout(() => {
        mockFileReader.onload({ target: { result: '<xml>test</xml>' } });
      }, 0);

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith('Test error', mockFile);
      });
    });
  });
});
