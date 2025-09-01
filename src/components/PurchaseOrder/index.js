/**
 * Purchase Order Components
 * Advanced purchase order management and vendor workflow
 */

export { default as PODashboard } from './PODashboard';

// Re-export for convenience
export default {
  PODashboard: require('./PODashboard').default,
};
