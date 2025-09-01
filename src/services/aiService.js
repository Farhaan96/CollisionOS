/**
 * AI Service for CollisionOS Assistant
 * Handles communication with AI assistant backend
 */

import axios from 'axios';
import { getAuthHeader } from './authService';

const API_BASE_URL =
  process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

class AIService {
  constructor() {
    this.baseURL = `${API_BASE_URL}/ai`;
  }

  /**
   * Send query to AI assistant
   * @param {string} query - Natural language query
   * @param {Object} context - Additional context for the query
   * @returns {Promise<Object>} AI response
   */
  async query(query, context = {}) {
    try {
      console.log('🤖 Sending AI query:', query);

      const response = await axios.post(
        `${this.baseURL}/query`,
        { query, context },
        { headers: { 'Content-Type': 'application/json', ...getAuthHeader() } }
      );

      console.log('✅ AI response received:', response.data.type);
      return response.data;
    } catch (error) {
      console.error('❌ AI query failed:', error);

      // If it's a network error or connection issue, let the frontend handle fallback
      if (!error.response) {
        console.log('📡 Network error, allowing frontend fallback');
        throw this.handleError(error);
      }

      // If server returns an error response, try to use it or create a helpful fallback
      if (error.response?.status >= 500) {
        console.log('🔧 Server error, allowing frontend fallback');
        throw this.handleError(error);
      }

      // For other errors (4xx), try to return the backend error as a valid response
      if (error.response?.data) {
        console.log('⚠️ API returned error data:', error.response.data);
        // If backend returned a structured error, convert it to a valid AI response
        return {
          type: 'error',
          message:
            error.response.data.message ||
            'I encountered an issue processing your request.',
          insights: [
            'Please try rephrasing your question or contact support if the issue persists.',
          ],
          actions: ['Try Again', 'Get Help'],
          success: false,
        };
      }

      throw this.handleError(error);
    }
  }

  /**
   * Get query suggestions
   * @returns {Promise<Object>} Suggested queries
   */
  async getSuggestions() {
    try {
      const response = await axios.get(`${this.baseURL}/suggestions`, {
        headers: getAuthHeader(),
      });

      return response.data;
    } catch (error) {
      console.error('❌ Failed to get AI suggestions:', error);
      return {
        success: true,
        suggestions: this.getDefaultSuggestions(),
        categories: this.getDefaultCategories(),
      };
    }
  }

  /**
   * Get AI-powered analytics summary
   * @returns {Promise<Object>} Analytics summary
   */
  async getAnalyticsSummary() {
    try {
      const response = await axios.get(`${this.baseURL}/analytics/summary`, {
        headers: getAuthHeader(),
      });

      return response.data;
    } catch (error) {
      console.error('❌ Failed to get analytics summary:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get AI assistant help information
   * @returns {Promise<Object>} Help information
   */
  async getHelp() {
    try {
      const response = await axios.get(`${this.baseURL}/help`);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to get AI help:', error);
      return this.getDefaultHelp();
    }
  }

  /**
   * Handle API errors
   * @param {Error} error - API error
   * @returns {Error} Formatted error
   */
  handleError(error) {
    if (error.response?.data?.message) {
      return new Error(error.response.data.message);
    }

    if (error.response?.status === 401) {
      return new Error('Authentication required. Please log in.');
    }

    if (error.response?.status === 403) {
      return new Error("You don't have permission to use the AI assistant.");
    }

    if (error.response?.status >= 500) {
      return new Error(
        'AI service is temporarily unavailable. Please try again later.'
      );
    }

    return new Error('Failed to communicate with AI assistant.');
  }

  /**
   * Get default suggestions when API is unavailable
   */
  getDefaultSuggestions() {
    return [
      {
        type: 'search',
        query: 'Show me repair orders from this week',
        priority: 'high',
      },
      {
        type: 'analytics',
        query: "What's our average cycle time?",
        priority: 'high',
      },
      {
        type: 'workflow',
        query: 'What repair orders are pending parts?',
        priority: 'high',
      },
      {
        type: 'search',
        query: 'Find customers with multiple vehicles',
        priority: 'medium',
      },
      { type: 'knowledge', query: 'What is a supplement?', priority: 'medium' },
      {
        type: 'analytics',
        query: 'How many jobs did we complete this month?',
        priority: 'medium',
      },
    ];
  }

  /**
   * Get default categories
   */
  getDefaultCategories() {
    return [
      {
        name: 'Search',
        icon: '🔍',
        suggestions: this.getDefaultSuggestions().filter(
          s => s.type === 'search'
        ),
      },
      {
        name: 'Analytics',
        icon: '📊',
        suggestions: this.getDefaultSuggestions().filter(
          s => s.type === 'analytics'
        ),
      },
      {
        name: 'Workflow',
        icon: '🔄',
        suggestions: this.getDefaultSuggestions().filter(
          s => s.type === 'workflow'
        ),
      },
    ];
  }

  /**
   * Get default help information
   */
  getDefaultHelp() {
    return {
      success: true,
      name: 'CollisionOS Assist',
      description: 'Your intelligent collision repair assistant',
      capabilities: [
        '🔍 Search for repair orders, customers, vehicles, and parts',
        '📊 Analyze shop performance and generate insights',
        '🔄 Track workflow status and identify bottlenecks',
        '💰 Review financial metrics and profitability',
        '🤖 Answer collision repair industry questions',
      ],
      examples: [
        {
          query: 'Show me all Honda Civics',
          description: 'Search for vehicles by make and model',
        },
        {
          query: 'What repair orders are pending parts?',
          description: 'Find workflow bottlenecks',
        },
        {
          query: "What's our average cycle time?",
          description: 'Get performance analytics',
        },
        {
          query: 'Which customers have multiple claims?',
          description: 'Identify patterns in customer data',
        },
        {
          query: 'What is a DRP?',
          description: 'Get collision repair industry knowledge',
        },
      ],
      tips: [
        'Be specific in your queries for better results',
        'Ask follow-up questions to dive deeper',
        'Use natural language - no need for technical syntax',
        'I understand collision repair terminology and workflows',
      ],
    };
  }

  /**
   * Get collision repair domain knowledge
   * @param {string} term - Term to look up
   * @returns {Object} Knowledge information
   */
  getKnowledge(term) {
    const knowledge = {
      bms: {
        term: 'Body Management System (BMS)',
        definition:
          'Software used to import and process insurance estimates in XML format, streamlining the workflow from estimate to repair order.',
        examples: ['CCC ONE', 'Mitchell', 'Audatex'],
        relatedTerms: ['XML', 'Estimate', 'Integration'],
      },
      drp: {
        term: 'Direct Repair Program (DRP)',
        definition:
          'A partnership between auto body shops and insurance companies for preferred repairs, often with negotiated rates and streamlined processes.',
        benefits: ['Guaranteed work', 'Faster payments', 'Reduced paperwork'],
        relatedTerms: ['Insurance', 'Partnership', 'Preferred Provider'],
      },
      supplement: {
        term: 'Supplement',
        definition:
          "Additional work discovered during repair that wasn't included in the original estimate. Requires approval from the insurance company.",
        process: [
          'Discover additional damage',
          'Document findings',
          'Request approval',
          'Proceed with work',
        ],
        relatedTerms: ['Estimate', 'Additional Damage', 'Authorization'],
      },
      'cycle time': {
        term: 'Cycle Time',
        definition:
          'The total time a vehicle spends in the repair facility from check-in to completion.',
        importance:
          'Key performance indicator for shop efficiency and customer satisfaction',
        industry_standard: '9-12 days for collision repairs',
        relatedTerms: ['KPI', 'Performance', 'Efficiency'],
      },
    };

    const lowerTerm = term.toLowerCase();
    return knowledge[lowerTerm] || null;
  }
}

// Create singleton instance
export const aiService = new AIService();
export default aiService;
