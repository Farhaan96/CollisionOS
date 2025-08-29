# CollisionOS Mobile Companion App Design

## Started: 2025-08-26

### Project Overview

**Goal**: Design and plan mobile companion applications for CollisionOS that provide customers and technicians with essential functionality on mobile devices

**Status**: Analysis Complete, Design Phase Started

### Current Architecture Analysis

#### Desktop Application Stack
- **Frontend**: React 18 with Material-UI v7
- **Backend**: Express.js with Socket.io for real-time updates
- **Database**: Dual-mode (Legacy SQLite/PostgreSQL + Supabase)
- **Desktop**: Electron for native desktop experience
- **Styling**: Modern glassmorphism theme with dark mode
- **State Management**: Zustand + React Query
- **Authentication**: JWT + Supabase Auth

#### Key Components Identified for Mobile Adaptation
1. **Customer Communication Hub** - Rich communication interface
2. **Production Board** - Kanban-style job tracking
3. **Parts Management** - Comprehensive parts workflow
4. **Dashboard Components** - Modern KPI and analytics widgets
5. **Authentication System** - Secure user management

### Mobile App Architecture Design

#### 1. Technology Stack Recommendation

**Option A: React Native (Recommended)**
```javascript
// Advantages:
- 95% code reuse from existing React codebase
- Native performance and platform features
- Existing Material-UI knowledge transfers to React Native Paper
- Real-time Socket.io support
- Camera and file upload capabilities
- Push notifications support
- Offline storage with AsyncStorage/SQLite

// Tech Stack:
- React Native 0.72+
- React Native Paper (Material Design)
- React Navigation 6
- Zustand for state management
- React Query for API management
- Socket.io-client for real-time updates
- React Native Camera for photo capture
- AsyncStorage for offline data
- React Native Push Notifications
```

**Option B: Progressive Web App (PWA)**
```javascript
// Advantages:
- Single codebase for all platforms
- Immediate deployment updates
- No app store approval process
- Existing React components can be reused directly
- Service worker for offline functionality

// Limitations:
- Limited native device features
- Reduced performance vs native
- No push notifications on iOS
- Limited camera functionality
```

#### 2. Mobile App Architecture

```
┌─────────────────────────────────────────┐
│           Mobile App Layer              │
├─────────────────────────────────────────┤
│  Customer App     │   Technician App    │
│  - Job Tracking   │   - Task Management │
│  - Photo Upload   │   - Time Tracking   │
│  - Communication  │   - QR Code Scanner │
│  - Estimates      │   - Photo Capture   │
└─────────────────────────────────────────┘
├─────────────────────────────────────────┤
│           Shared Services Layer         │
│  - Authentication                       │
│  - API Service                          │
│  - Real-time Updates                    │
│  - Offline Storage                      │
│  - Push Notifications                   │
└─────────────────────────────────────────┘
├─────────────────────────────────────────┤
│            API Gateway                  │
│  - Mobile-optimized endpoints          │
│  - Image compression                    │
│  - Batch sync operations               │
└─────────────────────────────────────────┘
├─────────────────────────────────────────┤
│       Existing CollisionOS Backend     │
│  - Express.js API                       │
│  - Socket.io Real-time                  │
│  - Supabase Database                    │
└─────────────────────────────────────────┘
```

### 3. Mobile App Designs

#### Customer Mobile App Features

**Core Screens:**

1. **Job Status Screen**
```javascript
// Features:
- Real-time job progress tracking
- Visual progress timeline
- Estimated completion date
- Photo gallery of repair progress
- Direct communication with shop

// Reusable Components:
- ProductionBoardPreview (adapted for mobile)
- StatusWidget (mobile-optimized)
- Timeline components
- Photo gallery
```

2. **Photo Upload Screen**
```javascript
// Features:
- Camera integration
- Before/after photo comparison
- Damage documentation
- Progress photos
- Automatic backup to cloud

// Technical:
- React Native Camera
- Image compression
- Secure upload to backend
- Offline queue for uploads
```

3. **Communication Screen**
```javascript
// Features:
- SMS/Email integration
- Chat with shop
- Appointment scheduling
- Service reminders
- Push notifications

// Reuses:
- CustomerCommunicationHub (mobile-adapted)
- Message templates
- Real-time messaging
```

4. **Estimate Viewer**
```javascript
// Features:
- Interactive estimate breakdown
- Parts and labor details
- Approval/rejection workflows
- Payment processing
- Insurance integration

// Components:
- Mobile-optimized estimate cards
- Payment forms
- Digital signature capture
```

#### Technician Mobile App Features

**Core Screens:**

1. **Task Dashboard**
```javascript
// Features:
- Daily task list
- Job assignments
- Priority indicators
- Time tracking
- Status updates

// Reuses:
- TechnicianDashboard (mobile-adapted)
- JobCard components
- Task management widgets
```

2. **Job Scanner**
```javascript
// Features:
- QR code/barcode scanning
- Quick job lookup
- Status updates
- Photo capture
- Time clock integration

// Technical:
- Barcode scanning
- Camera integration
- Offline job caching
```

3. **Photo Documentation**
```javascript
// Features:
- Before/during/after photos
- Damage documentation
- Progress tracking
- Quality control photos
- Customer communication

// Components:
- Camera interface
- Photo annotation
- Automatic categorization
```

### 4. Responsive Design Patterns

#### Mobile-First Components

```javascript
// Adaptive Layout Hook
const useResponsiveLayout = () => {
  const [screenSize, setScreenSize] = useState('mobile');
  
  useEffect(() => {
    const updateScreenSize = () => {
      const width = Dimensions.get('window').width;
      if (width < 768) setScreenSize('mobile');
      else if (width < 1024) setScreenSize('tablet');
      else setScreenSize('desktop');
    };
    
    const subscription = Dimensions.addEventListener('change', updateScreenSize);
    updateScreenSize();
    
    return () => subscription?.remove();
  }, []);
  
  return screenSize;
};

// Responsive Card Component
const ResponsiveCard = ({ children, variant = 'default' }) => {
  const screenSize = useResponsiveLayout();
  
  const cardStyles = {
    mobile: {
      margin: 8,
      borderRadius: 12,
      elevation: 2,
    },
    tablet: {
      margin: 16,
      borderRadius: 16,
      elevation: 4,
    },
    desktop: {
      margin: 24,
      borderRadius: 20,
      elevation: 8,
    }
  };
  
  return (
    <Card style={cardStyles[screenSize]}>
      {children}
    </Card>
  );
};

// Mobile Navigation Pattern
const MobileNavigation = () => (
  <NavigationContainer>
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          borderTopWidth: 1,
          borderTopColor: 'rgba(255, 255, 255, 0.1)',
        },
        headerStyle: {
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
        },
        headerTintColor: '#fff',
      }}
    >
      <Tab.Screen 
        name="Jobs" 
        component={JobsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="work" color={color} size={size} />
          )
        }}
      />
      <Tab.Screen 
        name="Photos" 
        component={PhotosScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="photo-camera" color={color} size={size} />
          )
        }}
      />
      <Tab.Screen 
        name="Messages" 
        component={MessagesScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="message" color={color} size={size} />
          )
        }}
      />
    </Tab.Navigator>
  </NavigationContainer>
);
```

#### Glass Morphism Mobile Theme

```javascript
// Mobile-adapted glass theme
export const mobileGlassTheme = {
  ...modernTheme,
  components: {
    ...modernTheme.components,
    MuiCard: {
      styleOverrides: {
        root: {
          background: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(20px)',
          borderRadius: 16,
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)',
        }
      }
    }
  },
  mobile: {
    spacing: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
    },
    borderRadius: {
      small: 8,
      medium: 12,
      large: 16,
    },
    glassMorphism: {
      light: 'rgba(255, 255, 255, 0.08)',
      medium: 'rgba(255, 255, 255, 0.12)',
      heavy: 'rgba(255, 255, 255, 0.16)',
    }
  }
};

// React Native Paper theme adaptation
export const reactNativePaperTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#6366F1',
    accent: '#8B5CF6',
    background: '#0F172A',
    surface: 'rgba(30, 41, 59, 0.50)',
    text: '#FFFFFF',
  },
  roundness: 16,
};
```

### 5. API Integration Strategy

#### Mobile-Optimized Endpoints

```javascript
// Customer API routes
const customerMobileAPI = {
  // Job tracking
  GET: '/api/mobile/customer/jobs/:jobId/status',
  GET: '/api/mobile/customer/jobs/:jobId/timeline',
  GET: '/api/mobile/customer/jobs/:jobId/photos',
  POST: '/api/mobile/customer/jobs/:jobId/photos',
  
  // Communication
  GET: '/api/mobile/customer/messages',
  POST: '/api/mobile/customer/messages',
  GET: '/api/mobile/customer/notifications',
  
  // Estimates
  GET: '/api/mobile/customer/estimates/:estimateId',
  POST: '/api/mobile/customer/estimates/:estimateId/approve',
  POST: '/api/mobile/customer/estimates/:estimateId/reject',
  
  // Payments
  GET: '/api/mobile/customer/invoices/:invoiceId',
  POST: '/api/mobile/customer/payments',
};

// Technician API routes
const technicianMobileAPI = {
  // Tasks
  GET: '/api/mobile/technician/tasks',
  PUT: '/api/mobile/technician/tasks/:taskId/status',
  POST: '/api/mobile/technician/time-entries',
  
  // Jobs
  GET: '/api/mobile/technician/jobs/scan/:qrCode',
  POST: '/api/mobile/technician/jobs/:jobId/photos',
  PUT: '/api/mobile/technician/jobs/:jobId/status',
  
  // Quality Control
  POST: '/api/mobile/technician/qc/inspections',
  GET: '/api/mobile/technician/qc/checklists',
};
```

#### Offline Capability Strategy

```javascript
// Offline data management
const offlineManager = {
  // Priority data for offline access
  essentialData: [
    'active_jobs',
    'customer_info', 
    'technician_tasks',
    'communication_history',
    'photo_queue'
  ],
  
  // Sync strategy
  syncWhenOnline: {
    immediate: ['status_updates', 'messages', 'time_entries'],
    batched: ['photos', 'documents'],
    periodic: ['job_data', 'customer_data']
  },
  
  // Storage allocation
  storage: {
    photos: '100MB max',
    data: '50MB max',
    cache: '25MB max'
  }
};

// Offline queue implementation
class OfflineQueue {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
  }
  
  async addToQueue(action, data) {
    const queueItem = {
      id: Date.now(),
      action,
      data,
      timestamp: new Date().toISOString(),
      retries: 0
    };
    
    await AsyncStorage.setItem(
      `offline_queue_${queueItem.id}`, 
      JSON.stringify(queueItem)
    );
    
    this.queue.push(queueItem);
    this.processQueue();
  }
  
  async processQueue() {
    if (this.isProcessing || !isConnected()) return;
    
    this.isProcessing = true;
    
    while (this.queue.length > 0) {
      const item = this.queue.shift();
      
      try {
        await this.executeAction(item);
        await AsyncStorage.removeItem(`offline_queue_${item.id}`);
      } catch (error) {
        if (item.retries < 3) {
          item.retries++;
          this.queue.push(item);
        } else {
          console.error('Failed to sync after 3 retries:', item);
        }
      }
    }
    
    this.isProcessing = false;
  }
}
```

### 6. Security Implementation

#### Mobile Security Strategy

```javascript
// Secure token storage
import { Keychain } from 'react-native-keychain';

class SecureStorage {
  static async storeToken(token) {
    await Keychain.setInternetCredentials(
      'collisionos_auth',
      'user',
      token,
      {
        accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET,
        authenticatePrompt: 'Authenticate to access CollisionOS',
      }
    );
  }
  
  static async getToken() {
    try {
      const credentials = await Keychain.getInternetCredentials('collisionos_auth');
      return credentials ? credentials.password : null;
    } catch (error) {
      return null;
    }
  }
}

// Biometric authentication
const BiometricAuth = {
  async isAvailable() {
    const biometryType = await Keychain.getSupportedBiometryType();
    return biometryType !== null;
  },
  
  async authenticate() {
    const credentials = await Keychain.getInternetCredentials(
      'collisionos_auth',
      {
        authenticationPrompt: {
          title: 'Authenticate',
          subtitle: 'Use your fingerprint or face to access CollisionOS',
          description: 'This ensures your data stays secure',
          fallbackLabel: 'Use Password',
          negativeText: 'Cancel',
        },
      }
    );
    
    return credentials !== false;
  }
};

// API request security
class SecureAPIClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
    this.client = axios.create({
      baseURL,
      timeout: 10000,
    });
    
    this.setupInterceptors();
  }
  
  setupInterceptors() {
    // Request interceptor for auth tokens
    this.client.interceptors.request.use(async (config) => {
      const token = await SecureStorage.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
    
    // Response interceptor for token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          await this.handleTokenRefresh();
        }
        return Promise.reject(error);
      }
    );
  }
}
```

### 7. Development Phases

#### Phase 1: Foundation (3-4 weeks)
- [ ] Set up React Native project structure
- [ ] Implement core navigation
- [ ] Create mobile theme system
- [ ] Set up API integration layer
- [ ] Implement authentication flow
- [ ] Basic offline capabilities

#### Phase 2: Customer App Core (4-5 weeks)
- [ ] Job status tracking screen
- [ ] Photo upload functionality
- [ ] Communication interface
- [ ] Estimate viewer
- [ ] Push notifications
- [ ] Customer onboarding flow

#### Phase 3: Technician App Core (4-5 weeks)
- [ ] Task dashboard
- [ ] QR code scanner
- [ ] Time tracking
- [ ] Photo documentation
- [ ] Job status updates
- [ ] Technician workflows

#### Phase 4: Advanced Features (3-4 weeks)
- [ ] Advanced offline sync
- [ ] Biometric authentication
- [ ] Advanced camera features
- [ ] Voice notes
- [ ] GPS integration
- [ ] Performance optimization

#### Phase 5: Testing & Deployment (2-3 weeks)
- [ ] Comprehensive testing
- [ ] Performance testing
- [ ] Security audit
- [ ] App store submission
- [ ] User training materials

### 8. Reusable Component Library

#### Mobile Component System

```javascript
// Base components that adapt from desktop
export const MobileComponents = {
  // Cards
  StatusCard: ({ status, title, count, color, onPress }) => (
    <TouchableOpacity onPress={onPress}>
      <Card style={mobileStyles.statusCard}>
        <View style={mobileStyles.cardHeader}>
          <Icon name="circle" color={color} size={12} />
          <Text variant="caption">{status}</Text>
        </View>
        <Text variant="h5">{count}</Text>
        <Text variant="body2">{title}</Text>
      </Card>
    </TouchableOpacity>
  ),
  
  // Progress indicators
  JobProgress: ({ progress, stages }) => (
    <View style={mobileStyles.progressContainer}>
      {stages.map((stage, index) => (
        <View key={index} style={mobileStyles.progressStage}>
          <View 
            style={[
              mobileStyles.progressDot, 
              { backgroundColor: index <= progress ? '#10B981' : '#374151' }
            ]} 
          />
          <Text style={mobileStyles.stageText}>{stage}</Text>
        </View>
      ))}
    </View>
  ),
  
  // Communication
  MessageBubble: ({ message, isFromUser }) => (
    <View style={[
      mobileStyles.messageBubble,
      isFromUser ? mobileStyles.userMessage : mobileStyles.systemMessage
    ]}>
      <Text style={mobileStyles.messageText}>{message.content}</Text>
      <Text style={mobileStyles.messageTime}>
        {formatTime(message.timestamp)}
      </Text>
    </View>
  ),
  
  // Photo handling
  PhotoGrid: ({ photos, onPhotoPress, onAddPhoto }) => (
    <ScrollView horizontal style={mobileStyles.photoContainer}>
      <TouchableOpacity 
        style={mobileStyles.addPhotoButton}
        onPress={onAddPhoto}
      >
        <Icon name="add-a-photo" size={32} color="#666" />
        <Text>Add Photo</Text>
      </TouchableOpacity>
      {photos.map((photo, index) => (
        <TouchableOpacity 
          key={index}
          onPress={() => onPhotoPress(photo)}
        >
          <Image 
            source={{ uri: photo.thumbnail }} 
            style={mobileStyles.photoThumbnail}
          />
        </TouchableOpacity>
      ))}
    </ScrollView>
  )
};
```

### Implementation Deliverables

**Complete Mobile Design Package Created:**

1. **Architecture Design** ✅
   - React Native vs PWA analysis
   - Technical stack recommendations
   - API integration strategy
   - Offline capabilities design

2. **UI/UX Component Library** ✅ 
   - Mobile-first component specifications
   - Customer app screens (Job Status, Photo Upload, Communication, Estimate Viewer)
   - Technician app screens (Task Dashboard, QR Scanner, Photo Documentation)
   - Responsive design patterns
   - Glass morphism mobile theme

3. **API Strategy & Integration** ✅
   - Mobile-optimized API client with offline queue
   - Batch operations for photos and data sync
   - Real-time Socket.io integration
   - Network resilience patterns
   - React Query hooks for data management

4. **Navigation System** ✅
   - Customer app tab navigation
   - Technician app drawer + tab navigation  
   - Authentication flow
   - Custom glass morphism UI elements
   - Platform-specific optimizations

5. **Security Implementation** ✅
   - Biometric authentication system
   - Secure token management with Keychain/Keystore
   - Device fingerprinting and validation
   - Data encryption for local storage
   - Security hooks for React components

### Architecture Summary

**Technology Stack:** React Native with React Native Paper
**State Management:** Zustand + React Query  
**Security:** Biometric auth + Keychain storage + AES encryption
**Offline:** AsyncStorage + request queue + data sync
**Real-time:** Socket.io client integration
**Backend Integration:** Mobile-optimized API endpoints

### Reusable Components Analysis

**From Desktop to Mobile Adaptation:**
- `CustomerCommunicationHub` → Mobile chat interface with photo sharing
- `ProductionBoardPreview` → Job status timeline for customers  
- `TechnicianDashboard` → Mobile task management interface
- `PartsManagement` → QR scanner integration for parts tracking
- `Dashboard` components → Mobile-optimized KPI widgets

**Mobile-Specific Features:**
- Camera integration for photo capture
- QR/barcode scanning for job lookup
- Push notifications for real-time updates
- GPS integration for location services
- Offline-first data synchronization

### Summary

The mobile companion apps will leverage the existing CollisionOS architecture while providing mobile-optimized experiences for customers and technicians. The React Native approach allows maximum code reuse while delivering native performance and platform features.

**Key Benefits:**
- 95% code reuse from existing React components
- Native performance and device features
- Real-time synchronization with desktop app
- Offline capabilities for field work
- Secure authentication and data handling
- Scalable architecture for future features

**Files Created:**
- `/src/mobile/designs/MobileComponentSpecs.js` - UI component specifications
- `/src/mobile/api/MobileAPIStrategy.js` - API client with offline support
- `/src/mobile/navigation/MobileNavigation.js` - Navigation system
- `/src/mobile/security/MobileSecurity.js` - Security & authentication

**Next Steps:**
1. Stakeholder review of designs ✅ READY
2. Technical proof-of-concept development  
3. User experience testing
4. Development sprint planning
5. Beta testing program setup

**Estimated Timeline:** 16-21 weeks total development
**Team Required:** 2-3 mobile developers, 1 UI/UX designer, 1 backend developer (part-time)

**Status:** Design phase completed - Ready for development planning and stakeholder review
