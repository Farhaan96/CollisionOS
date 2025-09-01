import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Chip,
  IconButton,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Tabs,
  Tab,
  Paper,
  Divider,
  Badge,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
} from '@mui/lab';
import {
  Message,
  Phone,
  Email,
  Sms,
  VideoCall,
  Send,
  Attach,
  PhotoCamera,
  Schedule,
  Event,
  Person,
  DirectionsCar,
  Assignment,
  Payment,
  Star,
  ThumbUp,
  Warning,
  CheckCircle,
  Info,
  History,
  Refresh,
  Add,
  Edit,
  Delete,
  Print,
  Share,
  Download,
  Upload,
  Search,
  FilterList,
  MoreVert,
  ExpandMore,
  Notifications,
  NotificationsOff,
  AutoMode,
  ManualMode,
  PlayArrow,
  Pause,
  Stop,
  Campaign,
  Loyalty,
  Gift,
  Cake,
  LocationOn,
  Language,
  AccessTime,
  Visibility,
  Comment,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow, format } from 'date-fns';
import {
  formatCurrency,
  formatDate,
  formatPhoneNumber,
} from '../../utils/formatters';

// Communication channels
const COMMUNICATION_CHANNELS = {
  sms: { label: 'SMS', icon: Sms, color: '#25d366' },
  email: { label: 'Email', icon: Email, color: '#1976d2' },
  phone: { label: 'Phone', icon: Phone, color: '#f57c00' },
  video: { label: 'Video Call', icon: VideoCall, color: '#9c27b0' },
  portal: { label: 'Customer Portal', icon: Message, color: '#2e7d32' },
};

// Communication templates based on Instructions document
const MESSAGE_TEMPLATES = {
  estimate_ready: {
    title: 'Estimate Ready',
    channel: ['email', 'sms'],
    template:
      'Hi {customerName}, your estimate for {vehicleInfo} is ready for review. Total: {estimateAmount}. View details: {portalLink}',
  },
  insurance_approved: {
    title: 'Insurance Approved',
    channel: ['email', 'sms'],
    template:
      'Good news! Your insurance claim has been approved. We can begin repairs on {startDate}. Questions? Call us at {shopPhone}',
  },
  parts_ordered: {
    title: 'Parts Ordered',
    channel: ['email', 'sms'],
    template:
      "Parts have been ordered for your {vehicleInfo}. Expected arrival: {partsETA}. We'll notify you when they arrive.",
  },
  repair_started: {
    title: 'Repair Started',
    channel: ['email', 'sms', 'portal'],
    template:
      'Repair work has begun on your {vehicleInfo}. You can track progress in real-time: {portalLink}',
  },
  paint_complete: {
    title: 'Paint Complete',
    channel: ['email', 'sms'],
    template:
      'Paint work is complete on your {vehicleInfo}. Photos have been uploaded to your portal: {portalLink}',
  },
  ready_pickup: {
    title: 'Ready for Pickup',
    channel: ['email', 'sms', 'phone'],
    template:
      'Your {vehicleInfo} is ready for pickup! Please call {shopPhone} to schedule or use our online scheduler: {scheduleLink}',
  },
  payment_reminder: {
    title: 'Payment Reminder',
    channel: ['email', 'sms'],
    template:
      'Reminder: Payment of {paymentAmount} is due for your completed repair. Pay online: {paymentLink}',
  },
  satisfaction_survey: {
    title: 'Satisfaction Survey',
    channel: ['email', 'sms'],
    template:
      'How was your experience? Please take 2 minutes to share your feedback: {surveyLink}. Your input helps us improve!',
  },
  birthday_greeting: {
    title: 'Birthday Greeting',
    channel: ['email', 'sms'],
    template:
      'Happy Birthday {customerName}! 🎉 Enjoy 15% off your next service. Use code BIRTHDAY15: {offerLink}',
  },
  service_reminder: {
    title: 'Service Reminder',
    channel: ['email', 'sms'],
    template:
      "Time for your vehicle's maintenance check! Schedule your appointment today: {scheduleLink}",
  },
};

// Customer preferences
const CUSTOMER_PREFERENCES = [
  'SMS Notifications',
  'Email Updates',
  'Phone Calls',
  'Photo Updates',
  'Real-time Tracking',
  'Marketing Communications',
  'Birthday Offers',
  'Service Reminders',
];

const CustomerCommunicationHub = ({ customerId, jobId }) => {
  const theme = useTheme();
  const messageInputRef = useRef();

  const [activeTab, setActiveTab] = useState(0);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [messageChannel, setMessageChannel] = useState('sms');
  const [templateDialog, setTemplateDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [automationDialog, setAutomationDialog] = useState(false);
  const [customerDialog, setCustomerDialog] = useState(false);
  const [schedulerDialog, setSchedulerDialog] = useState(false);
  const [campaignDialog, setCampaignDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  // Sample customer data
  const sampleCustomer = {
    id: customerId || '1',
    name: 'John Smith',
    email: 'john.smith@email.com',
    phone: '(555) 123-4567',
    address: '123 Main St, Anytown, ST 12345',
    preferredContact: 'sms',
    language: 'English',
    timezone: 'America/New_York',
    preferences: ['SMS Notifications', 'Email Updates', 'Photo Updates'],
    vehicles: [
      {
        id: '1',
        year: 2022,
        make: 'Toyota',
        model: 'Camry',
        vin: '1234567890ABCDEF',
        color: 'White',
        mileage: 25000,
      },
    ],
    serviceHistory: [
      {
        id: '1',
        date: '2024-01-15',
        type: 'Collision Repair',
        amount: 2450.0,
        satisfaction: 4.8,
      },
      {
        id: '2',
        date: '2023-08-10',
        type: 'Paint Touch-up',
        amount: 680.0,
        satisfaction: 5.0,
      },
    ],
    loyaltyPoints: 150,
    birthday: '1985-03-15',
    joinDate: '2023-08-01',
    totalSpent: 3130.0,
    avgSatisfaction: 4.9,
    lastContact: '2024-01-16T14:30:00Z',
  };

  // Sample conversation data
  const sampleConversations = [
    {
      id: '1',
      customerId: '1',
      channel: 'sms',
      subject: 'Repair Status Update',
      lastMessage:
        'Thank you for the update! Looking forward to getting my car back.',
      lastMessageTime: '2024-01-16T14:30:00Z',
      unreadCount: 0,
      messages: [
        {
          id: '1',
          senderId: 'system',
          content:
            "Hi John! Your Toyota Camry repair has started. We'll keep you updated on progress.",
          timestamp: '2024-01-16T09:00:00Z',
          channel: 'sms',
          status: 'delivered',
        },
        {
          id: '2',
          senderId: '1',
          content: 'Great, thank you for letting me know!',
          timestamp: '2024-01-16T09:15:00Z',
          channel: 'sms',
          status: 'delivered',
        },
        {
          id: '3',
          senderId: 'system',
          content:
            'Parts have been ordered and should arrive tomorrow. Estimated completion is Friday.',
          timestamp: '2024-01-16T14:00:00Z',
          channel: 'sms',
          status: 'delivered',
          attachments: [
            {
              type: 'photo',
              url: '/path/to/photo.jpg',
              name: 'parts-ordered.jpg',
            },
          ],
        },
        {
          id: '4',
          senderId: '1',
          content:
            'Thank you for the update! Looking forward to getting my car back.',
          timestamp: '2024-01-16T14:30:00Z',
          channel: 'sms',
          status: 'delivered',
        },
      ],
    },
  ];

  useEffect(() => {
    setSelectedCustomer(sampleCustomer);
    setConversations(sampleConversations);
    setCurrentConversation(sampleConversations[0]);
  }, []);

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || !currentConversation) return;

    const message = {
      id: Date.now().toString(),
      senderId: 'system',
      content: newMessage,
      timestamp: new Date().toISOString(),
      channel: messageChannel,
      status: 'sending',
    };

    // Add to conversation
    const updatedConversation = {
      ...currentConversation,
      messages: [...currentConversation.messages, message],
      lastMessage: newMessage,
      lastMessageTime: message.timestamp,
    };

    setCurrentConversation(updatedConversation);
    setConversations(prev =>
      prev.map(conv =>
        conv.id === currentConversation.id ? updatedConversation : conv
      )
    );
    setNewMessage('');

    // Simulate sending
    setTimeout(() => {
      const sentMessage = { ...message, status: 'delivered' };
      const finalConversation = {
        ...updatedConversation,
        messages: updatedConversation.messages.map(msg =>
          msg.id === message.id ? sentMessage : msg
        ),
      };

      setCurrentConversation(finalConversation);
      setConversations(prev =>
        prev.map(conv =>
          conv.id === currentConversation.id ? finalConversation : conv
        )
      );
    }, 1000);
  };

  // Apply message template
  const applyTemplate = templateKey => {
    const template = MESSAGE_TEMPLATES[templateKey];
    if (!template || !selectedCustomer) return;

    const variables = {
      customerName: selectedCustomer.name,
      vehicleInfo: `${selectedCustomer.vehicles[0]?.year} ${selectedCustomer.vehicles[0]?.make} ${selectedCustomer.vehicles[0]?.model}`,
      estimateAmount: formatCurrency(2450.0),
      startDate: formatDate(new Date(Date.now() + 24 * 60 * 60 * 1000)),
      partsETA: formatDate(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)),
      shopPhone: '(555) 123-4567',
      portalLink: 'https://portal.collisionos.com/track/12345',
      scheduleLink: 'https://collisionos.com/schedule',
      paymentLink: 'https://pay.collisionos.com/12345',
      paymentAmount: formatCurrency(450.0),
      surveyLink: 'https://survey.collisionos.com/12345',
      offerLink: 'https://offers.collisionos.com/birthday15',
    };

    let message = template.template;
    Object.entries(variables).forEach(([key, value]) => {
      message = message.replace(new RegExp(`{${key}}`, 'g'), value);
    });

    setNewMessage(message);
    setTemplateDialog(false);
  };

  // Customer communication timeline
  const CommunicationTimeline = ({ customer }) => {
    const timelineEvents = [
      {
        id: '1',
        type: 'message',
        title: 'SMS Sent',
        description: 'Repair status update sent',
        timestamp: '2024-01-16T14:00:00Z',
        icon: Sms,
        color: '#25d366',
      },
      {
        id: '2',
        type: 'call',
        title: 'Phone Call',
        description: 'Discussed insurance approval',
        timestamp: '2024-01-15T11:30:00Z',
        icon: Phone,
        color: '#f57c00',
      },
      {
        id: '3',
        type: 'email',
        title: 'Email Sent',
        description: 'Estimate ready for review',
        timestamp: '2024-01-14T16:45:00Z',
        icon: Email,
        color: '#1976d2',
      },
      {
        id: '4',
        type: 'survey',
        title: 'Survey Response',
        description: 'Customer satisfaction: 5/5',
        timestamp: '2024-01-10T09:20:00Z',
        icon: Star,
        color: '#ffc107',
      },
    ];

    return (
      <Timeline>
        {timelineEvents.map(event => {
          const IconComponent = event.icon;
          return (
            <TimelineItem key={event.id}>
              <TimelineSeparator>
                <TimelineDot sx={{ bgcolor: event.color }}>
                  <IconComponent sx={{ fontSize: 16, color: 'white' }} />
                </TimelineDot>
                <TimelineConnector />
              </TimelineSeparator>
              <TimelineContent>
                <Typography variant='subtitle2' fontWeight='bold'>
                  {event.title}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  {event.description}
                </Typography>
                <Typography variant='caption' color='text.secondary'>
                  {formatDistanceToNow(new Date(event.timestamp))} ago
                </Typography>
              </TimelineContent>
            </TimelineItem>
          );
        })}
      </Timeline>
    );
  };

  // Customer profile component
  const CustomerProfile = ({ customer }) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar
            sx={{ width: 64, height: 64, mr: 2, bgcolor: 'primary.main' }}
          >
            {customer.name
              .split(' ')
              .map(n => n[0])
              .join('')}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant='h5' fontWeight='bold'>
              {customer.name}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Customer since {formatDate(customer.joinDate)}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
              <Star sx={{ color: '#ffc107', fontSize: 16, mr: 0.5 }} />
              <Typography variant='body2'>
                {customer.avgSatisfaction}/5.0 satisfaction
              </Typography>
            </Box>
          </Box>
          <Tooltip title='Edit Customer'>
            <IconButton onClick={() => setCustomerDialog(true)}>
              <Edit />
            </IconButton>
          </Tooltip>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant='body2' color='text.secondary'>
              Contact
            </Typography>
            <Typography variant='body2'>
              {formatPhoneNumber(customer.phone)}
            </Typography>
            <Typography variant='body2'>{customer.email}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant='body2' color='text.secondary'>
              Preferred
            </Typography>
            <Chip
              size='small'
              icon={COMMUNICATION_CHANNELS[customer.preferredContact]?.icon}
              label={COMMUNICATION_CHANNELS[customer.preferredContact]?.label}
              sx={{ mr: 1 }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant='body2' color='text.secondary'>
              Total Spent
            </Typography>
            <Typography variant='h6' color='primary'>
              {formatCurrency(customer.totalSpent)}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant='body2' color='text.secondary'>
              Loyalty Points
            </Typography>
            <Typography variant='h6' color='success.main'>
              {customer.loyaltyPoints} pts
            </Typography>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        <Typography variant='subtitle2' gutterBottom>
          Communication Preferences
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {customer.preferences.map((pref, index) => (
            <Chip
              key={index}
              size='small'
              label={pref}
              variant='outlined'
              sx={{ fontSize: '0.7rem' }}
            />
          ))}
        </Box>
      </CardContent>
    </Card>
  );

  // Message composer
  const MessageComposer = () => (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <FormControl size='small' sx={{ minWidth: 120, mr: 2 }}>
          <Select
            value={messageChannel}
            onChange={e => setMessageChannel(e.target.value)}
          >
            {Object.entries(COMMUNICATION_CHANNELS).map(([key, channel]) => (
              <MenuItem key={key} value={key}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <channel.icon
                    sx={{ mr: 1, fontSize: 16, color: channel.color }}
                  />
                  {channel.label}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          size='small'
          startIcon={<Campaign />}
          onClick={() => setTemplateDialog(true)}
        >
          Templates
        </Button>
      </Box>

      <TextField
        fullWidth
        multiline
        rows={3}
        placeholder='Type your message...'
        value={newMessage}
        onChange={e => setNewMessage(e.target.value)}
        onKeyPress={e => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
          }
        }}
        sx={{ mb: 2 }}
      />

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Box>
          <IconButton size='small'>
            <Attach />
          </IconButton>
          <IconButton size='small'>
            <PhotoCamera />
          </IconButton>
        </Box>

        <Button
          variant='contained'
          startIcon={<Send />}
          onClick={sendMessage}
          disabled={!newMessage.trim()}
        >
          Send
        </Button>
      </Box>
    </Paper>
  );

  // Conversation view
  const ConversationView = ({ conversation }) => {
    if (!conversation) {
      return (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: 400,
          }}
        >
          <Typography color='text.secondary'>
            Select a conversation to start messaging
          </Typography>
        </Box>
      );
    }

    return (
      <Box sx={{ height: 400, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
          {conversation.messages.map(message => {
            const isFromCustomer = message.senderId !== 'system';
            const ChannelIcon = COMMUNICATION_CHANNELS[message.channel]?.icon;

            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  display: 'flex',
                  justifyContent: isFromCustomer ? 'flex-start' : 'flex-end',
                  marginBottom: theme.spacing(1),
                }}
              >
                <Paper
                  sx={{
                    p: 1.5,
                    maxWidth: '70%',
                    bgcolor: isFromCustomer ? 'grey.100' : 'primary.main',
                    color: isFromCustomer
                      ? 'text.primary'
                      : 'primary.contrastText',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                    <ChannelIcon sx={{ fontSize: 14, mr: 0.5 }} />
                    <Typography variant='caption'>
                      {format(new Date(message.timestamp), 'HH:mm')}
                    </Typography>
                    {message.status && (
                      <Chip
                        size='small'
                        label={message.status}
                        sx={{ ml: 1, height: 16, fontSize: '0.6rem' }}
                      />
                    )}
                  </Box>
                  <Typography variant='body2'>{message.content}</Typography>
                  {message.attachments && (
                    <Box sx={{ mt: 1 }}>
                      {message.attachments.map((attachment, index) => (
                        <Chip
                          key={index}
                          size='small'
                          icon={<PhotoCamera />}
                          label={attachment.name}
                          onClick={() => {}}
                          sx={{ mr: 0.5 }}
                        />
                      ))}
                    </Box>
                  )}
                </Paper>
              </motion.div>
            );
          })}
        </Box>
      </Box>
    );
  };

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography variant='h5'>Customer Communication Hub</Typography>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            startIcon={<AutoMode />}
            variant='outlined'
            onClick={() => setAutomationDialog(true)}
          >
            Automation
          </Button>
          <Button
            startIcon={<Campaign />}
            variant='outlined'
            onClick={() => setCampaignDialog(true)}
          >
            Campaign
          </Button>
          <Button
            startIcon={<Schedule />}
            variant='contained'
            onClick={() => setSchedulerDialog(true)}
          >
            Schedule
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Left panel - Customer info */}
        <Grid item xs={12} lg={4}>
          {selectedCustomer && <CustomerProfile customer={selectedCustomer} />}

          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant='h6' gutterBottom>
                Communication History
              </Typography>
              <CommunicationTimeline customer={selectedCustomer} />
            </CardContent>
          </Card>
        </Grid>

        {/* Center panel - Conversations */}
        <Grid item xs={12} lg={5}>
          <Card>
            <CardContent>
              <Typography variant='h6' gutterBottom>
                Conversations
              </Typography>

              <ConversationView conversation={currentConversation} />
            </CardContent>
          </Card>

          <Box sx={{ mt: 2 }}>
            <MessageComposer />
          </Box>
        </Grid>

        {/* Right panel - Quick actions & automation */}
        <Grid item xs={12} lg={3}>
          <Card>
            <CardContent>
              <Typography variant='h6' gutterBottom>
                Quick Actions
              </Typography>

              <List dense>
                <ListItem button onClick={() => {}}>
                  <ListItemIcon>
                    <Phone />
                  </ListItemIcon>
                  <ListItemText primary='Call Customer' />
                </ListItem>
                <ListItem button onClick={() => {}}>
                  <ListItemIcon>
                    <Email />
                  </ListItemIcon>
                  <ListItemText primary='Send Email' />
                </ListItem>
                <ListItem button onClick={() => {}}>
                  <ListItemIcon>
                    <Schedule />
                  </ListItemIcon>
                  <ListItemText primary='Schedule Appointment' />
                </ListItem>
                <ListItem button onClick={() => {}}>
                  <ListItemIcon>
                    <Payment />
                  </ListItemIcon>
                  <ListItemText primary='Send Payment Link' />
                </ListItem>
                <ListItem button onClick={() => {}}>
                  <ListItemIcon>
                    <Star />
                  </ListItemIcon>
                  <ListItemText primary='Request Review' />
                </ListItem>
              </List>
            </CardContent>
          </Card>

          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant='h6' gutterBottom>
                Automated Messages
              </Typography>

              <List dense>
                {Object.entries(MESSAGE_TEMPLATES)
                  .slice(0, 5)
                  .map(([key, template]) => (
                    <ListItem key={key}>
                      <ListItemText
                        primary={template.title}
                        secondary={`${template.channel.join(', ')}`}
                      />
                      <ListItemSecondaryAction>
                        <Switch size='small' />
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Template Dialog */}
      <Dialog
        open={templateDialog}
        onClose={() => setTemplateDialog(false)}
        maxWidth='md'
        fullWidth
      >
        <DialogTitle>Message Templates</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {Object.entries(MESSAGE_TEMPLATES).map(([key, template]) => (
              <Grid item xs={12} sm={6} key={key}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    border:
                      selectedTemplate === key ? '2px solid' : '1px solid',
                    borderColor:
                      selectedTemplate === key ? 'primary.main' : 'divider',
                    '&:hover': { borderColor: 'primary.main' },
                  }}
                  onClick={() => setSelectedTemplate(key)}
                >
                  <CardContent>
                    <Typography
                      variant='subtitle1'
                      fontWeight='bold'
                      gutterBottom
                    >
                      {template.title}
                    </Typography>
                    <Typography
                      variant='body2'
                      color='text.secondary'
                      sx={{ mb: 1 }}
                    >
                      {template.template.substring(0, 100)}...
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {template.channel.map(channel => (
                        <Chip
                          key={channel}
                          size='small'
                          label={COMMUNICATION_CHANNELS[channel]?.label}
                          sx={{ fontSize: '0.7rem' }}
                        />
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTemplateDialog(false)}>Cancel</Button>
          <Button
            variant='contained'
            disabled={!selectedTemplate}
            onClick={() => applyTemplate(selectedTemplate)}
          >
            Use Template
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustomerCommunicationHub;
