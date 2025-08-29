import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Paper,
  IconButton,
  Divider,
  Avatar,
  alpha,
  useTheme,
  InputAdornment,
  Tab,
  Tabs,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Close as CloseIcon,
  Search as SearchIcon,
  Keyboard as KeyboardIcon,
  Settings as SettingsIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Restore as RestoreIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Save as SaveIcon,
  Category as CategoryIcon,
  Help as HelpIcon
} from '@mui/icons-material';
import { useShortcutManager } from './ShortcutManager';

// Keyboard layout for visual representation
const keyboardLayout = [
  // Row 1
  ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'Backspace'],
  // Row 2  
  ['Tab', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '[', ']', '\\'],
  // Row 3
  ['Caps', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', "'", 'Enter'],
  // Row 4
  ['Shift', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/', 'Shift'],
  // Row 5
  ['Ctrl', 'Alt', 'Cmd', 'Space', 'Cmd', 'Alt', 'Fn', 'Ctrl']
];

// Tab panel component
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`shortcut-tabpanel-${index}`}
      aria-labelledby={`shortcut-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

// Individual shortcut item component
const ShortcutItem = ({ shortcut, onEdit, onDelete, customizable = false }) => {
  const theme = useTheme();
  
  return (
    <ListItem
      sx={{
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        borderRadius: 2,
        mb: 1,
        backgroundColor: alpha(theme.palette.background.paper, 0.5),
        '&:hover': {
          backgroundColor: alpha(theme.palette.primary.main, 0.05),
          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
        }
      }}
    >
      <ListItemText
        primary={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body1" fontWeight={500}>
              {shortcut.name}
            </Typography>
            {customizable && (
              <Chip size="small" label="Custom" variant="outlined" color="primary" />
            )}
          </Box>
        }
        secondary={
          <Box sx={{ mt: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              {shortcut.description}
            </Typography>
            <Chip
              label={shortcut.display}
              size="small"
              sx={{
                mt: 1,
                fontFamily: 'monospace',
                backgroundColor: alpha(theme.palette.text.primary, 0.1)
              }}
            />
          </Box>
        }
      />
      
      {customizable && (
        <ListItemSecondaryAction>
          <IconButton size="small" onClick={() => onEdit(shortcut)} sx={{ mr: 1 }}>
            <EditIcon />
          </IconButton>
          <IconButton size="small" onClick={() => onDelete(shortcut)} color="error">
            <DeleteIcon />
          </IconButton>
        </ListItemSecondaryAction>
      )}
    </ListItem>
  );
};

// Visual keyboard component
const VisualKeyboard = ({ highlightedKeys = [], shortcuts = {} }) => {
  const theme = useTheme();
  
  const isKeyHighlighted = (key) => {
    return highlightedKeys.some(k => k.toLowerCase() === key.toLowerCase());
  };
  
  const getKeyShortcut = (key) => {
    return Object.values(shortcuts).find(shortcut => 
      shortcut.display.toLowerCase().includes(key.toLowerCase())
    );
  };
  
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        backgroundColor: alpha(theme.palette.background.paper, 0.5),
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        borderRadius: 3
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {keyboardLayout.map((row, rowIndex) => (
          <Box key={rowIndex} sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
            {row.map((key, keyIndex) => {
              const isHighlighted = isKeyHighlighted(key);
              const shortcut = getKeyShortcut(key);
              
              return (
                <Paper
                  key={keyIndex}
                  elevation={isHighlighted ? 3 : 1}
                  sx={{
                    minWidth: key === 'Space' ? 120 : key.length > 4 ? 60 : 40,
                    height: 40,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    cursor: shortcut ? 'pointer' : 'default',
                    backgroundColor: isHighlighted 
                      ? alpha(theme.palette.primary.main, 0.2)
                      : theme.palette.background.paper,
                    border: isHighlighted 
                      ? `2px solid ${theme.palette.primary.main}`
                      : `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                    color: isHighlighted 
                      ? theme.palette.primary.main
                      : theme.palette.text.primary,
                    transition: 'all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1)',
                    '&:hover': shortcut ? {
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      transform: 'translateY(-1px)',
                      boxShadow: theme.shadows[4]
                    } : {}
                  }}
                  title={shortcut ? `${shortcut.name}: ${shortcut.description}` : undefined}
                >
                  {key}
                </Paper>
              );
            })}
          </Box>
        ))}
      </Box>
    </Paper>
  );
};

// Shortcut customization dialog
const CustomizeShortcutDialog = ({ open, onClose, shortcut, onSave }) => {
  const [newShortcut, setNewShortcut] = useState('');
  const [recording, setRecording] = useState(false);
  
  useEffect(() => {
    if (shortcut) {
      setNewShortcut(shortcut.shortcut || '');
    }
  }, [shortcut]);
  
  const handleKeyDown = (event) => {
    if (!recording) return;
    
    event.preventDefault();
    
    const parts = [];
    if (event.ctrlKey) parts.push('Ctrl');
    if (event.altKey) parts.push('Alt'); 
    if (event.shiftKey) parts.push('Shift');
    if (event.metaKey) parts.push('Cmd');
    
    if (event.key && !['Control', 'Alt', 'Shift', 'Meta'].includes(event.key)) {
      parts.push(event.key);
      setNewShortcut(parts.join('+'));
      setRecording(false);
    }
  };
  
  useEffect(() => {
    if (recording) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [recording]);
  
  const handleSave = () => {
    if (shortcut && newShortcut) {
      onSave({ ...shortcut, shortcut: newShortcut });
      onClose();
    }
  };
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Customize Shortcut</DialogTitle>
      <DialogContent>
        {shortcut && (
          <>
            <Typography variant="h6" gutterBottom>
              {shortcut.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {shortcut.description}
            </Typography>
            
            <TextField
              fullWidth
              label="Keyboard Shortcut"
              value={newShortcut}
              onChange={(e) => setNewShortcut(e.target.value)}
              sx={{ mb: 2 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Button
                      size="small"
                      variant={recording ? "contained" : "outlined"}
                      onClick={() => setRecording(!recording)}
                      color={recording ? "error" : "primary"}
                    >
                      {recording ? 'Stop Recording' : 'Record'}
                    </Button>
                  </InputAdornment>
                )
              }}
            />
            
            {recording && (
              <Typography variant="body2" color="primary" sx={{ mb: 2 }}>
                Press the key combination you want to use...
              </Typography>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" disabled={!newShortcut}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Main Shortcut Helper Component
const ShortcutHelper = ({ open, onClose }) => {
  const theme = useTheme();
  const { getShortcuts } = useShortcutManager();
  const [currentTab, setCurrentTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [customShortcuts, setCustomShortcuts] = useState({});
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [customizeDialog, setCustomizeDialog] = useState({ open: false, shortcut: null });
  const [highlightedKeys, setHighlightedKeys] = useState([]);

  // Get all shortcuts grouped by category
  const allShortcuts = getShortcuts();
  const categories = Object.keys(allShortcuts);

  // Filter shortcuts based on search and category
  const filteredShortcuts = React.useMemo(() => {
    let filtered = { ...allShortcuts };
    
    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = { [selectedCategory]: allShortcuts[selectedCategory] || [] };
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const result = {};
      
      Object.entries(filtered).forEach(([category, shortcuts]) => {
        const matchingShortcuts = shortcuts.filter(shortcut =>
          shortcut.name.toLowerCase().includes(query) ||
          shortcut.description.toLowerCase().includes(query) ||
          shortcut.display.toLowerCase().includes(query)
        );
        
        if (matchingShortcuts.length > 0) {
          result[category] = matchingShortcuts;
        }
      });
      
      filtered = result;
    }
    
    return filtered;
  }, [allShortcuts, searchQuery, selectedCategory]);

  // Load custom shortcuts from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('collisionos-custom-shortcuts');
    if (saved) {
      try {
        setCustomShortcuts(JSON.parse(saved));
      } catch (error) {
        console.warn('Failed to load custom shortcuts:', error);
      }
    }
  }, []);

  // Save custom shortcuts to localStorage
  useEffect(() => {
    localStorage.setItem('collisionos-custom-shortcuts', JSON.stringify(customShortcuts));
  }, [customShortcuts]);

  // Export shortcuts configuration
  const handleExport = () => {
    const config = {
      version: '1.0',
      shortcuts: allShortcuts,
      custom: customShortcuts,
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(config, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'collisionos-shortcuts.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Import shortcuts configuration
  const handleImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const config = JSON.parse(e.target.result);
        if (config.custom) {
          setCustomShortcuts(config.custom);
        }
      } catch (error) {
        console.error('Failed to import shortcuts:', error);
      }
    };
    reader.readAsText(file);
  };

  // Reset to defaults
  const handleReset = () => {
    setCustomShortcuts({});
    setSearchQuery('');
    setSelectedCategory('all');
  };

  // Highlight keys for current shortcuts
  useEffect(() => {
    if (showKeyboard && currentTab === 1) {
      const keys = [];
      Object.values(filteredShortcuts).flat().forEach(shortcut => {
        const shortcutKeys = shortcut.display.split(/[+\s]/).map(k => k.trim());
        keys.push(...shortcutKeys);
      });
      setHighlightedKeys([...new Set(keys)]);
    } else {
      setHighlightedKeys([]);
    }
  }, [filteredShortcuts, showKeyboard, currentTab]);

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            height: '90vh',
            borderRadius: 4,
            background: `linear-gradient(135deg, 
              ${alpha(theme.palette.background.paper, 0.95)} 0%, 
              ${alpha(theme.palette.background.paper, 0.9)} 100%)`,
            backdropFilter: 'blur(20px)',
            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
          }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <KeyboardIcon color="primary" />
            <Typography variant="h6" fontWeight={600}>
              Keyboard Shortcuts
            </Typography>
            
            <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
              <IconButton size="small" onClick={handleExport} title="Export shortcuts">
                <DownloadIcon />
              </IconButton>
              
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                style={{ display: 'none' }}
                id="import-shortcuts"
              />
              <label htmlFor="import-shortcuts">
                <IconButton size="small" component="span" title="Import shortcuts">
                  <UploadIcon />
                </IconButton>
              </label>
              
              <IconButton size="small" onClick={handleReset} title="Reset to defaults">
                <RestoreIcon />
              </IconButton>
              
              <IconButton size="small" onClick={onClose}>
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ px: 0 }}>
          <Box sx={{ px: 3, mb: 3 }}>
            {/* Search and Filters */}
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  placeholder="Search shortcuts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={selectedCategory}
                    label="Category"
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    <MenuItem value="all">All Categories</MenuItem>
                    {categories.map(category => (
                      <MenuItem key={category} value={category}>
                        {category} ({allShortcuts[category]?.length || 0})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={showKeyboard}
                      onChange={(e) => setShowKeyboard(e.target.checked)}
                    />
                  }
                  label="Keyboard"
                />
              </Grid>
            </Grid>
          </Box>

          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
            <Tabs
              value={currentTab}
              onChange={(e, newValue) => setCurrentTab(newValue)}
              aria-label="shortcut tabs"
            >
              <Tab label="All Shortcuts" />
              <Tab label="Visual Keyboard" />
              <Tab label="Customize" />
            </Tabs>
          </Box>

          {/* Tab Panels */}
          <TabPanel value={currentTab} index={0}>
            <Box sx={{ px: 3 }}>
              {Object.entries(filteredShortcuts).map(([category, shortcuts]) => (
                <Accordion key={category} defaultExpanded sx={{ mb: 2 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <CategoryIcon />
                      <Typography variant="h6">{category}</Typography>
                      <Chip size="small" label={shortcuts.length} />
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <List>
                      {shortcuts.map((shortcut) => (
                        <ShortcutItem key={shortcut.shortcut} shortcut={shortcut} />
                      ))}
                    </List>
                  </AccordionDetails>
                </Accordion>
              ))}
              
              {Object.keys(filteredShortcuts).length === 0 && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <SearchIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="body1" color="text.secondary">
                    No shortcuts found
                  </Typography>
                  <Typography variant="body2" color="text.disabled">
                    Try adjusting your search or category filter
                  </Typography>
                </Box>
              )}
            </Box>
          </TabPanel>

          <TabPanel value={currentTab} index={1}>
            <Box sx={{ px: 3 }}>
              <Typography variant="body1" sx={{ mb: 3, textAlign: 'center' }}>
                Visual representation of keyboard shortcuts. Highlighted keys are mapped to shortcuts.
              </Typography>
              
              <VisualKeyboard 
                highlightedKeys={highlightedKeys}
                shortcuts={Object.values(filteredShortcuts).flat().reduce((acc, shortcut) => {
                  acc[shortcut.shortcut] = shortcut;
                  return acc;
                }, {})}
              />
              
              {highlightedKeys.length > 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
                  Hover over highlighted keys to see their associated shortcuts
                </Typography>
              )}
            </Box>
          </TabPanel>

          <TabPanel value={currentTab} index={2}>
            <Box sx={{ px: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">Custom Shortcuts</Typography>
                <Button
                  startIcon={<AddIcon />}
                  variant="outlined"
                  onClick={() => setCustomizeDialog({ 
                    open: true, 
                    shortcut: { name: '', description: '', shortcut: '', category: 'Custom' }
                  })}
                >
                  Add Custom Shortcut
                </Button>
              </Box>
              
              <List>
                {Object.values(customShortcuts).map((shortcut) => (
                  <ShortcutItem
                    key={shortcut.id}
                    shortcut={shortcut}
                    customizable
                    onEdit={(shortcut) => setCustomizeDialog({ open: true, shortcut })}
                    onDelete={(shortcut) => {
                      const newCustom = { ...customShortcuts };
                      delete newCustom[shortcut.id];
                      setCustomShortcuts(newCustom);
                    }}
                  />
                ))}
              </List>
              
              {Object.keys(customShortcuts).length === 0 && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <SettingsIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="body1" color="text.secondary">
                    No custom shortcuts yet
                  </Typography>
                  <Typography variant="body2" color="text.disabled">
                    Create custom shortcuts to improve your workflow
                  </Typography>
                </Box>
              )}
            </Box>
          </TabPanel>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mr: 'auto' }}>
            Press ? to open this help panel anytime
          </Typography>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Customize Shortcut Dialog */}
      <CustomizeShortcutDialog
        open={customizeDialog.open}
        shortcut={customizeDialog.shortcut}
        onClose={() => setCustomizeDialog({ open: false, shortcut: null })}
        onSave={(updatedShortcut) => {
          const id = updatedShortcut.id || `custom-${Date.now()}`;
          setCustomShortcuts(prev => ({
            ...prev,
            [id]: { ...updatedShortcut, id }
          }));
        }}
      />
    </>
  );
};

export default ShortcutHelper;