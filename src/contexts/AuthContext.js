import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const login = useCallback(async (username, password) => {
    try {
      const response = await authService.login(username, password);
      const userData = response.data?.user || response.user;
      setUser(userData);
      console.log('AuthContext - Login successful:', userData);
      return userData;
    } catch (error) {
      console.error('AuthContext - Login error:', error);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
      setUser(null);
      console.log('AuthContext - Logout successful');
    } catch (error) {
      console.error('AuthContext - Logout error:', error);
      // Still clear user state even if API call fails
      setUser(null);
    }
  }, []);

  // Check authentication status on app load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          console.log('AuthContext - Restored session:', currentUser);
        }
      } catch (error) {
        console.log('AuthContext - No active session');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const isAuthenticated = !!user;

  const value = {
    user,
    isAuthenticated,
    isLoading,
    setIsLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
