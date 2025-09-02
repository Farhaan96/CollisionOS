import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { Provider as PaperProvider } from 'react-native-paper';
import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';

import { store, persistor } from './src/store/store';
import RootNavigator from './src/navigation/RootNavigator';
import { theme } from './src/constants/theme';
import LoadingScreen from './src/screens/LoadingScreen';
import { NotificationService } from './src/services/NotificationService';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  useEffect(() => {
    // Initialize app services
    const initializeApp = async () => {
      try {
        // Request permissions
        await requestPermissions();
        
        // Initialize notification service
        await NotificationService.initialize();
        
        console.log('CollisionOS Mobile initialized successfully');
      } catch (error) {
        console.error('Failed to initialize app:', error);
      }
    };

    initializeApp();
  }, []);

  const requestPermissions = async () => {
    // Request notification permissions
    const { status: notificationStatus } = await Notifications.requestPermissionsAsync();
    if (notificationStatus !== 'granted') {
      console.warn('Notification permissions not granted');
    }

    // Request location permissions
    const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
    if (locationStatus !== 'granted') {
      console.warn('Location permissions not granted');
    }
  };

  return (
    <Provider store={store}>
      <PersistGate loading={<LoadingScreen />} persistor={persistor}>
        <PaperProvider theme={theme}>
          <NavigationContainer>
            <StatusBar style="auto" />
            <RootNavigator />
          </NavigationContainer>
        </PaperProvider>
      </PersistGate>
    </Provider>
  );
}