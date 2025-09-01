/**
 * Enhanced Authentication Hook for Supabase
 * Replaces the existing JWT-based authentication with Supabase Auth
 */

import { useState, useEffect, useContext, createContext } from 'react';
import { supabase, authService, userService } from './supabaseClient';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        loadUserProfile(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);

      if (event === 'SIGNED_IN' && session?.user) {
        await loadUserProfile(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async userId => {
    try {
      const userProfile = await userService.getCurrentUser();
      setUser(session?.user || null);
      setProfile(userProfile);
    } catch (error) {
      console.error('Error loading user profile:', error);
      // If user profile doesn't exist in our users table, we might need to create it
      // or handle the onboarding process
    }
  };

  const signIn = async (email, password) => {
    setLoading(true);
    try {
      const { user, session } = await authService.signIn(email, password);

      if (user) {
        await loadUserProfile(user.id);
      }

      return { user, session };
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await authService.signOut();
      setUser(null);
      setProfile(null);
      setSession(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async email => {
    return await authService.resetPassword(email);
  };

  const updatePassword = async newPassword => {
    return await authService.updatePassword(newPassword);
  };

  // Helper functions for role and permission checking
  const hasRole = role => {
    return profile?.role === role;
  };

  const hasAnyRole = roles => {
    return roles.includes(profile?.role);
  };

  const hasPermission = permission => {
    if (!profile?.permissions) return false;

    // Owner and admin always have all permissions
    if (profile.role === 'owner' || profile.role === 'admin') {
      return true;
    }

    return profile.permissions[permission] === true;
  };

  const hasAnyPermission = permissions => {
    return permissions.some(permission => hasPermission(permission));
  };

  const isOwnerOrAdmin = () => {
    return hasAnyRole(['owner', 'admin']);
  };

  const isManager = () => {
    return hasAnyRole(['owner', 'admin', 'manager']);
  };

  const canViewDashboard = () => {
    return hasPermission('dashboard.view');
  };

  const canManageUsers = () => {
    return hasPermission('users.create') || hasPermission('users.edit');
  };

  const canManageJobs = () => {
    return hasPermission('jobs.create') || hasPermission('jobs.edit');
  };

  const canManageCustomers = () => {
    return hasPermission('customers.create') || hasPermission('customers.edit');
  };

  const canManageParts = () => {
    return hasPermission('parts.create') || hasPermission('parts.edit');
  };

  const canViewReports = () => {
    return hasPermission('reports.view');
  };

  const canManageSettings = () => {
    return hasPermission('settings.edit');
  };

  // Get user's full name
  const getFullName = () => {
    if (!profile) return '';
    return `${profile.first_name} ${profile.last_name}`.trim();
  };

  // Get user's initials
  const getInitials = () => {
    if (!profile) return '';
    const firstName = profile.first_name || '';
    const lastName = profile.last_name || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  // Check if user is active
  const isActive = () => {
    return profile?.is_active === true;
  };

  // Check if user is online
  const isOnline = () => {
    return profile?.is_online === true;
  };

  // Get user's shop ID
  const getShopId = () => {
    return profile?.shop_id;
  };

  // Get user's role display name
  const getRoleDisplay = () => {
    const roleMap = {
      owner: 'Owner',
      admin: 'Administrator',
      manager: 'Manager',
      service_advisor: 'Service Advisor',
      estimator: 'Estimator',
      technician: 'Technician',
      parts_manager: 'Parts Manager',
      receptionist: 'Receptionist',
      accountant: 'Accountant',
    };

    return roleMap[profile?.role] || 'Unknown';
  };

  const value = {
    // Core auth state
    user,
    profile,
    session,
    loading,

    // Auth methods
    signIn,
    signOut,
    resetPassword,
    updatePassword,

    // Role checking
    hasRole,
    hasAnyRole,
    isOwnerOrAdmin,
    isManager,

    // Permission checking
    hasPermission,
    hasAnyPermission,
    canViewDashboard,
    canManageUsers,
    canManageJobs,
    canManageCustomers,
    canManageParts,
    canViewReports,
    canManageSettings,

    // Utility methods
    getFullName,
    getInitials,
    isActive,
    isOnline,
    getShopId,
    getRoleDisplay,

    // Computed properties
    isAuthenticated: !!user && !!profile,
    isShopOwner: hasRole('owner'),
    isAdmin: hasRole('admin'),
    isTechnician: hasRole('technician'),
    roleLevel: profile?.role ? getRoleLevel(profile.role) : 0,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Helper function to get role hierarchy level
const getRoleLevel = role => {
  const levels = {
    owner: 8,
    admin: 7,
    manager: 6,
    service_advisor: 5,
    estimator: 4,
    parts_manager: 3,
    accountant: 2,
    technician: 1,
    receptionist: 0,
  };

  return levels[role] || 0;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};

// HOC for route protection
export const withAuth = (Component, requiredPermissions = []) => {
  return function AuthenticatedComponent(props) {
    const auth = useAuth();

    if (auth.loading) {
      return (
        <div className='flex items-center justify-center min-h-screen'>
          <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500'></div>
        </div>
      );
    }

    if (!auth.isAuthenticated) {
      // Redirect to login or show login form
      return (
        <div className='flex items-center justify-center min-h-screen'>
          <div className='text-center'>
            <h2 className='text-2xl font-bold text-gray-900 mb-4'>
              Authentication Required
            </h2>
            <p className='text-gray-600'>Please sign in to access this page.</p>
          </div>
        </div>
      );
    }

    if (!auth.isActive()) {
      return (
        <div className='flex items-center justify-center min-h-screen'>
          <div className='text-center'>
            <h2 className='text-2xl font-bold text-red-600 mb-4'>
              Account Inactive
            </h2>
            <p className='text-gray-600'>
              Your account has been deactivated. Please contact your
              administrator.
            </p>
          </div>
        </div>
      );
    }

    if (
      requiredPermissions.length > 0 &&
      !auth.hasAnyPermission(requiredPermissions)
    ) {
      return (
        <div className='flex items-center justify-center min-h-screen'>
          <div className='text-center'>
            <h2 className='text-2xl font-bold text-red-600 mb-4'>
              Access Denied
            </h2>
            <p className='text-gray-600'>
              You don't have permission to access this page.
            </p>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
};

// Hook for permission-based rendering
export const usePermissions = () => {
  const auth = useAuth();

  const can = permission => auth.hasPermission(permission);
  const cannot = permission => !auth.hasPermission(permission);
  const canAny = permissions => auth.hasAnyPermission(permissions);
  const canAll = permissions => permissions.every(p => auth.hasPermission(p));

  return {
    can,
    cannot,
    canAny,
    canAll,
    role: auth.profile?.role,
    isOwner: auth.isOwnerOrAdmin(),
    isManager: auth.isManager(),
  };
};

export default useAuth;
