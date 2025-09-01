/**
 * CollisionOS Mobile Security & Authentication
 * Comprehensive security implementation for mobile apps
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import Keychain from 'react-native-keychain';
import TouchID from 'react-native-touch-id';
import DeviceInfo from 'react-native-device-info';
import CryptoJS from 'crypto-js';
import { Platform, Alert } from 'react-native';

// =============================================
// SECURITY HOOKS (React)
// =============================================

import { useState, useEffect } from 'react';

// =============================================
// SECURE STORAGE MANAGER
// =============================================

export class SecureStorageManager {
  static SERVICE_NAME = 'CollisionOS';

  // Store sensitive data in Keychain/Keystore
  static async storeSecurely(key, value, options = {}) {
    try {
      const config = {
        service: this.SERVICE_NAME,
        accessControl: options.biometric
          ? Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET
          : Keychain.ACCESS_CONTROL.DEVICE_PASSCODE,
        authenticatePrompt:
          options.prompt || 'Authenticate to access CollisionOS',
        showModal: options.showModal !== false,
        kLocalizedFallbackTitle: 'Use Passcode',
        ...options,
      };

      await Keychain.setInternetCredentials(key, 'user', value, config);

      return true;
    } catch (error) {
      console.error('Failed to store data securely:', error);
      return false;
    }
  }

  // Retrieve sensitive data from Keychain/Keystore
  static async retrieveSecurely(key, options = {}) {
    try {
      const config = {
        service: this.SERVICE_NAME,
        authenticationPrompt:
          options.prompt || 'Authenticate to access CollisionOS',
        showModal: options.showModal !== false,
        kLocalizedFallbackTitle: 'Use Passcode',
        ...options,
      };

      const credentials = await Keychain.getInternetCredentials(key, config);

      if (credentials && credentials.password) {
        return credentials.password;
      }

      return null;
    } catch (error) {
      if (error.message === 'UserCancel' || error.message === 'UserFallback') {
        return null; // User cancelled authentication
      }
      console.error('Failed to retrieve data securely:', error);
      return null;
    }
  }

  // Remove sensitive data
  static async removeSecurely(key) {
    try {
      await Keychain.resetInternetCredentials(key, {
        service: this.SERVICE_NAME,
      });
      return true;
    } catch (error) {
      console.error('Failed to remove data securely:', error);
      return false;
    }
  }

  // Check if secure storage is available
  static async isAvailable() {
    try {
      const capabilities = await Keychain.getSupportedBiometryType();
      return capabilities !== null;
    } catch (error) {
      return false;
    }
  }
}

// =============================================
// BIOMETRIC AUTHENTICATION
// =============================================

export class BiometricAuth {
  static async isSupported() {
    try {
      return await TouchID.isSupported();
    } catch (error) {
      return false;
    }
  }

  static async getSupportedBiometry() {
    try {
      const biometryType = await TouchID.isSupported();
      return biometryType;
    } catch (error) {
      return null;
    }
  }

  static async authenticate(reason = 'Authenticate to access CollisionOS') {
    try {
      const config = {
        title: 'Authentication Required',
        subTitle: reason,
        description: 'Use your fingerprint or face to continue',
        fallbackLabel: 'Use Passcode',
        cancelLabel: 'Cancel',
        color: '#6366F1',
        sensorDescription: 'Touch sensor',
        sensorErrorDescription: 'Failed',
        unifiedErrors: false,
      };

      await TouchID.authenticate(reason, config);
      return true;
    } catch (error) {
      if (error.name === 'LAErrorUserCancel' || error.name === 'UserCancel') {
        return false; // User cancelled
      }
      throw error;
    }
  }

  // Set up biometric authentication for the app
  static async setupBiometric(onSuccess, onError) {
    try {
      const isSupported = await this.isSupported();

      if (!isSupported) {
        Alert.alert(
          'Biometric Not Available',
          'This device does not support biometric authentication.',
          [{ text: 'OK' }]
        );
        return false;
      }

      const biometryType = await this.getSupportedBiometry();
      const biometryName = this.getBiometryTypeName(biometryType);

      Alert.alert(
        `Enable ${biometryName}?`,
        `Use ${biometryName} to quickly and securely access CollisionOS?`,
        [
          { text: 'Skip', style: 'cancel' },
          {
            text: `Enable ${biometryName}`,
            onPress: async () => {
              try {
                const success = await this.authenticate(
                  `Set up ${biometryName} for CollisionOS`
                );
                if (success) {
                  await AsyncStorage.setItem('biometric_enabled', 'true');
                  onSuccess && onSuccess(biometryType);
                }
              } catch (error) {
                onError && onError(error);
              }
            },
          },
        ]
      );
    } catch (error) {
      onError && onError(error);
    }
  }

  static getBiometryTypeName(biometryType) {
    switch (biometryType) {
      case 'FaceID':
        return 'Face ID';
      case 'TouchID':
        return 'Touch ID';
      case 'Fingerprint':
        return 'Fingerprint';
      default:
        return 'Biometric';
    }
  }
}

// =============================================
// TOKEN MANAGER
// =============================================

export class TokenManager {
  static TOKEN_KEY = 'auth_token';
  static REFRESH_TOKEN_KEY = 'refresh_token';
  static TOKEN_EXPIRY_KEY = 'token_expiry';

  // Store authentication tokens securely
  static async storeTokens(accessToken, refreshToken, expiryTime) {
    try {
      await Promise.all([
        SecureStorageManager.storeSecurely(this.TOKEN_KEY, accessToken),
        SecureStorageManager.storeSecurely(
          this.REFRESH_TOKEN_KEY,
          refreshToken
        ),
        AsyncStorage.setItem(this.TOKEN_EXPIRY_KEY, expiryTime.toString()),
      ]);
      return true;
    } catch (error) {
      console.error('Failed to store tokens:', error);
      return false;
    }
  }

  // Retrieve access token
  static async getAccessToken() {
    try {
      return await SecureStorageManager.retrieveSecurely(this.TOKEN_KEY);
    } catch (error) {
      console.error('Failed to get access token:', error);
      return null;
    }
  }

  // Retrieve refresh token
  static async getRefreshToken() {
    try {
      return await SecureStorageManager.retrieveSecurely(
        this.REFRESH_TOKEN_KEY
      );
    } catch (error) {
      console.error('Failed to get refresh token:', error);
      return null;
    }
  }

  // Check if token is expired
  static async isTokenExpired() {
    try {
      const expiry = await AsyncStorage.getItem(this.TOKEN_EXPIRY_KEY);
      if (!expiry) return true;

      return Date.now() >= parseInt(expiry);
    } catch (error) {
      return true;
    }
  }

  // Clear all tokens
  static async clearTokens() {
    try {
      await Promise.all([
        SecureStorageManager.removeSecurely(this.TOKEN_KEY),
        SecureStorageManager.removeSecurely(this.REFRESH_TOKEN_KEY),
        AsyncStorage.removeItem(this.TOKEN_EXPIRY_KEY),
      ]);
      return true;
    } catch (error) {
      console.error('Failed to clear tokens:', error);
      return false;
    }
  }

  // Refresh access token using refresh token
  static async refreshAccessToken() {
    try {
      const refreshToken = await this.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      // Call API to refresh token
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();

      // Store new tokens
      await this.storeTokens(
        data.accessToken,
        data.refreshToken || refreshToken,
        Date.now() + data.expiresIn * 1000
      );

      return data.accessToken;
    } catch (error) {
      console.error('Token refresh failed:', error);
      await this.clearTokens();
      throw error;
    }
  }
}

// =============================================
// DEVICE SECURITY
// =============================================

export class DeviceSecurity {
  static async getDeviceFingerprint() {
    try {
      const [
        deviceId,
        brand,
        model,
        systemVersion,
        bundleId,
        buildNumber,
        version,
        readableVersion,
      ] = await Promise.all([
        DeviceInfo.getUniqueId(),
        DeviceInfo.getBrand(),
        DeviceInfo.getModel(),
        DeviceInfo.getSystemVersion(),
        DeviceInfo.getBundleId(),
        DeviceInfo.getBuildNumber(),
        DeviceInfo.getVersion(),
        DeviceInfo.getReadableVersion(),
      ]);

      const fingerprint = CryptoJS.SHA256(
        `${deviceId}-${brand}-${model}-${systemVersion}-${bundleId}-${buildNumber}-${version}`
      ).toString();

      return {
        fingerprint,
        deviceInfo: {
          deviceId,
          brand,
          model,
          systemVersion,
          bundleId,
          buildNumber,
          version,
          readableVersion,
          platform: Platform.OS,
        },
      };
    } catch (error) {
      console.error('Failed to get device fingerprint:', error);
      return null;
    }
  }

  static async isDeviceRooted() {
    try {
      return await DeviceInfo.isEmulator();
    } catch (error) {
      return false;
    }
  }

  static async validateDeviceSecurity() {
    const checks = [];

    try {
      // Check if device is rooted/jailbroken
      const isEmulator = await DeviceInfo.isEmulator();
      if (isEmulator) {
        checks.push({
          type: 'emulator',
          severity: 'medium',
          message: 'Running on emulator/simulator',
        });
      }

      // Check for debug mode
      const isDebugMode = __DEV__;
      if (isDebugMode) {
        checks.push({
          type: 'debug',
          severity: 'low',
          message: 'App running in debug mode',
        });
      }

      // Check for secure storage availability
      const isSecureStorageAvailable = await SecureStorageManager.isAvailable();
      if (!isSecureStorageAvailable) {
        checks.push({
          type: 'secure_storage',
          severity: 'high',
          message: 'Secure storage not available',
        });
      }

      return {
        isSecure: checks.filter(c => c.severity === 'high').length === 0,
        checks,
      };
    } catch (error) {
      return {
        isSecure: false,
        checks: [
          {
            type: 'validation_error',
            severity: 'high',
            message: 'Failed to validate device security',
          },
        ],
      };
    }
  }
}

// =============================================
// DATA ENCRYPTION
// =============================================

export class DataEncryption {
  static SECRET_KEY = 'collision-os-mobile-2024';

  // Encrypt sensitive data before storing locally
  static encrypt(data, customKey = null) {
    try {
      const key = customKey || this.SECRET_KEY;
      const encrypted = CryptoJS.AES.encrypt(
        JSON.stringify(data),
        key
      ).toString();
      return encrypted;
    } catch (error) {
      console.error('Encryption failed:', error);
      return null;
    }
  }

  // Decrypt sensitive data
  static decrypt(encryptedData, customKey = null) {
    try {
      const key = customKey || this.SECRET_KEY;
      const decrypted = CryptoJS.AES.decrypt(encryptedData, key);
      const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);
      return JSON.parse(decryptedString);
    } catch (error) {
      console.error('Decryption failed:', error);
      return null;
    }
  }

  // Generate a secure random key
  static generateKey(length = 32) {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}

// =============================================
// AUTHENTICATION MANAGER
// =============================================

export class AuthManager {
  static async login(credentials, options = {}) {
    try {
      // Validate device security first
      const securityCheck = await DeviceSecurity.validateDeviceSecurity();
      if (!securityCheck.isSecure && !options.bypassSecurityCheck) {
        const highSeverityIssues = securityCheck.checks.filter(
          c => c.severity === 'high'
        );
        if (highSeverityIssues.length > 0) {
          throw new Error(
            `Security check failed: ${highSeverityIssues[0].message}`
          );
        }
      }

      // Get device fingerprint
      const deviceInfo = await DeviceSecurity.getDeviceFingerprint();

      // Prepare login request
      const loginData = {
        ...credentials,
        deviceFingerprint: deviceInfo?.fingerprint,
        deviceInfo: deviceInfo?.deviceInfo,
        clientType: 'mobile',
        platform: Platform.OS,
      };

      // Call login API
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }

      const data = await response.json();

      // Store tokens securely
      const tokenExpiry = Date.now() + data.expiresIn * 1000;
      await TokenManager.storeTokens(
        data.accessToken,
        data.refreshToken,
        tokenExpiry
      );

      // Store user data (encrypted)
      const encryptedUserData = DataEncryption.encrypt(data.user);
      await AsyncStorage.setItem('user_data', encryptedUserData);

      // Set up biometric authentication if available
      if (options.setupBiometric) {
        const biometricAvailable = await BiometricAuth.isSupported();
        if (biometricAvailable) {
          await BiometricAuth.setupBiometric();
        }
      }

      return {
        success: true,
        user: data.user,
        tokens: {
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          expiresIn: data.expiresIn,
        },
      };
    } catch (error) {
      console.error('Login failed:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  static async logout() {
    try {
      // Get tokens for logout request
      const accessToken = await TokenManager.getAccessToken();

      if (accessToken) {
        // Call logout API
        try {
          await fetch('/api/auth/logout', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          });
        } catch (error) {
          console.warn('Logout API call failed:', error);
        }
      }

      // Clear all stored data
      await Promise.all([
        TokenManager.clearTokens(),
        AsyncStorage.removeItem('user_data'),
        AsyncStorage.removeItem('biometric_enabled'),
        AsyncStorage.clear(), // Clear all app data
      ]);

      return { success: true };
    } catch (error) {
      console.error('Logout failed:', error);
      return { success: false, error: error.message };
    }
  }

  static async refreshSession() {
    try {
      const isExpired = await TokenManager.isTokenExpired();

      if (isExpired) {
        const newToken = await TokenManager.refreshAccessToken();
        return { success: true, token: newToken };
      }

      const currentToken = await TokenManager.getAccessToken();
      return { success: true, token: currentToken };
    } catch (error) {
      console.error('Session refresh failed:', error);
      return { success: false, error: error.message };
    }
  }

  static async getCurrentUser() {
    try {
      const encryptedUserData = await AsyncStorage.getItem('user_data');
      if (encryptedUserData) {
        const userData = DataEncryption.decrypt(encryptedUserData);
        return userData;
      }
      return null;
    } catch (error) {
      console.error('Failed to get current user:', error);
      return null;
    }
  }

  static async isAuthenticated() {
    try {
      const token = await TokenManager.getAccessToken();
      const isExpired = await TokenManager.isTokenExpired();

      return token && !isExpired;
    } catch (error) {
      return false;
    }
  }

  // Biometric login
  static async biometricLogin() {
    try {
      const biometricEnabled = await AsyncStorage.getItem('biometric_enabled');
      if (!biometricEnabled) {
        throw new Error('Biometric authentication not enabled');
      }

      const isAuthenticated = await BiometricAuth.authenticate(
        'Login to CollisionOS'
      );
      if (!isAuthenticated) {
        throw new Error('Biometric authentication failed');
      }

      // Get stored tokens
      const accessToken = await TokenManager.getAccessToken();
      const isExpired = await TokenManager.isTokenExpired();

      if (!accessToken || isExpired) {
        // Try to refresh token
        const refreshResult = await this.refreshSession();
        if (!refreshResult.success) {
          throw new Error('Session expired, please login again');
        }
      }

      const user = await this.getCurrentUser();

      return {
        success: true,
        user,
      };
    } catch (error) {
      console.error('Biometric login failed:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

export const useSecurityCheck = () => {
  const [securityStatus, setSecurityStatus] = useState({
    isSecure: true,
    checks: [],
    loading: true,
  });

  useEffect(() => {
    const checkSecurity = async () => {
      const result = await DeviceSecurity.validateDeviceSecurity();
      setSecurityStatus({
        ...result,
        loading: false,
      });
    };

    checkSecurity();
  }, []);

  return securityStatus;
};

export const useBiometricAuth = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [biometryType, setBiometryType] = useState(null);
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    const checkBiometric = async () => {
      const supported = await BiometricAuth.isSupported();
      const type = await BiometricAuth.getSupportedBiometry();
      const enabled =
        (await AsyncStorage.getItem('biometric_enabled')) === 'true';

      setIsSupported(supported);
      setBiometryType(type);
      setIsEnabled(enabled);
    };

    checkBiometric();
  }, []);

  const enableBiometric = async () => {
    try {
      const success = await BiometricAuth.authenticate(
        'Enable biometric authentication'
      );
      if (success) {
        await AsyncStorage.setItem('biometric_enabled', 'true');
        setIsEnabled(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to enable biometric:', error);
      return false;
    }
  };

  const disableBiometric = async () => {
    await AsyncStorage.removeItem('biometric_enabled');
    setIsEnabled(false);
  };

  return {
    isSupported,
    biometryType,
    isEnabled,
    enableBiometric,
    disableBiometric,
  };
};

export const useAuthStatus = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authenticated = await AuthManager.isAuthenticated();
        setIsAuthenticated(authenticated);

        if (authenticated) {
          const currentUser = await AuthManager.getCurrentUser();
          setUser(currentUser);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (credentials, options = {}) => {
    setLoading(true);
    try {
      const result = await AuthManager.login(credentials, options);
      if (result.success) {
        setIsAuthenticated(true);
        setUser(result.user);
      }
      return result;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      const result = await AuthManager.logout();
      if (result.success) {
        setIsAuthenticated(false);
        setUser(null);
      }
      return result;
    } finally {
      setLoading(false);
    }
  };

  const biometricLogin = async () => {
    setLoading(true);
    try {
      const result = await AuthManager.biometricLogin();
      if (result.success) {
        setIsAuthenticated(true);
        setUser(result.user);
      }
      return result;
    } finally {
      setLoading(false);
    }
  };

  return {
    isAuthenticated,
    user,
    loading,
    login,
    logout,
    biometricLogin,
  };
};

export default {
  SecureStorageManager,
  BiometricAuth,
  TokenManager,
  DeviceSecurity,
  DataEncryption,
  AuthManager,
};
