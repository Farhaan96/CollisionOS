import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Typography,
  Chip,
  List,
  ListItem,
  ListItemText,
  Avatar,
  Fade,
  Skeleton,
  Button,
  Collapse
} from '@mui/material';
import {
  Send as SendIcon,
  SmartToy as AIIcon,
  Person as PersonIcon,
  Lightbulb as SuggestionIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { aiService } from '../../services/aiService';

const AIAssistant = ({ open, onClose, initialQuery = '' }) => {
  const [query, setQuery] = useState(initialQuery);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      message: "👋 Hi! I'm CollisionOS Assist, your intelligent collision repair assistant. I can help you search for repair orders, analyze performance, track workflows, and answer industry questions. Try asking me something!",
      timestamp: new Date()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef(null);

  // Sample suggestions
  const defaultSuggestions = [
    { type: 'search', query: 'Show me repair orders from this week', icon: '🔍' },
    { type: 'analytics', query: 'What\'s our average cycle time?', icon: '📊' },
    { type: 'workflow', query: 'What repair orders are pending parts?', icon: '🔄' },
    { type: 'search', query: 'Find all Honda vehicles', icon: '🚗' },
    { type: 'knowledge', query: 'What is a supplement in collision repair?', icon: '💡' }
  ];

  useEffect(() => {
    setSuggestions(defaultSuggestions);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (initialQuery && initialQuery.trim()) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (messageQuery = query) => {
    if (!messageQuery.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      message: messageQuery.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setQuery('');
    setIsLoading(true);
    setShowSuggestions(false);

    try {
      console.log('🤖 Sending AI query:', messageQuery);
      
      // Call the intelligent AI service API
      let response;
      try {
        response = await aiService.query(messageQuery, {
          source: 'chat_interface',
          timestamp: new Date().toISOString()
        });
        console.log('✅ Intelligent AI Response:', response);
        
        // Only warn about truly generic fallback responses, not valid low-confidence responses
        const isFallbackResponse = response && response.message && 
          response.message.includes('I understand you\'re asking about');
           
        if (isFallbackResponse) {
          console.warn('⚠️ Backend returned generic fallback response');
        }
        
      } catch (apiError) {
        console.error('❌ AI API error:', apiError);
        
        // Only use demo fallback for actual network errors (no response at all)
        if (!apiError.response) {
          console.warn('⚠️ Network error, using demo fallback:', apiError.message);
          response = await getDemoResponse(messageQuery);
        } else {
          // For server errors, re-throw to show user the real error
          throw apiError;
        }
      }
      
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        message: response.message,
        results: response.results,
        insights: response.insights,
        actions: response.actions,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('❌ AI Assistant error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        message: 'I encountered an error processing your request. Please try again or rephrase your question.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Demo response function for when API is not available
  const getDemoResponse = async (query) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

    const lowerQuery = query.toLowerCase();

    // Repair orders searches
    if (lowerQuery.includes('repair order') || lowerQuery.includes('ro') || (lowerQuery.includes('show') && lowerQuery.includes('repair'))) {
      return {
        message: `I found 12 repair orders from this week. Here are the most recent ones:`,
        results: [
          'RO-2024-0234 - 2022 Honda Civic - Customer: John Smith - Status: In Progress',
          'RO-2024-0233 - 2021 Toyota Camry - Customer: Sarah Johnson - Status: Parts Ordered', 
          'RO-2024-0232 - 2020 Ford F-150 - Customer: Mike Wilson - Status: Inspection',
          'RO-2024-0231 - 2023 Chevy Malibu - Customer: Lisa Brown - Status: Waiting for Approval'
        ],
        insights: [
          'Average repair value this week: $3,245',
          '75% of repairs are progressing on schedule',
          '2 repairs are waiting for parts delivery'
        ],
        actions: ['View Full List', 'Filter by Status', 'Export Report']
      };
    }

    // Vehicle searches
    if (lowerQuery.includes('honda') || (lowerQuery.includes('vehicle') && !lowerQuery.includes('repair'))) {
      return {
        message: `I found 8 Honda vehicles in your database. Here are the most recent ones:`,
        results: [
          '2022 Honda Civic - Customer: John Smith - RO: RO-2024-0123',
          '2021 Honda Accord - Customer: Sarah Johnson - RO: RO-2024-0098',
          '2020 Honda CR-V - Customer: Mike Wilson - Active claim'
        ],
        insights: [
          'Honda vehicles represent 18% of your total repairs',
          'Average cycle time for Honda repairs: 7.2 days'
        ]
      };
    }

    // Analytics responses
    if (lowerQuery.includes('cycle time') || lowerQuery.includes('average')) {
      return {
        message: `Your average cycle time for the last 30 days is 8.4 days.`,
        insights: [
          'This is 12% better than last month (9.6 days)',
          'Industry average is 9-12 days',
          'Your best performing week was Week 3 with 6.8 days average'
        ],
        actions: ['View Detailed Analytics', 'Compare with Industry']
      };
    }

    // Workflow responses
    if (lowerQuery.includes('pending') && lowerQuery.includes('parts')) {
      return {
        message: `There are 3 repair orders currently waiting for parts delivery.`,
        results: [
          'RO-2024-0156 - 2023 Toyota Camry - Waiting for front bumper (ETA: 2 days)',
          'RO-2024-0142 - 2021 Ford F-150 - Waiting for headlight assembly (ETA: 5 days)',
          'RO-2024-0139 - 2022 Chevy Malibu - Waiting for door panel (Backordered)'
        ],
        insights: [
          'Average parts wait time: 4.2 days',
          '1 item is backordered and may cause delays'
        ],
        actions: ['Contact Vendors', 'Update Customers', 'Find Alternative Parts']
      };
    }

    // Knowledge responses
    if (lowerQuery.includes('supplement') || lowerQuery.includes('drp') || lowerQuery.includes('bms')) {
      const knowledge = {
        supplement: 'A supplement is additional work discovered during repair that wasn\'t included in the original estimate. It requires approval from the insurance company before proceeding.',
        drp: 'DRP (Direct Repair Program) is a partnership between auto body shops and insurance companies for preferred repairs, often with negotiated rates and streamlined processes.',
        bms: 'BMS (Body Management System) is software used to import and process insurance estimates in XML format, streamlining the workflow from estimate to repair order.'
      };

      const term = Object.keys(knowledge).find(key => lowerQuery.includes(key));
      if (term) {
        return {
          message: knowledge[term],
          insights: ['This is a key concept in collision repair workflow'],
          actions: ['Learn More', 'Related Topics']
        };
      }
    }

    // Additional search patterns
    if (lowerQuery.includes('customer') || lowerQuery.includes('client')) {
      return {
        message: `Here are your most active customers this month:`,
        results: [
          'John Smith - 3 vehicles, 2 active claims - Phone: (555) 123-4567',
          'Sarah Johnson - 2 vehicles, 1 completed repair - Phone: (555) 234-5678',
          'Mike Wilson - 1 vehicle, 1 pending estimate - Phone: (555) 345-6789'
        ],
        insights: [
          '15% of customers have multiple vehicles',
          'Average customer satisfaction: 4.8/5',
          'Repeat customer rate: 68%'
        ],
        actions: ['View Customer History', 'Contact Customer', 'Schedule Follow-up']
      };
    }

    if (lowerQuery.includes('performance') || lowerQuery.includes('metrics') || lowerQuery.includes('kpi')) {
      return {
        message: `Here's your shop performance overview for this month:`,
        results: [
          'Total Repairs Completed: 45',
          'Average Cycle Time: 8.4 days', 
          'Customer Satisfaction: 4.8/5',
          'Revenue This Month: $156,780'
        ],
        insights: [
          'Cycle time improved by 12% from last month',
          'Revenue is 8% above monthly target',
          'Customer satisfaction increased by 0.3 points'
        ],
        actions: ['Detailed Analytics', 'Compare Previous Months', 'Export Report']
      };
    }

    // General response
    return {
      message: `I understand you're asking about "${query}". I can help you with searches, analytics, workflow questions, and collision repair knowledge. Here are some examples of what I can do:`,
      results: [
        '🔍 Search: "Show me repair orders from this week"',
        '📊 Analytics: "What\'s our average cycle time?"', 
        '🔄 Workflow: "What repairs are pending parts?"',
        '💡 Knowledge: "What is a supplement?"',
        '👥 Customers: "Show me customer John Smith"'
      ],
      insights: [
        'I understand collision repair terminology and workflows',
        'Ask me about specific repair orders, customers, or vehicles',
        'I can analyze your shop performance and identify trends'
      ],
      actions: ['Show Examples', 'Get Help', 'View Suggestions']
    };
  };

  const handleSuggestionClick = (suggestion) => {
    handleSendMessage(suggestion.query);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: 1,
        type: 'ai',
        message: "Chat cleared! How can I help you with your collision repair needs?",
        timestamp: new Date()
      }
    ]);
    setShowSuggestions(true);
  };

  if (!open) return null;

  return (
    <Fade in={open}>
      <Paper
        elevation={8}
        sx={{
          position: 'fixed',
          bottom: 100,
          right: 24,
          width: { xs: '90vw', sm: 450 },
          maxWidth: 450,
          height: { xs: '80vh', sm: 600 },
          maxHeight: 600,
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1300,
          borderRadius: 3,
          overflow: 'hidden',
          boxShadow: '0px 8px 32px rgba(0, 0, 0, 0.12)'
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: 2,
            background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AIIcon />
            <Box>
              <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
                CollisionOS Assist
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.9 }}>
                Your AI collision repair assistant
              </Typography>
            </Box>
          </Box>
          <Box>
            <IconButton size="small" onClick={clearChat} sx={{ color: 'white' }}>
              <RefreshIcon />
            </IconButton>
            <IconButton size="small" onClick={onClose} sx={{ color: 'white' }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Messages */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            p: 2,
            backgroundColor: '#fafafa',
            wordWrap: 'break-word',
            wordBreak: 'break-word'
          }}
        >
          {messages.map((message) => (
            <Box
              key={message.id}
              sx={{
                mb: 2,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 1,
                maxWidth: '100%',
                width: '100%'
              }}
            >
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: message.type === 'ai' ? '#1976d2' : '#2e7d32'
                }}
              >
                {message.type === 'ai' ? <AIIcon /> : <PersonIcon />}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Paper
                  elevation={1}
                  sx={{
                    p: 1.5,
                    backgroundColor: message.type === 'ai' ? 'white' : '#e3f2fd',
                    borderRadius: 2,
                    border: '1px solid #e0e0e0',
                    wordWrap: 'break-word',
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word',
                    maxWidth: '100%',
                    boxSizing: 'border-box'
                  }}
                >
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      mb: message.results || message.insights ? 1 : 0,
                      color: '#1a1a1a',
                      fontWeight: 400,
                      lineHeight: 1.5,
                      fontSize: '0.9rem',
                      wordWrap: 'break-word',
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word',
                      whiteSpace: 'normal'
                    }}
                  >
                    {message.message}
                  </Typography>

                  {/* Results */}
                  {message.results && (
                    <Box sx={{ mt: 1 }}>
                      <List dense sx={{ p: 0 }}>
                        {message.results.slice(0, 3).map((result, idx) => (
                          <ListItem key={idx} sx={{ px: 0, py: 0.5, overflow: 'hidden', width: '100%' }}>
                            <ListItemText
                              sx={{ overflow: 'hidden' }}
                              primary={result.data || result}
                              primaryTypographyProps={{
                                variant: 'body2',
                                color: '#2c2c2c',
                                fontSize: '0.875rem',
                                fontWeight: 400,
                                wordWrap: 'break-word',
                                wordBreak: 'break-word',
                                overflowWrap: 'break-word',
                                whiteSpace: 'normal'
                              }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}

                  {/* Insights */}
                  {message.insights && message.insights.length > 0 && (
                    <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {message.insights.map((insight, idx) => (
                        <Chip
                          key={idx}
                          label={insight}
                          size="small"
                          variant="outlined"
                          sx={{ 
                            fontSize: '0.75rem',
                            backgroundColor: '#f0f7ff',
                            borderColor: '#1976d2',
                            color: '#1565c0',
                            maxWidth: '100%',
                            '& .MuiChip-label': {
                              color: '#1565c0',
                              fontWeight: 500,
                              textOverflow: 'ellipsis',
                              overflow: 'hidden',
                              whiteSpace: 'nowrap'
                            }
                          }}
                        />
                      ))}
                    </Box>
                  )}

                  {/* Actions */}
                  {message.actions && message.actions.length > 0 && (
                    <Box sx={{ mt: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {message.actions.map((action, idx) => (
                        <Button
                          key={idx}
                          size="small"
                          variant="outlined"
                          onClick={() => handleSendMessage(action)}
                          sx={{ 
                            fontSize: '0.75rem', 
                            py: 0.25,
                            backgroundColor: 'white',
                            borderColor: '#1976d2',
                            color: '#1976d2',
                            '&:hover': {
                              backgroundColor: '#f0f7ff',
                              borderColor: '#1565c0'
                            }
                          }}
                        >
                          {action}
                        </Button>
                      ))}
                    </Box>
                  )}
                </Paper>
              </Box>
            </Box>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 2 }}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: '#1976d2' }}>
                <AIIcon />
              </Avatar>
              <Paper elevation={1} sx={{ p: 1.5, flex: 1, borderRadius: 2 }}>
                <Box>
                  <Skeleton animation="wave" height={20} width="80%" />
                  <Skeleton animation="wave" height={20} width="60%" />
                </Box>
              </Paper>
            </Box>
          )}

          <div ref={messagesEndRef} />
        </Box>

        {/* Suggestions */}
        <Collapse in={showSuggestions && messages.length <= 1}>
          <Box sx={{ p: 2, borderTop: '1px solid #e0e0e0', backgroundColor: 'white' }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              <SuggestionIcon sx={{ fontSize: 14, mr: 0.5 }} />
              Try asking:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {suggestions.slice(0, 3).map((suggestion, idx) => (
                <Chip
                  key={idx}
                  label={suggestion.query}
                  size="small"
                  onClick={() => handleSuggestionClick(suggestion)}
                  sx={{ 
                    fontSize: '0.75rem', 
                    cursor: 'pointer',
                    backgroundColor: '#f0f7ff',
                    borderColor: '#1976d2',
                    color: '#1565c0',
                    '&:hover': {
                      backgroundColor: '#e3f2fd',
                      borderColor: '#1565c0'
                    },
                    '& .MuiChip-label': {
                      color: '#1565c0',
                      fontWeight: 500
                    }
                  }}
                  variant="outlined"
                />
              ))}
            </Box>
          </Box>
        </Collapse>

        {/* Input */}
        <Box
          sx={{
            p: 2,
            borderTop: '1px solid #e0e0e0',
            backgroundColor: 'white'
          }}
        >
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
            <TextField
              fullWidth
              multiline
              maxRows={3}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about your collision repair data..."
              variant="outlined"
              size="small"
              disabled={isLoading}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: 'white',
                  '& input': {
                    color: '#1a1a1a',
                    fontSize: '0.9rem'
                  },
                  '& textarea': {
                    color: '#1a1a1a',
                    fontSize: '0.9rem'
                  },
                  '& .MuiOutlinedInput-input::placeholder': {
                    color: '#666666',
                    opacity: 1
                  }
                }
              }}
            />
            <IconButton
              color="primary"
              onClick={() => handleSendMessage()}
              disabled={!query.trim() || isLoading}
              sx={{
                p: 1,
                backgroundColor: query.trim() ? '#1976d2' : 'transparent',
                color: query.trim() ? 'white' : 'inherit',
                '&:hover': {
                  backgroundColor: query.trim() ? '#1565c0' : 'rgba(0, 0, 0, 0.04)'
                }
              }}
            >
              <SendIcon />
            </IconButton>
          </Box>
        </Box>
      </Paper>
    </Fade>
  );
};

export default AIAssistant;