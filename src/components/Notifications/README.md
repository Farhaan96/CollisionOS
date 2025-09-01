# CollisionOS Notification System

Premium notification and toast system with executive-level design and sophisticated features.

## Features

### 🎯 Core Features

- **Global Notification Context** - Centralized notification management
- **Queue Management** - Priority-based notification queuing with max limits
- **Priority System** - Critical, High, Normal, Low priority levels
- **Persistence Options** - Session/local storage for history and settings
- **Do Not Disturb Mode** - Temporarily disable notifications with exceptions
- **Sound & Vibration** - Audio and haptic feedback support

### 🎨 Premium Design

- **Glassmorphism Effects** - Modern backdrop blur and transparency
- **Executive-Level Styling** - Professional design suitable for C-suite
- **Premium Animations** - Smooth transitions with Framer Motion
- **Responsive Design** - Works on all device sizes
- **Multiple Positions** - Top/bottom, left/right/center positioning

### 🚀 Advanced Functionality

- **Swipe to Dismiss** - Mobile-friendly gesture support
- **Progress Bars** - Visual countdown for timed notifications
- **Action Buttons** - Custom actions with notifications
- **Stacking Behavior** - Smart notification layering
- **Keyboard Shortcuts** - ESC to cancel, Cmd+Enter to confirm
- **Focus Trapping** - Accessibility-compliant focus management

## Components

### NotificationProvider

The global context provider that manages all notification state.

```jsx
import { NotificationProvider } from './components/Notifications';

function App() {
  return (
    <NotificationProvider position='top-right' maxNotifications={5}>
      <YourApp />
    </NotificationProvider>
  );
}
```

### Toast

Individual notification component with animations and interactions.

```jsx
import { Toast } from './components/Notifications';

<Toast
  notification={{
    id: 'unique-id',
    type: 'success',
    title: 'Success!',
    message: 'Operation completed successfully',
    actions: [
      { label: 'View Details', handler: () => {} },
      { label: 'Dismiss', handler: () => {} },
    ],
  }}
  onDismiss={handleDismiss}
  position='top-right'
/>;
```

### NotificationCenter

Dropdown panel for viewing and managing all notifications.

```jsx
import { NotificationCenter } from './components/Notifications';

<NotificationCenter
  anchorEl={anchorElement}
  open={isOpen}
  onClose={handleClose}
  showSettings={true}
/>;
```

### AlertDialog

Modal dialogs for critical confirmations.

```jsx
import { AlertDialog, DIALOG_TYPES } from './components/Notifications';

<AlertDialog
  open={isOpen}
  type={DIALOG_TYPES.DESTRUCTIVE}
  title='Delete Item'
  message='This action cannot be undone.'
  onConfirm={handleDelete}
  onCancel={handleCancel}
/>;
```

## Hooks

### useNotification

Enhanced hook with promise-based API and chainable methods.

```jsx
import { useNotification } from './hooks/useNotification';

function MyComponent() {
  const notification = useNotification();

  // Simple notifications
  const showSuccess = () => {
    notification.success('Operation completed!');
  };

  // Promise-based
  const showAsync = async () => {
    try {
      await notification.show({
        title: 'Loading...',
        message: 'Please wait...',
        actions: [{ label: 'Cancel', handler: () => {} }],
      });
    } catch (error) {
      notification.error('Something went wrong');
    }
  };

  // Chainable API
  const showChained = () => {
    notification
      .create()
      .title('Custom Notification')
      .message('This is a custom message')
      .type('info')
      .priority('high')
      .duration(5000)
      .actions([{ label: 'Action 1', handler: () => {} }])
      .show();
  };

  // Async operations wrapper
  const handleAsyncOperation = async () => {
    await notification.withNotification(
      async () => {
        // Your async operation
        return await someAsyncOperation();
      },
      {
        loadingMessage: 'Processing...',
        successMessage: 'Complete!',
        errorMessage: 'Failed!',
      }
    );
  };

  // Loading with progress updates
  const handleWithProgress = async () => {
    const loading = notification.loading('Uploading file...');

    try {
      // Update progress
      loading.updateProgress(50, 'Halfway there...');

      // Complete
      loading.complete('Upload successful!');
    } catch (error) {
      loading.fail('Upload failed');
    }
  };
}
```

## Notification Types

- `success` - Green with checkmark icon
- `error` - Red with error icon
- `warning` - Yellow/orange with warning icon
- `info` - Blue with info icon
- `custom` - Customizable appearance

## Priority Levels

- `critical` - Highest priority, bypasses Do Not Disturb
- `high` - Important notifications
- `normal` - Standard notifications
- `low` - Low priority, subtle appearance

## Configuration Options

### Provider Props

```jsx
<NotificationProvider
  position="top-right" // top-right, top-left, bottom-right, etc.
  maxNotifications={5} // Maximum visible notifications
  customToastContainer={<CustomContainer />} // Custom container
>
```

### Notification Options

```jsx
const notification = {
  id: 'unique-id', // Auto-generated if not provided
  type: 'success', // success, error, warning, info, custom
  title: 'Title',
  message: 'Message',
  priority: 'normal', // critical, high, normal, low
  duration: 5000, // Auto-dismiss time in ms (0 = never)
  persistent: false, // Don't auto-dismiss
  showProgress: true, // Show countdown progress bar
  allowDismiss: true, // Show dismiss button
  actions: [], // Action buttons
  customIcon: <Icon />, // Custom icon
  avatar: 'url', // Avatar image URL
  count: 1, // Notification count badge
  data: {}, // Custom data
  onClick: () => {}, // Click handler
  onDismiss: () => {}, // Dismiss handler
};
```

## Keyboard Shortcuts

- `ESC` - Dismiss notification/dialog
- `Cmd/Ctrl + Enter` - Confirm action (in dialogs)
- `Tab/Shift+Tab` - Navigate between actions

## Accessibility Features

- ARIA live regions for screen readers
- Focus trapping in modals
- Keyboard navigation support
- High contrast support
- Reduced motion preferences
- Screen reader optimized content

## Styling

The notification system uses the premium design system tokens:

- `premiumColors` - Color palette
- `premiumShadows` - Shadow effects
- `premiumBorderRadius` - Border radius values
- `premiumEffects` - Backdrop filters and effects
- `advancedSpringConfigs` - Animation configurations

## Performance

- Efficient rendering with React.memo
- Animation optimizations with transform3d
- Automatic cleanup of dismissed notifications
- Lazy loading of notification history
- Debounced updates for high-frequency notifications

## Browser Support

- Chrome 88+
- Firefox 78+
- Safari 14+
- Edge 88+

Features gracefully degrade in older browsers:

- Backdrop blur falls back to solid background
- Animations fall back to simple transitions
- Vibration/sound features fail silently if unsupported
