import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  TextField,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Typography,
  Chip,
  Box,
  IconButton,
  Divider,
  Avatar,
  alpha,
  useTheme,
  Keyboard,
  inputBaseClasses,
} from '@mui/material';
import {
  Search as SearchIcon,
  Close as CloseIcon,
  TrendingUp as TrendingUpIcon,
  History as HistoryIcon,
  NavigateNext as NavigateNextIcon,
  Star as StarIcon,
  KeyboardArrowRight as ArrowRightIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Build as BuildIcon,
  Assessment as AssessmentIcon,
  Settings as SettingsIcon,
  Add as AddIcon,
  Save as SaveIcon,
  FileOpen as FileOpenIcon,
  Print as PrintIcon,
  Share as ShareIcon,
} from '@mui/icons-material';
import { premiumAnimations } from '../../utils/animations';
import { useCommandProvider } from './CommandProvider';

// Spotlight-style command palette with glassmorphism design
const CommandPalette = ({ open, onClose }) => {
  const theme = useTheme();
  const { commands, recentCommands, executeCommand, addToRecent } =
    useCommandProvider();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [commandHistory, setCommandHistory] = useState([]);
  const searchInputRef = useRef(null);
  const listRef = useRef(null);

  // Fuzzy search implementation with ranking
  const fuzzySearch = useCallback(
    (items, query) => {
      if (!query.trim()) return items;

      const queryLower = query.toLowerCase();
      const queryChars = queryLower.split('');

      const scored = items.map(item => {
        const titleLower = item.title.toLowerCase();
        const descLower = (item.description || '').toLowerCase();
        const keywordsLower = (item.keywords || []).join(' ').toLowerCase();
        const allText = `${titleLower} ${descLower} ${keywordsLower}`;

        let score = 0;
        let queryIndex = 0;
        let lastMatchIndex = -1;
        let consecutive = 0;

        // Character matching with position weighting
        for (
          let i = 0;
          i < allText.length && queryIndex < queryChars.length;
          i++
        ) {
          if (allText[i] === queryChars[queryIndex]) {
            // Exact match bonus
            score += 10;

            // Position bonus (earlier matches score higher)
            score += Math.max(0, 10 - i * 0.1);

            // Consecutive character bonus
            if (i === lastMatchIndex + 1) {
              consecutive += 1;
              score += consecutive * 5;
            } else {
              consecutive = 0;
            }

            // Word boundary bonus
            if (i === 0 || allText[i - 1] === ' ') {
              score += 15;
            }

            lastMatchIndex = i;
            queryIndex++;
          }
        }

        // Penalty for incomplete matches
        if (queryIndex < queryChars.length) {
          score *= 0.5;
        }

        // Title match bonus
        if (titleLower.includes(queryLower)) {
          score += 20;
        }

        // Exact title match bonus
        if (titleLower === queryLower) {
          score += 50;
        }

        // Recent command bonus
        if (recentCommands.includes(item.id)) {
          score += 10;
        }

        return { ...item, score, matchQuery: query };
      });

      return scored
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score);
    },
    [recentCommands]
  );

  // Filter and search commands
  const filteredCommands = useMemo(() => {
    const availableCommands = currentCategory
      ? commands.filter(cmd => cmd.category === currentCategory)
      : commands;

    if (searchQuery.trim()) {
      return fuzzySearch(availableCommands, searchQuery);
    }

    // Show recent commands first when no search query
    const recent = recentCommands
      .map(id => commands.find(cmd => cmd.id === id))
      .filter(Boolean);

    const others = availableCommands.filter(
      cmd => !recentCommands.includes(cmd.id)
    );

    return [...recent, ...others];
  }, [commands, searchQuery, currentCategory, recentCommands, fuzzySearch]);

  // Command categories for filtering
  const categories = useMemo(() => {
    const cats = [...new Set(commands.map(cmd => cmd.category))];
    return cats.map(cat => ({
      name: cat,
      count: commands.filter(cmd => cmd.category === cat).length,
      icon: getCategoryIcon(cat),
    }));
  }, [commands]);

  // Get icon for category
  function getCategoryIcon(category) {
    const icons = {
      Navigation: DashboardIcon,
      Actions: BuildIcon,
      Search: SearchIcon,
      Customer: PeopleIcon,
      Reports: AssessmentIcon,
      Settings: SettingsIcon,
      File: FileOpenIcon,
    };
    return icons[category] || DashboardIcon;
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = e => {
      if (!open) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev =>
            prev < filteredCommands.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev =>
            prev > 0 ? prev - 1 : filteredCommands.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            handleCommandExecute(filteredCommands[selectedIndex]);
          }
          break;
        case 'Escape':
          if (currentCategory) {
            setCurrentCategory(null);
          } else {
            onClose();
          }
          break;
        case 'Backspace':
          if (!searchQuery && currentCategory) {
            setCurrentCategory(null);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    open,
    filteredCommands,
    selectedIndex,
    searchQuery,
    currentCategory,
    onClose,
  ]);

  // Reset state when opening
  useEffect(() => {
    if (open) {
      setSearchQuery('');
      setSelectedIndex(0);
      setCurrentCategory(null);
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [open]);

  // Auto-scroll selected item into view
  useEffect(() => {
    if (listRef.current && selectedIndex >= 0) {
      const selectedElement = listRef.current.children[selectedIndex];
      if (selectedElement) {
        selectedElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }
    }
  }, [selectedIndex]);

  // Execute command
  const handleCommandExecute = useCallback(
    async command => {
      try {
        addToRecent(command.id);
        setCommandHistory(prev => [
          ...prev,
          { ...command, executedAt: new Date() },
        ]);

        if (command.nested) {
          // Handle nested commands by setting category filter
          setCurrentCategory(command.category);
          setSearchQuery('');
          setSelectedIndex(0);
        } else {
          await executeCommand(command.id, command.args);
          onClose();
        }
      } catch (error) {
        console.error('Command execution failed:', error);
      }
    },
    [executeCommand, addToRecent, onClose]
  );

  // Highlight search terms in text
  const highlightText = (text, query) => {
    if (!query) return text;

    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <Box
          key={index}
          component='span'
          sx={{
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.primary.contrastText,
            borderRadius: 0.5,
            px: 0.5,
            fontWeight: 'bold',
          }}
        >
          {part}
        </Box>
      ) : (
        part
      )
    );
  };

  // Render command item
  const renderCommandItem = (command, index) => (
    <motion.div
      key={command.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{
        duration: 0.2,
        delay: index * 0.02,
        ease: [0.25, 0.8, 0.25, 1],
      }}
    >
      <ListItem
        button
        selected={index === selectedIndex}
        onClick={() => handleCommandExecute(command)}
        sx={{
          borderRadius: 2,
          mb: 0.5,
          px: 2,
          py: 1.5,
          backgroundColor:
            index === selectedIndex
              ? alpha(theme.palette.primary.main, 0.1)
              : 'transparent',
          border:
            index === selectedIndex
              ? `1px solid ${alpha(theme.palette.primary.main, 0.3)}`
              : '1px solid transparent',
          transition: 'all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1)',
          '&:hover': {
            backgroundColor: alpha(theme.palette.primary.main, 0.05),
            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            transform: 'translateX(4px)',
          },
        }}
      >
        <ListItemIcon sx={{ minWidth: 40 }}>
          <Avatar
            sx={{
              width: 32,
              height: 32,
              backgroundColor: command.color || theme.palette.primary.main,
              color: 'white',
            }}
          >
            <command.icon fontSize='small' />
          </Avatar>
        </ListItemIcon>

        <ListItemText
          primary={
            <Typography variant='body1' fontWeight={500}>
              {highlightText(command.title, searchQuery)}
            </Typography>
          }
          secondary={
            command.description && (
              <Typography variant='body2' color='textSecondary'>
                {highlightText(command.description, searchQuery)}
              </Typography>
            )
          }
        />

        <ListItemSecondaryAction>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {command.shortcut && (
              <Chip
                label={command.shortcut}
                size='small'
                variant='outlined'
                sx={{
                  fontSize: '0.75rem',
                  height: 24,
                  backgroundColor: alpha(theme.palette.background.paper, 0.8),
                  fontFamily: 'monospace',
                }}
              />
            )}

            {command.nested && (
              <ArrowRightIcon color='action' fontSize='small' />
            )}

            {recentCommands.includes(command.id) && (
              <StarIcon color='primary' fontSize='small' />
            )}
          </Box>
        </ListItemSecondaryAction>
      </ListItem>
    </motion.div>
  );

  return (
    <AnimatePresence>
      {open && (
        <Dialog
          open={open}
          onClose={onClose}
          maxWidth='sm'
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 4,
              background: `linear-gradient(135deg, 
                ${alpha(theme.palette.background.paper, 0.95)} 0%, 
                ${alpha(theme.palette.background.paper, 0.9)} 100%)`,
              backdropFilter: 'blur(20px)',
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              boxShadow: theme.shadows[24],
              overflow: 'hidden',
              maxHeight: '80vh',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 2,
                background: `linear-gradient(90deg, 
                  ${theme.palette.primary.main}, 
                  ${theme.palette.secondary.main}, 
                  ${theme.palette.primary.main})`,
              },
            },
          }}
          TransitionComponent={motion.div}
          TransitionProps={{
            initial: { opacity: 0, scale: 0.95, y: -20 },
            animate: {
              opacity: 1,
              scale: 1,
              y: 0,
              transition: {
                duration: 0.3,
                ease: [0.25, 0.8, 0.25, 1],
              },
            },
            exit: {
              opacity: 0,
              scale: 0.95,
              y: -20,
              transition: { duration: 0.2 },
            },
          }}
        >
          <DialogTitle sx={{ pb: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <SearchIcon color='primary' />
              <Typography variant='h6' fontWeight={600}>
                Command Palette
              </Typography>

              <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
                {currentCategory && (
                  <Chip
                    label={currentCategory}
                    size='small'
                    onDelete={() => setCurrentCategory(null)}
                    color='primary'
                  />
                )}

                <IconButton size='small' onClick={onClose}>
                  <CloseIcon />
                </IconButton>
              </Box>
            </Box>
          </DialogTitle>

          <DialogContent sx={{ px: 3, pb: 2 }}>
            {/* Search Input */}
            <TextField
              ref={searchInputRef}
              fullWidth
              variant='outlined'
              placeholder='Type a command or search...'
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setSelectedIndex(0);
              }}
              sx={{
                mb: 2,
                [`& .${inputBaseClasses.root}`]: {
                  borderRadius: 3,
                  backgroundColor: alpha(theme.palette.background.default, 0.5),
                  '&:hover': {
                    backgroundColor: alpha(
                      theme.palette.background.default,
                      0.7
                    ),
                  },
                  '&.Mui-focused': {
                    backgroundColor: alpha(
                      theme.palette.background.default,
                      0.8
                    ),
                    boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.3)}`,
                  },
                },
              }}
              InputProps={{
                startAdornment: (
                  <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                ),
                endAdornment: searchQuery && (
                  <IconButton
                    size='small'
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedIndex(0);
                    }}
                  >
                    <CloseIcon fontSize='small' />
                  </IconButton>
                ),
              }}
            />

            {/* Category Filters */}
            {!currentCategory && !searchQuery && (
              <Box sx={{ mb: 2 }}>
                <Typography
                  variant='subtitle2'
                  color='text.secondary'
                  sx={{ mb: 1 }}
                >
                  Categories
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {categories.map(category => {
                    const IconComponent = category.icon;
                    return (
                      <Chip
                        key={category.name}
                        label={`${category.name} (${category.count})`}
                        icon={<IconComponent fontSize='small' />}
                        onClick={() => setCurrentCategory(category.name)}
                        variant='outlined'
                        sx={{
                          borderRadius: 2,
                          '&:hover': {
                            backgroundColor: alpha(
                              theme.palette.primary.main,
                              0.1
                            ),
                            borderColor: theme.palette.primary.main,
                          },
                        }}
                      />
                    );
                  })}
                </Box>
              </Box>
            )}

            {/* Recent Commands */}
            {!searchQuery && !currentCategory && recentCommands.length > 0 && (
              <>
                <Box
                  sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}
                >
                  <HistoryIcon color='action' fontSize='small' />
                  <Typography variant='subtitle2' color='text.secondary'>
                    Recent Commands
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
              </>
            )}

            {/* Command List */}
            <List
              ref={listRef}
              sx={{
                maxHeight: 400,
                overflowY: 'auto',
                '&::-webkit-scrollbar': {
                  width: 6,
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: alpha(theme.palette.text.primary, 0.2),
                  borderRadius: 3,
                },
              }}
            >
              <AnimatePresence mode='wait'>
                {filteredCommands.length > 0 ? (
                  filteredCommands.map((command, index) =>
                    renderCommandItem(command, index)
                  )
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <Box
                      sx={{
                        textAlign: 'center',
                        py: 4,
                        color: 'text.secondary',
                      }}
                    >
                      <SearchIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                      <Typography variant='body1'>No commands found</Typography>
                      <Typography variant='body2'>
                        Try a different search term
                      </Typography>
                    </Box>
                  </motion.div>
                )}
              </AnimatePresence>
            </List>

            {/* Footer with shortcuts hint */}
            <Box
              sx={{
                mt: 2,
                pt: 2,
                borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Keyboard fontSize='small' color='action' />
                  <Typography variant='caption' color='text.secondary'>
                    ↑↓ navigate
                  </Typography>
                </Box>
                <Typography variant='caption' color='text.secondary'>
                  ↵ select
                </Typography>
                <Typography variant='caption' color='text.secondary'>
                  esc close
                </Typography>
              </Box>

              <Typography variant='caption' color='text.secondary'>
                {filteredCommands.length} commands
              </Typography>
            </Box>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
};

export default CommandPalette;
