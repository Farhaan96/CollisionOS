import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
  Paper,
  IconButton,
  TextField,
  Button,
  Chip,
  Avatar,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Message,
  Email,
  Phone,
  Sms,
  NotificationsActive,
  PersonOutline,
  Add,
  Send,
  AttachFile,
} from '@mui/icons-material';
import { format, formatDistanceToNow } from 'date-fns';

/**
 * CommunicationsTab Component
 * Displays customer communication history in a timeline format
 * Includes SMS, emails, phone calls, notes, and system notifications
 */
const CommunicationsTab = ({ customerId, customerService }) => {
  const [communications, setCommunications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newMessageOpen, setNewMessageOpen] = useState(false);
  const [newMessage, setNewMessage] = useState({
    type: 'note',
    subject: '',
    message: '',
    method: 'internal',
  });
  const [sending, setSending] = useState(false);

  // Load communications on mount
  useEffect(() => {
    if (customerId) {
      loadCommunications();
    }
  }, [customerId]);

  const loadCommunications = async () => {
    setLoading(true);
    try {
      const data = await customerService.getCustomerCommunications(customerId);
      setCommunications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading communications:', error);
      setCommunications([]);
    } finally {
      setLoading(false);
    }
  };

  // Get icon for communication type
  const getTypeIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'email':
        return <Email />;
      case 'sms':
        return <Sms />;
      case 'phone':
        return <Phone />;
      case 'notification':
        return <NotificationsActive />;
      case 'note':
        return <PersonOutline />;
      case 'message':
        return <Message />;
      default:
        return <Message />;
    }
  };

  // Get color for communication type
  const getTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'email':
        return 'primary';
      case 'sms':
        return 'success';
      case 'phone':
        return 'warning';
      case 'notification':
        return 'info';
      case 'note':
        return 'default';
      default:
        return 'secondary';
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return {
      relative: formatDistanceToNow(date, { addSuffix: true }),
      absolute: format(date, 'MMM d, yyyy h:mm a'),
    };
  };

  // Handle sending new message
  const handleSendMessage = async () => {
    setSending(true);
    try {
      await customerService.sendCommunication(customerId, newMessage);
      setNewMessageOpen(false);
      setNewMessage({
        type: 'note',
        subject: '',
        message: '',
        method: 'internal',
      });
      loadCommunications(); // Reload to show new message
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          Communications ({communications.length})
        </Typography>
        <Button
          variant="contained"
          size="small"
          startIcon={<Add />}
          onClick={() => setNewMessageOpen(true)}
        >
          Add Note/Message
        </Button>
      </Box>

      {/* Communications Timeline */}
      {communications.length > 0 ? (
        <Timeline position="right">
          {communications.map((comm, index) => {
            const timestamps = formatTimestamp(comm.createdAt || comm.sentAt || comm.timestamp);

            return (
              <TimelineItem key={comm.id || index}>
                <TimelineOppositeContent
                  color="text.secondary"
                  sx={{ flex: 0.2, pt: 2 }}
                >
                  <Typography variant="caption" display="block">
                    {timestamps.relative}
                  </Typography>
                  <Typography variant="caption" display="block" color="text.disabled">
                    {timestamps.absolute}
                  </Typography>
                </TimelineOppositeContent>

                <TimelineSeparator>
                  <TimelineDot color={getTypeColor(comm.type)}>
                    {getTypeIcon(comm.type)}
                  </TimelineDot>
                  {index < communications.length - 1 && <TimelineConnector />}
                </TimelineSeparator>

                <TimelineContent sx={{ pb: 3 }}>
                  <Paper
                    elevation={1}
                    sx={{
                      p: 2,
                      backgroundColor: comm.direction === 'incoming' ? 'action.hover' : 'background.paper',
                    }}
                  >
                    {/* Header */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Chip
                        label={comm.type || 'message'}
                        size="small"
                        color={getTypeColor(comm.type)}
                        sx={{ textTransform: 'capitalize' }}
                      />
                      {comm.direction && (
                        <Chip
                          label={comm.direction}
                          size="small"
                          variant="outlined"
                          sx={{ textTransform: 'capitalize' }}
                        />
                      )}
                      {comm.sender && (
                        <Typography variant="caption" color="text.secondary">
                          by {comm.sender}
                        </Typography>
                      )}
                    </Box>

                    {/* Subject */}
                    {comm.subject && (
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                        {comm.subject}
                      </Typography>
                    )}

                    {/* Message Content */}
                    <Typography variant="body2" color="text.secondary">
                      {comm.message || comm.body || comm.content || comm.notes}
                    </Typography>

                    {/* Additional Info */}
                    {comm.recipient && (
                      <Typography variant="caption" color="text.disabled" sx={{ mt: 1, display: 'block' }}>
                        To: {comm.recipient}
                      </Typography>
                    )}

                    {/* Status */}
                    {comm.status && (
                      <Box sx={{ mt: 1 }}>
                        <Chip
                          label={comm.status}
                          size="small"
                          color={comm.status === 'delivered' || comm.status === 'sent' ? 'success' : 'default'}
                          variant="outlined"
                        />
                      </Box>
                    )}

                    {/* Related RO */}
                    {comm.roNumber && (
                      <Typography variant="caption" color="primary" sx={{ mt: 1, display: 'block' }}>
                        Related to: RO #{comm.roNumber}
                      </Typography>
                    )}
                  </Paper>
                </TimelineContent>
              </TimelineItem>
            );
          })}
        </Timeline>
      ) : (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Message sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography color="text.secondary" gutterBottom>
            No communications yet
          </Typography>
          <Typography variant="body2" color="text.disabled" sx={{ mb: 2 }}>
            Add notes, send messages, or track phone calls
          </Typography>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Add />}
            onClick={() => setNewMessageOpen(true)}
          >
            Add First Communication
          </Button>
        </Box>
      )}

      {/* New Message Dialog */}
      <Dialog
        open={newMessageOpen}
        onClose={() => !sending && setNewMessageOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Communication</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Type</InputLabel>
              <Select
                value={newMessage.type}
                onChange={(e) => setNewMessage({ ...newMessage, type: e.target.value })}
                label="Type"
              >
                <MenuItem value="note">Internal Note</MenuItem>
                <MenuItem value="email">Email</MenuItem>
                <MenuItem value="sms">SMS Message</MenuItem>
                <MenuItem value="phone">Phone Call Log</MenuItem>
                <MenuItem value="message">General Message</MenuItem>
              </Select>
            </FormControl>

            {newMessage.type !== 'note' && (
              <TextField
                fullWidth
                label="Subject"
                value={newMessage.subject}
                onChange={(e) => setNewMessage({ ...newMessage, subject: e.target.value })}
                sx={{ mb: 2 }}
              />
            )}

            <TextField
              fullWidth
              multiline
              rows={4}
              label={newMessage.type === 'note' ? 'Note' : 'Message'}
              value={newMessage.message}
              onChange={(e) => setNewMessage({ ...newMessage, message: e.target.value })}
              placeholder="Enter your message or note here..."
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewMessageOpen(false)} disabled={sending}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSendMessage}
            disabled={!newMessage.message || sending}
            startIcon={sending ? <CircularProgress size={16} /> : <Send />}
          >
            {sending ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CommunicationsTab;
