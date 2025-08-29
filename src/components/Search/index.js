/**
 * Search Components
 * Advanced search and navigation system for collision repair workflow
 */

export { default as GlobalSearchBar } from './GlobalSearchBar';
export { default as SearchResults } from './SearchResults';

// Re-export for convenience
export default {
  GlobalSearchBar: require('./GlobalSearchBar').default,
  SearchResults: require('./SearchResults').default
};