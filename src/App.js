import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline } from '@mui/material';
import { ThemeProvider } from './components/Theme/ThemeProvider';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Dashboard from './pages/Dashboard/Dashboard';
import Login from './pages/Auth/Login';
import Layout from './components/Layout/Layout';
import { LoadingSpinner } from './components/Common/LoadingSpinner';

// Lazy load components for better performance
const BMSImportPage = lazy(() => import('./pages/BMSImport/BMSImportPage'));
const BMSDashboard = lazy(() => import('./components/Dashboard/BMSDashboard'));
const CustomerList = lazy(() => import('./pages/Customer/CustomerList'));
const ProductionBoard = lazy(() => import('./pages/Production/ProductionBoard'));
const PartsManagement = lazy(() => import('./pages/Parts/PartsManagement'));
const TechnicianDashboard = lazy(() => import('./pages/Technician/TechnicianDashboard'));
const QualityControlDashboard = lazy(() => import('./pages/QualityControl/QualityControlDashboard'));
const ReportsManagement = lazy(() => import('./pages/Reports/ReportsManagement'));
const MUIComponentTest = lazy(() => import('./components/Testing/MUIComponentTest'));

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Public Route Component (redirects to dashboard if already authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      } />
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="bms-import" element={
          <Suspense fallback={<LoadingSpinner />}>
            <BMSImportPage />
          </Suspense>
        } />
        <Route path="bms-dashboard" element={
          <Suspense fallback={<LoadingSpinner />}>
            <BMSDashboard />
          </Suspense>
        } />
        <Route path="customers" element={
          <Suspense fallback={<LoadingSpinner />}>
            <CustomerList />
          </Suspense>
        } />
        <Route path="production" element={
          <Suspense fallback={<LoadingSpinner />}>
            <ProductionBoard />
          </Suspense>
        } />
        <Route path="parts" element={
          <Suspense fallback={<LoadingSpinner />}>
            <PartsManagement />
          </Suspense>
        } />
        <Route path="technician" element={
          <Suspense fallback={<LoadingSpinner />}>
            <TechnicianDashboard />
          </Suspense>
        } />
        <Route path="quality-control" element={
          <Suspense fallback={<LoadingSpinner />}>
            <QualityControlDashboard />
          </Suspense>
        } />
        <Route path="reports" element={
          <Suspense fallback={<LoadingSpinner />}>
            <ReportsManagement />
          </Suspense>
        } />
        <Route path="mui-test" element={
          <Suspense fallback={<LoadingSpinner />}>
            <MUIComponentTest />
          </Suspense>
        } />
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default function App() {
  return (
    <ThemeProvider enableScheduledSwitching={true}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}