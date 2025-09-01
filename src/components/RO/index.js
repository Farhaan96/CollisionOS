/**
 * RO (Repair Order) Components
 * Comprehensive repair order management and workflow
 */

export { default as RODetail } from './RODetail';

// Re-export for convenience
export default {
  RODetail: require('./RODetail').default,
};
