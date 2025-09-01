import { create } from 'zustand';

export const useAppStore = create(set => ({
  notifications: [],
  addNotification: n =>
    set(s => ({ notifications: [n, ...s.notifications].slice(0, 100) })),
  removeNotification: id =>
    set(s => ({ notifications: s.notifications.filter(n => n.id !== id) })),
  setNotifications: list => set(() => ({ notifications: list || [] })),
}));
