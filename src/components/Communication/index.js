/**
 * Communication Components
 * Multi-channel customer communication and engagement
 */

export { default as CustomerCommunicationCenter } from './CustomerCommunicationCenter';

// Re-export for convenience
export default {
  CustomerCommunicationCenter: require('./CustomerCommunicationCenter').default,
};
