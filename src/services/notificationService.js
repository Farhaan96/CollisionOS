import toast from 'react-hot-toast';
export const notificationService = {
  showNotification(n) {
    toast(n?.message || 'Notification');
  }
};
