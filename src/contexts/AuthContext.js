import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

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

  const login = useCallback((userData, token) => {
    try {
      localStorage.setItem('token', token || 'dev-token');
      const userToSet = userData || { firstName: 'Admin', role: 'owner' };
      localStorage.setItem('user', JSON.stringify(userToSet));
      setUser(userToSet);
      console.log('AuthContext - Login successful:', userData);
      console.log('AuthContext - User state set to:', userToSet);
      console.log('AuthContext - isAuthenticated will be:', !!userToSet);
    } catch (error) {
      console.error('AuthContext - Login error:', error);
    }
  }, []);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      console.log('AuthContext - Logout successful');
    } catch (error) {
      console.error('AuthContext - Logout error:', error);
    }
  }, []);

  // Restore authentication state from localStorage on app load
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Check for remember me first
        const rememberedUser = localStorage.getItem('collisionos_remembered_user');
        const token = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');
        
        if (rememberedUser && !token) {
          // User was remembered but session expired - restore from remember me
          try {
            const userData = JSON.parse(rememberedUser);
            setUser(userData);
            localStorage.setItem('token', 'dev-token');
            localStorage.setItem('user', JSON.stringify(userData));
            console.log('AuthContext - Restored from remember me:', userData);
            return;
          } catch (e) {
            localStorage.removeItem('collisionos_remembered_user');
          }
        }
        
        if (token && savedUser) {
          const userData = JSON.parse(savedUser);
          setUser(userData);
          console.log('AuthContext - Restored auth state:', userData);
        } else if (token) {
          // Legacy support - create default user if only token exists
          const defaultUser = { firstName: 'Admin', role: 'owner' };
          setUser(defaultUser);
          localStorage.setItem('user', JSON.stringify(defaultUser));
          console.log('AuthContext - Created default user for legacy token');
        }
      } catch (error) {
        console.error('AuthContext - Error restoring auth state:', error);
        // Clear corrupted data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('collisionos_remembered_user');
      } finally {
        setIsLoading(false);
      }
    };

    // Add small delay to ensure localStorage is fully available
    setTimeout(initAuth, 100);
  }, []);

  const isAuthenticated = !!user;

  const value = {
    user,
    isAuthenticated,
    isLoading,
    setIsLoading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};