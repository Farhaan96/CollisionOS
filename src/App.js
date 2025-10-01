import React, { lazy, Suspense } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { CssBaseline } from '@mui/material';
import { ThemeProvider } from './components/Theme/ThemeProvider';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Dashboard from './pages/Dashboard/Dashboard';
import Login from './pages/Auth/Login';
import Layout from './components/Layout/Layout';
import { LoadingSpinner } from './components/Common/LoadingSpinner';
import { ErrorBoundary, PageErrorBoundary } from './components/Common/ErrorBoundary';
import AIFloatingButton from './components/AI/AIFloatingButton';

// Lazy load components for better performance
const BMSImportPage = lazy(() => import('./pages/BMSImport/BMSImportPage'));
const BMSDashboard = lazy(() => import('./components/Dashboard/BMSDashboard'));
const CustomerList = lazy(() => import('./pages/Customer/CustomerList'));
const ProductionBoard = lazy(
  () => import('./pages/Production/ProductionBoard')
);
const PartsManagement = lazy(() => import('./pages/Parts/PartsManagement'));
const AutomatedSourcingDashboard = lazy(() => import('./components/Parts/AutomatedSourcingDashboard'));
const VendorIntegrationMonitor = lazy(() => import('./components/Parts/VendorIntegrationMonitor'));
const TechnicianDashboard = lazy(
  () => import('./pages/Technician/TechnicianDashboard')
);
const QualityControlDashboard = lazy(
  () => import('./pages/QualityControl/QualityControlDashboard')
);
const ReportsManagement = lazy(
  () => import('./pages/Reports/ReportsManagement')
);
const MUIComponentTest = lazy(
  () => import('./components/Testing/MUIComponentTest')
);

// New Enterprise Collision Repair Components
const SearchPage = lazy(() => import('./pages/Search/SearchPage'));
const ROSearchPage = lazy(() => import('./pages/Search/ROSearchPage'));
const RODetailPage = lazy(() => import('./pages/RO/RODetailPage'));
const BusinessIntelligenceDashboard = lazy(
  () => import('./components/Analytics/BusinessIntelligenceDashboard')
);
const AdvancedProductionBoard = lazy(
  () => import('./components/Production/AdvancedProductionBoard')
);
const PODashboard = lazy(
  () => import('./components/PurchaseOrder/PODashboard')
);
const CustomerCommunicationCenter = lazy(
  () => import('./components/Communication/CustomerCommunicationCenter')
);

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return isAuthenticated ? children : <Navigate to='/login' replace />;
};

// Public Route Component (redirects to dashboard if already authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();

  return isAuthenticated ? <Navigate to='/dashboard' replace /> : children;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route
        path='/login'
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path='/'
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path='dashboard' element={<Dashboard />} />
        <Route
          path='search'
          element={
            <PageErrorBoundary pageName="RO Search">
              <Suspense fallback={<LoadingSpinner />}>
                <ROSearchPage />
              </Suspense>
            </PageErrorBoundary>
          }
        />
        <Route
          path='ro/:id'
          element={
            <PageErrorBoundary pageName="RO Detail">
              <Suspense fallback={<LoadingSpinner />}>
                <RODetailPage />
              </Suspense>
            </PageErrorBoundary>
          }
        />
        <Route
          path='analytics'
          element={
            <PageErrorBoundary pageName="Analytics">
              <Suspense fallback={<LoadingSpinner />}>
                <BusinessIntelligenceDashboard />
              </Suspense>
            </PageErrorBoundary>
          }
        />
        <Route
          path='advanced-production'
          element={
            <PageErrorBoundary pageName="Advanced Production">
              <Suspense fallback={<LoadingSpinner />}>
                <AdvancedProductionBoard />
              </Suspense>
            </PageErrorBoundary>
          }
        />
        <Route
          path='purchase-orders'
          element={
            <PageErrorBoundary pageName="Purchase Orders">
              <Suspense fallback={<LoadingSpinner />}>
                <PODashboard />
              </Suspense>
            </PageErrorBoundary>
          }
        />
        <Route
          path='communications'
          element={
            <PageErrorBoundary pageName="Communications">
              <Suspense fallback={<LoadingSpinner />}>
                <CustomerCommunicationCenter />
              </Suspense>
            </PageErrorBoundary>
          }
        />
        <Route
          path='bms-import'
          element={
            <PageErrorBoundary pageName="BMS Import">
              <Suspense fallback={<LoadingSpinner />}>
                <BMSImportPage />
              </Suspense>
            </PageErrorBoundary>
          }
        />
        <Route
          path='bms-dashboard'
          element={
            <PageErrorBoundary pageName="BMS Dashboard">
              <Suspense fallback={<LoadingSpinner />}>
                <BMSDashboard />
              </Suspense>
            </PageErrorBoundary>
          }
        />
        <Route
          path='customers'
          element={
            <PageErrorBoundary pageName="Customers">
              <Suspense fallback={<LoadingSpinner />}>
                <CustomerList />
              </Suspense>
            </PageErrorBoundary>
          }
        />
        <Route
          path='production'
          element={
            <PageErrorBoundary pageName="Production Board">
              <Suspense fallback={<LoadingSpinner />}>
                <ProductionBoard />
              </Suspense>
            </PageErrorBoundary>
          }
        />
        <Route
          path='parts'
          element={
            <PageErrorBoundary pageName="Parts Management">
              <Suspense fallback={<LoadingSpinner />}>
                <PartsManagement />
              </Suspense>
            </PageErrorBoundary>
          }
        />
        <Route
          path='automated-sourcing'
          element={
            <PageErrorBoundary pageName="Automated Sourcing">
              <Suspense fallback={<LoadingSpinner />}>
                <AutomatedSourcingDashboard />
              </Suspense>
            </PageErrorBoundary>
          }
        />
        <Route
          path='vendor-integration'
          element={
            <PageErrorBoundary pageName="Vendor Integration">
              <Suspense fallback={<LoadingSpinner />}>
                <VendorIntegrationMonitor />
              </Suspense>
            </PageErrorBoundary>
          }
        />
        <Route
          path='technician'
          element={
            <PageErrorBoundary pageName="Technician Dashboard">
              <Suspense fallback={<LoadingSpinner />}>
                <TechnicianDashboard />
              </Suspense>
            </PageErrorBoundary>
          }
        />
        <Route
          path='quality-control'
          element={
            <PageErrorBoundary pageName="Quality Control">
              <Suspense fallback={<LoadingSpinner />}>
                <QualityControlDashboard />
              </Suspense>
            </PageErrorBoundary>
          }
        />
        <Route
          path='reports'
          element={
            <PageErrorBoundary pageName="Reports">
              <Suspense fallback={<LoadingSpinner />}>
                <ReportsManagement />
              </Suspense>
            </PageErrorBoundary>
          }
        />
        <Route
          path='mui-test'
          element={
            <PageErrorBoundary pageName="MUI Test">
              <Suspense fallback={<LoadingSpinner />}>
                <MUIComponentTest />
              </Suspense>
            </PageErrorBoundary>
          }
        />
        <Route index element={<Navigate to='dashboard' replace />} />
      </Route>
      <Route path='*' element={<Navigate to='/login' replace />} />
    </Routes>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider enableScheduledSwitching={true}>
        <CssBaseline />
        <AuthProvider>
          <Router
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <AppRoutes />
            {/* AI Assistant available globally when authenticated */}
            <AIAssistantWrapper />
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

// Wrapper component to only show AI assistant when authenticated
const AIAssistantWrapper = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) return null;

  return <AIFloatingButton />;
};
