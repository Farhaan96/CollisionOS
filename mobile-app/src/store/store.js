import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { combineReducers } from '@reduxjs/toolkit';

import { api } from './api/apiSlice';
import authSlice from './slices/authSlice';
import jobsSlice from './slices/jobsSlice';
import partsSlice from './slices/partsSlice';
import syncSlice from './slices/syncSlice';
import notificationSlice from './slices/notificationSlice';

const persistConfig = {
  key: 'root',
  version: 1,
  storage: AsyncStorage,
  // Don't persist API cache to avoid stale data
  blacklist: ['api'],
  // Persist critical app state
  whitelist: ['auth', 'jobs', 'parts', 'sync', 'notifications']
};

const rootReducer = combineReducers({
  api: api.reducer,
  auth: authSlice,
  jobs: jobsSlice,
  parts: partsSlice,
  sync: syncSlice,
  notifications: notificationSlice,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(api.middleware),
  devTools: __DEV__,
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;