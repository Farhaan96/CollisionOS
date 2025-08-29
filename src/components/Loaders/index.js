// Premium Loaders Module for CollisionOS
// Executive-level loading states and skeleton components

// Main skeleton loader components
// Convenience component combinations for common use cases
import React from 'react';
import SkeletonLoader from './SkeletonLoader';
import ContentLoader from './ContentLoader';
import DataTableSkeleton from './DataTableSkeleton';
import DashboardSkeleton from './DashboardSkeleton';

export { default as SkeletonLoader } from './SkeletonLoader';
export {
  TextSkeleton,
  AvatarSkeleton,
  CardSkeleton,
  TableSkeleton,
  ChartSkeleton,
} from './SkeletonLoader';

// Content loader components
export { default as ContentLoader } from './ContentLoader';
export {
  PostLoader,
  ListItemLoader,
  ProfileLoader,
  CardLoader,
  ArticleLoader,
  DashboardLoader,
  Rectangle,
  Circle,
  CustomPath,
} from './ContentLoader';

// Page loader components
export { default as PageLoader } from './PageLoader';
export {
  CollisionOSLogo,
  DotsLoader,
} from './PageLoader';

// Data table skeleton components
export { default as DataTableSkeleton } from './DataTableSkeleton';
export {
  HeaderCellSkeleton,
  DataCellSkeleton,
  ToolbarSkeleton,
  PaginationSkeleton,
} from './DataTableSkeleton';

// Dashboard skeleton components
export { default as DashboardSkeleton } from './DashboardSkeleton';
export {
  HeaderSkeleton,
  KPICardSkeleton,
  ChartWidgetSkeleton,
  SidebarSkeleton,
} from './DashboardSkeleton';

// Loading state management hooks
export {
  default as useLoadingState,
  useQuickLoading,
  useDataLoading,
  useFileUpload,
  useBackgroundSync,
  useCriticalLoading,
  LOADING_STATES,
  LOADING_PRESETS,
} from '../hooks/useLoadingState';

// Quick skeleton combinations
export const QuickSkeletons = {
  // Form skeletons
  ContactForm: () => (
    <div style={{ padding: '24px', maxWidth: '400px' }}>
      <SkeletonLoader variant="text" lines={1} width="150px" height="1.2em" />
      <br />
      <SkeletonLoader variant="text" lines={1} width="100%" height="40px" />
      <br />
      <SkeletonLoader variant="text" lines={1} width="120px" height="1.2em" />
      <br />
      <SkeletonLoader variant="text" lines={1} width="100%" height="40px" />
      <br />
      <SkeletonLoader variant="text" lines={1} width="100px" height="1.2em" />
      <br />
      <SkeletonLoader variant="text" lines={3} width="100%" height="80px" />
      <br />
      <SkeletonLoader variant="text" lines={1} width="100px" height="36px" />
    </div>
  ),

  // User profile skeleton
  UserProfile: () => (
    <div style={{ padding: '24px', textAlign: 'center' }}>
      <SkeletonLoader variant="avatar" size={80} />
      <br />
      <SkeletonLoader variant="text" lines={1} width="200px" height="1.5em" />
      <br />
      <SkeletonLoader variant="text" lines={1} width="150px" height="1em" />
      <br />
      <SkeletonLoader variant="text" lines={3} width="300px" />
    </div>
  ),

  // Article preview
  ArticlePreview: () => (
    <ContentLoader preset="article" width={400} height={250} />
  ),

  // Product card
  ProductCard: () => (
    <SkeletonLoader 
      variant="card" 
      width="280px" 
      height="320px"
      hasHeader={false}
      hasActions={true}
    />
  ),

  // Stats grid
  StatsGrid: ({ count = 4 }) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
      {Array.from({ length: count }, (_, i) => (
        <SkeletonLoader 
          key={i}
          variant="card" 
          width="100%" 
          height="120px"
          hasHeader={false}
          hasActions={false}
        />
      ))}
    </div>
  ),

  // Navigation menu
  NavigationMenu: () => (
    <div style={{ padding: '16px', width: '250px' }}>
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0' }}>
          <SkeletonLoader variant="avatar" size={20} />
          <SkeletonLoader variant="text" lines={1} width="120px" height="1em" />
        </div>
      ))}
    </div>
  ),
};

// Pre-configured page skeletons
export const PageSkeletons = {
  // Dashboard page
  Dashboard: (props) => (
    <DashboardSkeleton 
      layout="executive"
      kpiCards={4}
      chartWidgets={[
        { type: 'line', span: 8 },
        { type: 'donut', span: 4 },
        { type: 'bar', span: 6 },
        { type: 'line', span: 6 },
      ]}
      {...props}
    />
  ),

  // Data table page
  DataTable: (props) => (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <SkeletonLoader variant="text" lines={1} width="200px" height="2em" />
        <SkeletonLoader variant="text" lines={1} width="300px" height="1em" />
      </div>
      <DataTableSkeleton
        rows={10}
        columns={[
          { type: 'avatar' },
          { type: 'name' },
          { type: 'email' },
          { type: 'status' },
          { type: 'date' },
          { type: 'actions' },
        ]}
        {...props}
      />
    </div>
  ),

  // Settings page
  Settings: () => (
    <div style={{ padding: '24px', maxWidth: '800px' }}>
      <SkeletonLoader variant="text" lines={1} width="150px" height="2em" />
      <br />
      <div style={{ display: 'grid', gap: '24px' }}>
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i}>
            <SkeletonLoader variant="text" lines={1} width="200px" height="1.2em" />
            <br />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
              <SkeletonLoader variant="text" lines={1} width="100%" height="40px" />
              <SkeletonLoader variant="text" lines={1} width="100%" height="40px" />
            </div>
          </div>
        ))}
      </div>
    </div>
  ),

  // Profile page
  Profile: () => (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '32px' }}>
        <div>
          <QuickSkeletons.UserProfile />
        </div>
        <div>
          <SkeletonLoader variant="text" lines={1} width="150px" height="2em" />
          <br />
          <QuickSkeletons.ContactForm />
        </div>
      </div>
    </div>
  ),
};

// Loading state utilities
export const LoadingUtils = {
  // Create a loading wrapper component
  withLoading: (Component, LoadingComponent) => {
    return ({ isLoading, ...props }) => {
      if (isLoading) {
        return LoadingComponent ? <LoadingComponent /> : <SkeletonLoader />;
      }
      return <Component {...props} />;
    };
  },

  // Higher-order component for data fetching
  withDataLoading: (Component, skeletonProps = {}) => {
    return ({ loading, error, data, ...props }) => {
      if (loading) {
        return <SkeletonLoader {...skeletonProps} />;
      }
      
      if (error) {
        return (
          <div style={{ padding: '24px', textAlign: 'center', color: '#ef4444' }}>
            <p>Error: {error.message}</p>
          </div>
        );
      }
      
      return <Component data={data} {...props} />;
    };
  },

  // Create loading states for async operations
  createLoadingStates: (operations) => {
    return Object.keys(operations).reduce((acc, key) => {
      acc[key] = {
        loading: false,
        error: null,
        data: null,
      };
      return acc;
    }, {});
  },
};

// Export everything as default for convenience
export default {
  SkeletonLoader,
  ContentLoader,
  PageLoader,
  DataTableSkeleton,
  DashboardSkeleton,
  QuickSkeletons,
  PageSkeletons,
  LoadingUtils,
};