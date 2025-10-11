import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';

class NotificationService {
  async initialize() {
    if (!Device.isDevice) {
      console.warn('Push notifications only work on physical devices');
      return;
    }

    // Get existing token
    const existingToken = await AsyncStorage.getItem('pushToken');
    if (existingToken) {
      console.log('Existing push token:', existingToken);
      return existingToken;
    }

    // Register for push notifications
    const token = await this.registerForPushNotifications();
    if (token) {
      await AsyncStorage.setItem('pushToken', token);
      // Send token to backend
      // await api.post('/notifications/register-device', { token });
    }

    return token;
  }

  async registerForPushNotifications() {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Failed to get push token for notifications');
        return null;
      }

      const token = (await Notifications.getExpoPushTokenAsync()).data;
      console.log('Push notification token:', token);
      return token;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  }

  async sendLocalNotification(title, body, data = {}) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: null, // Send immediately
    });
  }

  async scheduleNotification(title, body, trigger, data = {}) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger,
    });
  }

  async cancelAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }
}

export default new NotificationService();
