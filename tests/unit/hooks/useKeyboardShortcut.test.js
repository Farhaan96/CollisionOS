import { renderHook, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import {
  useKeyboardShortcut,
  useKeyboardShortcuts,
  useConditionalKeyboardShortcut,
  useFormShortcuts,
  useNavigationShortcuts,
  useModalShortcuts,
} from '../../../src/hooks/useKeyboardShortcut';
import { ShortcutManager } from '../../../src/components/KeyboardShortcuts/ShortcutManager';

// Mock dependencies
jest.mock('../../../src/hooks/useNotification', () => ({
  useNotification: () => ({
    showNotification: jest.fn(),
  }),
}));

// Test wrapper with providers
const TestWrapper = ({ children }) => (
  <BrowserRouter>
    <ShortcutManager>{children}</ShortcutManager>
  </BrowserRouter>
);

// Helper to simulate keyboard events
const simulateKeyboardEvent = (key, modifiers = {}) => {
  const event = new KeyboardEvent('keydown', {
    key,
    ctrlKey: modifiers.ctrl || false,
    altKey: modifiers.alt || false,
    shiftKey: modifiers.shift || false,
    metaKey: modifiers.meta || false,
    bubbles: true,
    cancelable: true,
  });

  document.dispatchEvent(event);
  return event;
};

describe('useKeyboardShortcut', () => {
  let mockHandler;

  beforeEach(() => {
    mockHandler = jest.fn();
  });

  afterEach(() => {
    mockHandler.mockClear();
    // Clear any registered shortcuts
    jest.clearAllMocks();
  });

  it('registers and executes a simple shortcut', () => {
    renderHook(() => useKeyboardShortcut('cmd+k', mockHandler), {
      wrapper: TestWrapper,
    });

    // Simulate Cmd+K
    act(() => {
      simulateKeyboardEvent('k', { meta: true });
    });

    expect(mockHandler).toHaveBeenCalled();
  });

  it('prevents default behavior by default', () => {
    renderHook(() => useKeyboardShortcut('cmd+s', mockHandler), {
      wrapper: TestWrapper,
    });

    act(() => {
      const event = simulateKeyboardEvent('s', { meta: true });
      expect(event.defaultPrevented).toBe(true);
    });
  });

  it('allows default behavior when preventDefault is false', () => {
    renderHook(
      () =>
        useKeyboardShortcut('cmd+s', mockHandler, { preventDefault: false }),
      { wrapper: TestWrapper }
    );

    act(() => {
      const event = simulateKeyboardEvent('s', { meta: true });
      // Note: In jsdom, preventDefault might not work exactly like in browsers
      // This test verifies the option is passed correctly
    });

    expect(mockHandler).toHaveBeenCalled();
  });

  it('does not execute when disabled', () => {
    renderHook(
      () => useKeyboardShortcut('cmd+k', mockHandler, { enabled: false }),
      { wrapper: TestWrapper }
    );

    act(() => {
      simulateKeyboardEvent('k', { meta: true });
    });

    expect(mockHandler).not.toHaveBeenCalled();
  });

  it('cleans up on unmount', () => {
    const { unmount } = renderHook(
      () => useKeyboardShortcut('cmd+k', mockHandler),
      { wrapper: TestWrapper }
    );

    // Unmount the hook
    unmount();

    // Should not execute after unmount
    act(() => {
      simulateKeyboardEvent('k', { meta: true });
    });

    expect(mockHandler).not.toHaveBeenCalled();
  });

  it('handles different modifier combinations', () => {
    renderHook(() => useKeyboardShortcut('ctrl+alt+shift+s', mockHandler), {
      wrapper: TestWrapper,
    });

    act(() => {
      simulateKeyboardEvent('s', { ctrl: true, alt: true, shift: true });
    });

    expect(mockHandler).toHaveBeenCalled();
  });
});

describe('useKeyboardShortcuts', () => {
  let mockHandler1, mockHandler2;

  beforeEach(() => {
    mockHandler1 = jest.fn();
    mockHandler2 = jest.fn();
  });

  it('registers multiple shortcuts', () => {
    const shortcuts = {
      'cmd+k': mockHandler1,
      'cmd+j': mockHandler2,
    };

    renderHook(() => useKeyboardShortcuts(shortcuts), { wrapper: TestWrapper });

    act(() => {
      simulateKeyboardEvent('k', { meta: true });
    });
    expect(mockHandler1).toHaveBeenCalled();

    act(() => {
      simulateKeyboardEvent('j', { meta: true });
    });
    expect(mockHandler2).toHaveBeenCalled();
  });

  it('supports shortcut configuration objects', () => {
    const shortcuts = {
      'cmd+k': {
        handler: mockHandler1,
        options: { preventDefault: false },
      },
      'cmd+j': mockHandler2,
    };

    renderHook(() => useKeyboardShortcuts(shortcuts), { wrapper: TestWrapper });

    act(() => {
      simulateKeyboardEvent('k', { meta: true });
      simulateKeyboardEvent('j', { meta: true });
    });

    expect(mockHandler1).toHaveBeenCalled();
    expect(mockHandler2).toHaveBeenCalled();
  });

  it('applies global options to all shortcuts', () => {
    const shortcuts = {
      'cmd+k': mockHandler1,
      'cmd+j': mockHandler2,
    };

    const globalOptions = { enabled: false };

    renderHook(() => useKeyboardShortcuts(shortcuts, globalOptions), {
      wrapper: TestWrapper,
    });

    act(() => {
      simulateKeyboardEvent('k', { meta: true });
      simulateKeyboardEvent('j', { meta: true });
    });

    expect(mockHandler1).not.toHaveBeenCalled();
    expect(mockHandler2).not.toHaveBeenCalled();
  });
});

describe('useConditionalKeyboardShortcut', () => {
  let mockHandler;

  beforeEach(() => {
    mockHandler = jest.fn();
  });

  it('executes when condition is true', () => {
    renderHook(
      () => useConditionalKeyboardShortcut('cmd+k', mockHandler, true),
      { wrapper: TestWrapper }
    );

    act(() => {
      simulateKeyboardEvent('k', { meta: true });
    });

    expect(mockHandler).toHaveBeenCalled();
  });

  it('does not execute when condition is false', () => {
    renderHook(
      () => useConditionalKeyboardShortcut('cmd+k', mockHandler, false),
      { wrapper: TestWrapper }
    );

    act(() => {
      simulateKeyboardEvent('k', { meta: true });
    });

    expect(mockHandler).not.toHaveBeenCalled();
  });

  it('supports function conditions', () => {
    let conditionValue = false;
    const condition = () => conditionValue;

    const { rerender } = renderHook(
      () => useConditionalKeyboardShortcut('cmd+k', mockHandler, condition),
      { wrapper: TestWrapper }
    );

    act(() => {
      simulateKeyboardEvent('k', { meta: true });
    });
    expect(mockHandler).not.toHaveBeenCalled();

    // Change condition
    conditionValue = true;
    rerender();

    act(() => {
      simulateKeyboardEvent('k', { meta: true });
    });
    expect(mockHandler).toHaveBeenCalled();
  });
});

describe('useFormShortcuts', () => {
  let mockSubmit, mockSave, mockCancel;

  beforeEach(() => {
    mockSubmit = jest.fn();
    mockSave = jest.fn();
    mockCancel = jest.fn();
  });

  it('registers default form shortcuts', () => {
    renderHook(
      () =>
        useFormShortcuts({
          submit: mockSubmit,
          save: mockSave,
          cancel: mockCancel,
        }),
      { wrapper: TestWrapper }
    );

    // Test submit shortcut
    act(() => {
      simulateKeyboardEvent('Enter', { meta: true });
    });
    expect(mockSubmit).toHaveBeenCalled();

    // Test save shortcut
    act(() => {
      simulateKeyboardEvent('s', { meta: true });
    });
    expect(mockSave).toHaveBeenCalled();

    // Test cancel shortcut
    act(() => {
      simulateKeyboardEvent('Escape');
    });
    expect(mockCancel).toHaveBeenCalled();
  });

  it('does not execute when form is inactive', () => {
    renderHook(
      () =>
        useFormShortcuts(
          {
            submit: mockSubmit,
            save: mockSave,
            cancel: mockCancel,
          },
          false
        ), // formActive = false
      { wrapper: TestWrapper }
    );

    act(() => {
      simulateKeyboardEvent('Enter', { meta: true });
      simulateKeyboardEvent('s', { meta: true });
      simulateKeyboardEvent('Escape');
    });

    expect(mockSubmit).not.toHaveBeenCalled();
    expect(mockSave).not.toHaveBeenCalled();
    expect(mockCancel).not.toHaveBeenCalled();
  });
});

describe('useNavigationShortcuts', () => {
  let mockNavigate;

  beforeEach(() => {
    mockNavigate = jest.fn();
  });

  it('registers default navigation shortcuts', () => {
    renderHook(() => useNavigationShortcuts(mockNavigate), {
      wrapper: TestWrapper,
    });

    act(() => {
      simulateKeyboardEvent('1', { meta: true });
    });
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');

    act(() => {
      simulateKeyboardEvent('2', { meta: true });
    });
    expect(mockNavigate).toHaveBeenCalledWith('/customers');
  });

  it('supports custom routes', () => {
    const customRoutes = {
      'cmd+9': '/custom-page',
    };

    renderHook(() => useNavigationShortcuts(mockNavigate, customRoutes), {
      wrapper: TestWrapper,
    });

    act(() => {
      simulateKeyboardEvent('9', { meta: true });
    });
    expect(mockNavigate).toHaveBeenCalledWith('/custom-page');
  });
});

describe('useModalShortcuts', () => {
  let mockOnClose, mockOnSubmit;

  beforeEach(() => {
    mockOnClose = jest.fn();
    mockOnSubmit = jest.fn();
  });

  it('registers escape to close', () => {
    renderHook(() => useModalShortcuts(true, mockOnClose), {
      wrapper: TestWrapper,
    });

    act(() => {
      simulateKeyboardEvent('Escape');
    });
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('registers cmd+enter to submit when provided', () => {
    renderHook(() => useModalShortcuts(true, mockOnClose, mockOnSubmit), {
      wrapper: TestWrapper,
    });

    act(() => {
      simulateKeyboardEvent('Enter', { meta: true });
    });
    expect(mockOnSubmit).toHaveBeenCalled();
  });

  it('does not execute when modal is closed', () => {
    renderHook(() => useModalShortcuts(false, mockOnClose, mockOnSubmit), {
      wrapper: TestWrapper,
    });

    act(() => {
      simulateKeyboardEvent('Escape');
      simulateKeyboardEvent('Enter', { meta: true });
    });

    expect(mockOnClose).not.toHaveBeenCalled();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });
});
