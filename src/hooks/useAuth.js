import { useState, useCallback, useEffect } from 'react';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false); // Start as false

  const login = useCallback((userData, token) => {
    try {
      localStorage.setItem('token', token || 'dev-token');
      const userToSet = userData || { firstName: 'Admin', role: 'owner' };
      setUser(userToSet);
      console.log('Login successful:', userData);
      console.log('User state set to:', userToSet);
      console.log('isAuthenticated will be:', !!userToSet);
    } catch (error) {
      console.error('Login error:', error);
    }
  }, []);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem('token');
      setUser(null);
      console.log('Logout successful');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, []);

  const isAuthenticated = !!user;

  return { user, isAuthenticated, isLoading, login, logout };
}
