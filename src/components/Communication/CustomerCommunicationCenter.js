import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  IconButton,
  Chip,
  Avatar,
  Badge,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Tab,
  Tabs,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  useTheme,
  useMediaQuery,
  Fab
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineOppositeContent,
  TimelineSeparator,
  TimelineDot,
  TimelineConnector,
  TimelineContent,
} from '@mui/lab';
import {
  Message,
  Email,
  Phone,
  Sms,
  Send,
  Attachment,
  Schedule,
  Person,
  Group,
  Notifications,
  NotificationsActive,
  CheckCircle,
  Warning,
  Info,
  Star,
  Reply,
  Forward,
  Archive,
  Delete,
  Search,
  FilterList,
  Sort,
  MoreVert,
  Add,
  Camera,
  Description,
  Link,
  AccessTime,
  Done,
  DoneAll,
  ExpandMore,
  AutoAwesome,
  Refresh,
  Launch
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

/**
 * CustomerCommunicationCenter - Multi-channel Customer Engagement
 * Professional customer communication hub
 */
const CustomerCommunicationCenter = ({
  customerId,
  roId,
  className,
  ...props
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [activeTab, setActiveTab] = useState(0);
  const [conversations, setConversations] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [showComposer, setShowComposer] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showBulkMessage, setShowBulkMessage] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [selectedChannel, setSelectedChannel] = useState('sms');
  const [attachments, setAttachments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterChannel, setFilterChannel] = useState('all');
  const [menuAnchor, setMenuAnchor] = useState(null);

  // Mock conversation data
  const mockConversations = [
    {
      id: 'CONV-001',
      customerId: 'CUST-001',
      customerName: 'John Smith',
      customerPhone: '(555) 123-4567',
      customerEmail: 'john.smith@email.com',
      roNumber: 'RO-2024-001234',
      channel: 'sms',
      status: 'active',
      lastMessage: 'Thank you for the update! When will the parts arrive?',
      lastMessageTime: '2024-08-20T14:30:00Z',
      unreadCount: 2,
      priority: 'normal',
      messages: [
        {
          id: 'MSG-001',
          type: 'outgoing',
          channel: 'sms',
          content: 'Hi John, your vehicle repair is progressing well. The body work is 65% complete.',
          timestamp: '2024-08-20T10:00:00Z',
          status: 'delivered',
          attachments: []
        },
        {
          id: 'MSG-002',
          type: 'incoming',
          channel: 'sms',
          content: 'Great! How much longer do you think it will take?',
          timestamp: '2024-08-20T10:15:00Z',
          status: 'read',
          attachments: []
        },
        {
          id: 'MSG-003',
          type: 'outgoing',
          channel: 'sms',
          content: 'We\'re waiting on the front bumper to arrive. Expected delivery is Thursday.',
          timestamp: '2024-08-20T11:00:00Z',
          status: 'delivered',
          attachments: []
        },
        {
          id: 'MSG-004',
          type: 'incoming',
          channel: 'sms',
          content: 'Thank you for the update! When will the parts arrive?',
          timestamp: '2024-08-20T14:30:00Z',
          status: 'read',
          attachments: []
        }
      ]
    },
    {
      id: 'CONV-002',
      customerId: 'CUST-002',
      customerName: 'Sarah Johnson',
      customerPhone: '(555) 234-5678',
      customerEmail: 'sarah.johnson@email.com',
      roNumber: 'RO-2024-001235',
      channel: 'email',
      status: 'waiting_response',
      lastMessage: 'Please review and approve the estimate attached.',
      lastMessageTime: '2024-08-19T16:45:00Z',
      unreadCount: 0,
      priority: 'high',
      messages: []
    }
  ];

  // Mock template data
  const mockTemplates = [
    {
      id: 'TEMP-001',
      name: 'Work Started',
      category: 'status_update',
      channel: 'sms',
      subject: '',
      content: 'Hi {customer_name}, we\'ve started work on your {vehicle_year} {vehicle_make} {vehicle_model}. We\'ll keep you updated on our progress.',
      variables: ['customer_name', 'vehicle_year', 'vehicle_make', 'vehicle_model'],
      usage: 45
    },
    {
      id: 'TEMP-002',
      name: 'Parts Delay',
      category: 'delay_notification',
      channel: 'sms',
      subject: '',
      content: 'Hi {customer_name}, there\'s a delay with one of your parts. Expected delivery is now {new_date}. We apologize for any inconvenience.',
      variables: ['customer_name', 'new_date'],
      usage: 23
    },
    {
      id: 'TEMP-003',
      name: 'Estimate Approval',
      category: 'approval_request',
      channel: 'email',
      subject: 'Estimate Approval Required - RO {ro_number}',
      content: 'Dear {customer_name},\\n\\nPlease review and approve the attached estimate for your {vehicle_year} {vehicle_make} {vehicle_model}.\\n\\nEstimated Total: ${estimate_amount}\\n\\nPlease reply to approve or call us with any questions.',
      variables: ['customer_name', 'ro_number', 'vehicle_year', 'vehicle_make', 'vehicle_model', 'estimate_amount'],
      usage: 67
    },
    {
      id: 'TEMP-004',
      name: 'Ready for Pickup',
      category: 'completion',
      channel: 'sms',
      subject: '',
      content: 'Great news {customer_name}! Your {vehicle_year} {vehicle_make} {vehicle_model} is ready for pickup. Please call us at {shop_phone} to schedule.',
      variables: ['customer_name', 'vehicle_year', 'vehicle_make', 'vehicle_model', 'shop_phone'],
      usage: 89
    }
  ];

  // Load data
  useEffect(() => {
    setConversations(mockConversations);
    setTemplates(mockTemplates);
    if (mockConversations.length > 0) {
      setSelectedConversation(mockConversations[0]);
    }
  }, []);

  // Filter conversations
  const filteredConversations = useMemo(() => {
    let filtered = [...conversations];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(conv =>
        conv.customerName.toLowerCase().includes(term) ||
        conv.roNumber.toLowerCase().includes(term) ||
        conv.lastMessage.toLowerCase().includes(term)
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(conv => conv.status === filterStatus);
    }

    if (filterChannel !== 'all') {
      filtered = filtered.filter(conv => conv.channel === filterChannel);
    }

    return filtered.sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));
  }, [conversations, searchTerm, filterStatus, filterChannel]);

  // Handle message send
  const handleSendMessage = useCallback((content, channel = 'sms', templateData = null) => {
    if (!selectedConversation || !content.trim()) return;

    const newMessage = {
      id: `MSG-${Date.now()}`,
      type: 'outgoing',
      channel,
      content: templateData ? processTemplate(content, templateData) : content,
      timestamp: new Date().toISOString(),
      status: 'sending',
      attachments: [...attachments]
    };

    // Update conversation
    const updatedConversations = conversations.map(conv => {
      if (conv.id === selectedConversation.id) {
        return {
          ...conv,
          messages: [...conv.messages, newMessage],
          lastMessage: newMessage.content,
          lastMessageTime: newMessage.timestamp
        };
      }
      return conv;
    });

    setConversations(updatedConversations);
    setSelectedConversation({
      ...selectedConversation,
      messages: [...selectedConversation.messages, newMessage]
    });

    // Clear form
    setMessageText('');
    setAttachments([]);
    setShowComposer(false);

    // Simulate message delivery update
    setTimeout(() => {
      newMessage.status = 'delivered';
      setConversations([...updatedConversations]);
    }, 1000);

  }, [selectedConversation, conversations, attachments]);

  // Process template variables
  const processTemplate = (template, data) => {
    let processed = template;
    Object.entries(data).forEach(([key, value]) => {
      processed = processed.replace(new RegExp(`{${key}}`, 'g'), value);
    });
    return processed;
  };

  // Handle template selection
  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setMessageText(template.content);
    setSelectedChannel(template.channel);
    setShowTemplates(false);
  };

  // Get channel icon
  const getChannelIcon = (channel) => {
    switch (channel) {
      case 'sms': return <Sms />;
      case 'email': return <Email />;
      case 'phone': return <Phone />;
      case 'portal': return <Launch />;
      default: return <Message />;
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'primary';
      case 'waiting_response': return 'warning';
      case 'resolved': return 'success';
      case 'escalated': return 'error';
      default: return 'default';
    }
  };

  // Get message status icon
  const getMessageStatusIcon = (status) => {
    switch (status) {
      case 'sending': return <AccessTime fontSize="small" />;
      case 'delivered': return <Done fontSize="small" />;
      case 'read': return <DoneAll fontSize="small" color="primary" />;
      case 'failed': return <Warning fontSize="small" color="error" />;
      default: return null;
    }
  };

  // Format message time
  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffHours = (now - date) / (1000 * 60 * 60);
    
    if (diffHours < 1) {
      return `${Math.floor(diffHours * 60)}m ago`;
    } else if (diffHours < 24) {
      return `${Math.floor(diffHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Render conversation list
  const renderConversationList = () => (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Search and Filters */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search conversations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
          }}
          sx={{ mb: 2 }}
        />
        
        <Grid container spacing={1}>
          <Grid item xs={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={filterStatus}
                label="Status"
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="waiting_response">Waiting Response</MenuItem>
                <MenuItem value="resolved">Resolved</MenuItem>
                <MenuItem value="escalated">Escalated</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Channel</InputLabel>
              <Select
                value={filterChannel}
                label="Channel"
                onChange={(e) => setFilterChannel(e.target.value)}
              >
                <MenuItem value="all">All Channels</MenuItem>
                <MenuItem value="sms">SMS</MenuItem>
                <MenuItem value="email">Email</MenuItem>
                <MenuItem value="phone">Phone</MenuItem>
                <MenuItem value="portal">Portal</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box>

      {/* Conversation List */}
      <List sx={{ flex: 1, overflow: 'auto', p: 0 }}>
        {filteredConversations.map((conv) => (
          <ListItem
            key={conv.id}
            button
            selected={selectedConversation?.id === conv.id}
            onClick={() => setSelectedConversation(conv)}
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              '&.Mui-selected': {
                backgroundColor: theme.palette.primary.main + '0A',
                borderRight: 3,
                borderRightColor: theme.palette.primary.main
              }
            }}
          >
            <ListItemIcon>
              <Badge badgeContent={conv.unreadCount} color="primary">
                <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                  <Person />
                </Avatar>
              </Badge>
            </ListItemIcon>
            
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {conv.customerName}
                  </Typography>
                  <Chip
                    icon={getChannelIcon(conv.channel)}
                    label={conv.channel.toUpperCase()}
                    size="small"
                    color={getStatusColor(conv.status)}
                    sx={{ fontSize: '0.75rem' }}
                  />
                  {conv.priority === 'high' && (
                    <Star fontSize="small" color="warning" />
                  )}
                </Box>
              }
              secondary={
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    {conv.roNumber}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    noWrap 
                    sx={{ 
                      fontWeight: conv.unreadCount > 0 ? 600 : 400,
                      color: conv.unreadCount > 0 ? 'text.primary' : 'text.secondary'
                    }}
                  >
                    {conv.lastMessage}
                  </Typography>
                </Box>
              }
            />
            
            <ListItemSecondaryAction>
              <Typography variant="caption" color="text.secondary">
                {formatMessageTime(conv.lastMessageTime)}
              </Typography>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  // Render message thread
  const renderMessageThread = () => {
    if (!selectedConversation) {
      return (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100%',
          color: 'text.secondary'
        }}>
          <Typography variant="h6">Select a conversation to view messages</Typography>
        </Box>
      );
    }

    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Thread Header */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar>
                <Person />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {selectedConversation.customerName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedConversation.roNumber} • {selectedConversation.customerPhone}
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Call Customer">
                <IconButton onClick={() => window.open(`tel:${selectedConversation.customerPhone}`)}>
                  <Phone />
                </IconButton>
              </Tooltip>
              <Tooltip title="View RO">
                <IconButton onClick={() => navigate(`/production?ro=${selectedConversation.roNumber}`)}>
                  <Launch />
                </IconButton>
              </Tooltip>
              <IconButton onClick={(e) => setMenuAnchor(e.currentTarget)}>
                <MoreVert />
              </IconButton>
            </Box>
          </Box>
        </Box>

        {/* Messages */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          <Timeline>
            {selectedConversation.messages.map((message, index) => (
              <TimelineItem key={message.id}>
                <TimelineOppositeContent sx={{ maxWidth: '100px', paddingLeft: 0 }}>
                  <Typography variant="caption" color="text.secondary">
                    {formatMessageTime(message.timestamp)}
                  </Typography>
                </TimelineOppositeContent>
                
                <TimelineSeparator>
                  <TimelineDot color={message.type === 'outgoing' ? 'primary' : 'grey'}>
                    {getChannelIcon(message.channel)}
                  </TimelineDot>
                  {index < selectedConversation.messages.length - 1 && <TimelineConnector />}
                </TimelineSeparator>
                
                <TimelineContent>
                  <Paper 
                    elevation={1} 
                    sx={{ 
                      p: 2, 
                      backgroundColor: message.type === 'outgoing' 
                        ? theme.palette.primary.main + '15' 
                        : theme.palette.background.paper,
                      borderRadius: 2
                    }}
                  >
                    <Typography variant="body2">
                      {message.content}
                    </Typography>
                    
                    {message.attachments.length > 0 && (
                      <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                        {message.attachments.map((attachment, i) => (
                          <Chip
                            key={i}
                            icon={<Attachment />}
                            label={attachment.name}
                            size="small"
                            clickable
                          />
                        ))}
                      </Box>
                    )}
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        {message.type === 'outgoing' ? 'Sent' : 'Received'} via {message.channel.toUpperCase()}
                      </Typography>
                      {message.type === 'outgoing' && getMessageStatusIcon(message.status)}
                    </Box>
                  </Paper>
                </TimelineContent>
              </TimelineItem>
            ))}
          </Timeline>
        </Box>

        {/* Message Input */}
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Grid container spacing={1}>
            <Grid item xs>
              <TextField
                fullWidth
                size="small"
                multiline
                maxRows={4}
                placeholder="Type your message..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(messageText, selectedChannel);
                  }
                }}
              />
            </Grid>
            <Grid item>
              <IconButton onClick={() => setShowTemplates(true)}>
                <AutoAwesome />
              </IconButton>
            </Grid>
            <Grid item>
              <IconButton component="label">
                <Attachment />
                <input type="file" hidden onChange={(e) => {
                  // Handle file attachment
                  console.log('File selected:', e.target.files[0]);
                }} />
              </IconButton>
            </Grid>
            <Grid item>
              <Button
                variant="contained"
                onClick={() => handleSendMessage(messageText, selectedChannel)}
                disabled={!messageText.trim()}
                startIcon={<Send />}
              >
                Send
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Box>
    );
  };

  // Render templates panel
  const renderTemplates = () => (
    <Grid container spacing={2}>
      {templates.map((template) => (
        <Grid item xs={12} sm={6} md={4} key={template.id}>
          <Card
            sx={{ 
              cursor: 'pointer',
              '&:hover': { boxShadow: 3 }
            }}
            onClick={() => handleTemplateSelect(template)}
          >
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {template.name}
                </Typography>
                <Chip
                  icon={getChannelIcon(template.channel)}
                  label={template.channel.toUpperCase()}
                  size="small"
                  color="primary"
                />
              </Box>
              
              <Chip 
                label={template.category.replace('_', ' ')}
                size="small"
                variant="outlined"
                sx={{ mb: 2 }}
              />
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {template.content.substring(0, 100)}...
              </Typography>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  Used {template.usage} times
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {template.variables.length} variables
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  return (
    <Box className={className} {...props}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Customer Communications
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Group />}
            onClick={() => setShowBulkMessage(true)}
          >
            Bulk Message
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setShowComposer(true)}
          >
            New Message
          </Button>
        </Box>
      </Box>

      {/* Main Content */}
      <Paper sx={{ height: 'calc(100vh - 200px)', display: 'flex' }}>
        {/* Tabs for Mobile */}
        {isMobile && (
          <Box sx={{ width: '100%' }}>
            <Tabs
              value={activeTab}
              onChange={(event, newValue) => setActiveTab(newValue)}
              variant="fullWidth"
            >
              <Tab icon={<Message />} label="Conversations" />
              <Tab icon={<Description />} label="Templates" />
            </Tabs>
            
            <Box sx={{ p: 2, height: 'calc(100% - 48px)' }}>
              {activeTab === 0 && renderConversationList()}
              {activeTab === 1 && renderTemplates()}
            </Box>
          </Box>
        )}

        {/* Desktop Layout */}
        {!isMobile && (
          <>
            {/* Sidebar */}
            <Box sx={{ width: 350, borderRight: 1, borderColor: 'divider' }}>
              <Tabs
                value={activeTab}
                onChange={(event, newValue) => setActiveTab(newValue)}
                variant="fullWidth"
              >
                <Tab icon={<Message />} label="Conversations" />
                <Tab icon={<Description />} label="Templates" />
              </Tabs>
              
              <Box sx={{ height: 'calc(100% - 48px)' }}>
                {activeTab === 0 && renderConversationList()}
                {activeTab === 1 && (
                  <Box sx={{ p: 2, height: '100%', overflow: 'auto' }}>
                    {renderTemplates()}
                  </Box>
                )}
              </Box>
            </Box>

            {/* Main Content */}
            <Box sx={{ flex: 1 }}>
              {renderMessageThread()}
            </Box>
          </>
        )}
      </Paper>

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem onClick={() => console.log('Mark as resolved')}>
          <CheckCircle sx={{ mr: 1 }} fontSize="small" />
          Mark as Resolved
        </MenuItem>
        <MenuItem onClick={() => console.log('Escalate')}>
          <Warning sx={{ mr: 1 }} fontSize="small" />
          Escalate
        </MenuItem>
        <MenuItem onClick={() => console.log('Archive')}>
          <Archive sx={{ mr: 1 }} fontSize="small" />
          Archive
        </MenuItem>
      </Menu>

      {/* Templates Dialog */}
      <Dialog
        open={showTemplates}
        onClose={() => setShowTemplates(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Select Message Template</DialogTitle>
        <DialogContent>
          {renderTemplates()}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTemplates(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Message Dialog */}
      <Dialog
        open={showBulkMessage}
        onClose={() => setShowBulkMessage(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Send Bulk Message</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Bulk messaging interface will be implemented here.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowBulkMessage(false)}>Cancel</Button>
          <Button variant="contained">Send Messages</Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button for Mobile */}
      {isMobile && (
        <Fab
          color="primary"
          aria-label="new message"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={() => setShowComposer(true)}
        >
          <Add />
        </Fab>
      )}
    </Box>
  );
};

export default CustomerCommunicationCenter;