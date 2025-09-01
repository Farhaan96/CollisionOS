import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import {
  Autocomplete,
  TextField,
  Box,
  Typography,
  Chip,
  Avatar,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Popper,
  Paper,
  Fade,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  IconButton,
  Tooltip,
  Badge,
  Card,
  CardContent,
} from '@mui/material';
import {
  Search,
  Add,
  History,
  Star,
  StarBorder,
  Clear,
  FilterList,
  TrendingUp,
  Group,
  Business,
  Person,
  Close,
  Check,
  Refresh,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { premiumDesignSystem } from '../../../theme/premiumDesignSystem';

// Fuzzy search implementation
const fuzzyMatch = (pattern, text) => {
  if (!pattern) return { score: 1, matches: [] };

  const patternLower = pattern.toLowerCase();
  const textLower = text.toLowerCase();

  if (textLower.includes(patternLower)) {
    const startIndex = textLower.indexOf(patternLower);
    return {
      score: 1 - startIndex / text.length,
      matches: [{ start: startIndex, end: startIndex + pattern.length }],
    };
  }

  let patternIndex = 0;
  let score = 0;
  const matches = [];

  for (
    let i = 0;
    i < textLower.length && patternIndex < patternLower.length;
    i++
  ) {
    if (textLower[i] === patternLower[patternIndex]) {
      matches.push({ start: i, end: i + 1 });
      score += 1 / text.length;
      patternIndex++;
    }
  }

  return patternIndex === patternLower.length
    ? { score, matches }
    : { score: 0, matches: [] };
};

// Highlight matched text
const HighlightedText = ({ text, matches = [] }) => {
  if (!matches.length) return text;

  let lastEnd = 0;
  const parts = [];

  matches.forEach((match, index) => {
    if (match.start > lastEnd) {
      parts.push(text.slice(lastEnd, match.start));
    }
    parts.push(
      <Box
        key={index}
        component='span'
        sx={{
          backgroundColor: premiumDesignSystem.colors.primary[100],
          color: premiumDesignSystem.colors.primary[800],
          fontWeight: 600,
          padding: '2px 4px',
          borderRadius: 1,
        }}
      >
        {text.slice(match.start, match.end)}
      </Box>
    );
    lastEnd = match.end;
  });

  if (lastEnd < text.length) {
    parts.push(text.slice(lastEnd));
  }

  return <Box component='span'>{parts}</Box>;
};

const SmartAutocomplete = ({
  label = 'Search',
  placeholder = 'Type to search...',
  value = null,
  onChange = () => {},
  onInputChange = () => {},
  options = [],
  asyncDataLoader = null,
  multiple = false,
  freeSolo = false,
  enableCreateNew = false,
  enableRecentSelections = true,
  enableFavorites = false,
  maxRecentSelections = 10,
  groupBy = null,
  renderOption = null,
  renderGroup = null,
  renderTags = null,
  getOptionLabel = option => option?.label || option?.name || String(option),
  getOptionValue = option => option?.value || option?.id || option,
  isOptionEqualToValue = (option, value) =>
    getOptionValue(option) === getOptionValue(value),
  filterOptions = null,
  loading = false,
  disabled = false,
  error = null,
  helperText = null,
  required = false,
  clearOnBlur = false,
  minSearchLength = 0,
  debounceMs = 300,
  maxOptions = 100,
  enableGroupToggle = false,
  groupCollapsible = false,
  icon = <Search />,
  sx = {},
  ...props
}) => {
  // State management
  const [inputValue, setInputValue] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [recentSelections, setRecentSelections] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newOptionData, setNewOptionData] = useState({});
  const [collapsedGroups, setCollapsedGroups] = useState(new Set());
  const [searchHistory, setSearchHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // Refs
  const debounceTimeoutRef = useRef(null);
  const abortControllerRef = useRef(null);
  const previousSearchRef = useRef('');

  // Load recent selections from localStorage
  useEffect(() => {
    if (!enableRecentSelections) return;

    try {
      const stored = localStorage.getItem(`autocomplete-recent-${label}`);
      if (stored) {
        setRecentSelections(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load recent selections:', error);
    }
  }, [label, enableRecentSelections]);

  // Load favorites from localStorage
  useEffect(() => {
    if (!enableFavorites) return;

    try {
      const stored = localStorage.getItem(`autocomplete-favorites-${label}`);
      if (stored) {
        setFavorites(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load favorites:', error);
    }
  }, [label, enableFavorites]);

  // Save recent selections to localStorage
  const saveRecentSelection = useCallback(
    selection => {
      if (!enableRecentSelections) return;

      const newRecent = [
        selection,
        ...recentSelections.filter(
          item => getOptionValue(item) !== getOptionValue(selection)
        ),
      ].slice(0, maxRecentSelections);

      setRecentSelections(newRecent);

      try {
        localStorage.setItem(
          `autocomplete-recent-${label}`,
          JSON.stringify(newRecent)
        );
      } catch (error) {
        console.error('Failed to save recent selection:', error);
      }
    },
    [
      enableRecentSelections,
      recentSelections,
      maxRecentSelections,
      label,
      getOptionValue,
    ]
  );

  // Toggle favorite
  const toggleFavorite = useCallback(
    option => {
      if (!enableFavorites) return;

      const optionValue = getOptionValue(option);
      const isFavorite = favorites.some(
        fav => getOptionValue(fav) === optionValue
      );

      const newFavorites = isFavorite
        ? favorites.filter(fav => getOptionValue(fav) !== optionValue)
        : [...favorites, option];

      setFavorites(newFavorites);

      try {
        localStorage.setItem(
          `autocomplete-favorites-${label}`,
          JSON.stringify(newFavorites)
        );
      } catch (error) {
        console.error('Failed to save favorites:', error);
      }
    },
    [enableFavorites, favorites, getOptionValue, label]
  );

  // Async data loading with debounce
  const loadAsyncData = useCallback(
    async searchTerm => {
      if (!asyncDataLoader || searchTerm.length < minSearchLength) {
        setSearchResults([]);
        return;
      }

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      setIsLoading(true);

      try {
        const results = await asyncDataLoader(searchTerm, {
          signal: abortControllerRef.current.signal,
          maxResults: maxOptions,
        });

        setSearchResults(Array.isArray(results) ? results : []);
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Async data loading failed:', error);
          setSearchResults([]);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [asyncDataLoader, minSearchLength, maxOptions]
  );

  // Debounced search
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    if (inputValue !== previousSearchRef.current) {
      debounceTimeoutRef.current = setTimeout(() => {
        loadAsyncData(inputValue);
        previousSearchRef.current = inputValue;

        // Add to search history
        if (inputValue.trim() && inputValue.length >= minSearchLength) {
          setSearchHistory(prev =>
            [inputValue, ...prev.filter(term => term !== inputValue)].slice(
              0,
              10
            )
          );
        }
      }, debounceMs);
    }

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [inputValue, loadAsyncData, debounceMs, minSearchLength]);

  // Combined options with fuzzy search
  const filteredOptions = useMemo(() => {
    let combinedOptions = [];

    if (asyncDataLoader) {
      combinedOptions = searchResults;
    } else {
      // Use provided options with fuzzy search
      if (inputValue.length >= minSearchLength) {
        combinedOptions = options
          .map(option => {
            const label = getOptionLabel(option);
            const match = fuzzyMatch(inputValue, label);
            return { ...option, _match: match };
          })
          .filter(option => option._match.score > 0)
          .sort((a, b) => b._match.score - a._match.score);
      } else {
        combinedOptions = options;
      }
    }

    // Add recent selections at the top if no search term
    if (!inputValue && enableRecentSelections && recentSelections.length > 0) {
      const recentWithLabel = recentSelections.map(item => ({
        ...item,
        _isRecent: true,
      }));
      combinedOptions = [
        ...recentWithLabel,
        ...combinedOptions.filter(
          option =>
            !recentSelections.some(
              recent => getOptionValue(recent) === getOptionValue(option)
            )
        ),
      ];
    }

    // Add favorites at the top
    if (enableFavorites && favorites.length > 0) {
      const favoritesWithLabel = favorites.map(item => ({
        ...item,
        _isFavorite: true,
      }));
      combinedOptions = [
        ...favoritesWithLabel,
        ...combinedOptions.filter(
          option =>
            !favorites.some(
              fav => getOptionValue(fav) === getOptionValue(option)
            )
        ),
      ];
    }

    return combinedOptions.slice(0, maxOptions);
  }, [
    asyncDataLoader,
    searchResults,
    options,
    inputValue,
    minSearchLength,
    getOptionLabel,
    enableRecentSelections,
    recentSelections,
    enableFavorites,
    favorites,
    getOptionValue,
    maxOptions,
  ]);

  // Group options if groupBy is provided
  const groupedOptions = useMemo(() => {
    if (!groupBy) return { ungrouped: filteredOptions };

    return filteredOptions.reduce((groups, option) => {
      const groupKey =
        typeof groupBy === 'function' ? groupBy(option) : option[groupBy];
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(option);
      return groups;
    }, {});
  }, [filteredOptions, groupBy]);

  // Handle selection change
  const handleChange = useCallback(
    (event, newValue, reason) => {
      onChange(newValue, reason);

      if (newValue && !multiple) {
        saveRecentSelection(newValue);
      } else if (newValue && multiple && Array.isArray(newValue)) {
        const lastSelected = newValue[newValue.length - 1];
        if (lastSelected) {
          saveRecentSelection(lastSelected);
        }
      }
    },
    [onChange, multiple, saveRecentSelection]
  );

  // Handle input change
  const handleInputChange = useCallback(
    (event, newInputValue, reason) => {
      setInputValue(newInputValue);
      onInputChange(newInputValue, reason);
    },
    [onInputChange]
  );

  // Create new option
  const handleCreateNew = useCallback(async () => {
    if (!enableCreateNew || !inputValue.trim()) return;

    setShowCreateDialog(true);
    setNewOptionData({ label: inputValue.trim() });
  }, [enableCreateNew, inputValue]);

  // Confirm create new option
  const confirmCreateNew = useCallback(() => {
    const newOption = {
      id: Date.now().toString(),
      label: newOptionData.label || inputValue.trim(),
      value: newOptionData.value || newOptionData.label || inputValue.trim(),
      ...newOptionData,
      _isNew: true,
    };

    if (multiple) {
      onChange([...(value || []), newOption]);
    } else {
      onChange(newOption);
    }

    setShowCreateDialog(false);
    setNewOptionData({});
    setInputValue('');
  }, [newOptionData, inputValue, multiple, value, onChange]);

  // Custom option renderer
  const defaultRenderOption = useCallback(
    (props, option, { selected }) => {
      const label = getOptionLabel(option);
      const matches = option._match?.matches || [];
      const isFavorite =
        enableFavorites &&
        favorites.some(fav => getOptionValue(fav) === getOptionValue(option));

      return (
        <ListItem
          {...props}
          key={getOptionValue(option)}
          sx={{
            '&:hover': {
              backgroundColor: 'action.hover',
            },
            ...(option._isRecent && {
              backgroundColor: 'primary.50',
              borderLeft: 4,
              borderLeftColor: 'primary.main',
            }),
            ...(option._isFavorite && {
              backgroundColor: 'warning.50',
              borderLeft: 4,
              borderLeftColor: 'warning.main',
            }),
          }}
        >
          <ListItemText
            primary={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <HighlightedText text={label} matches={matches} />
                {option._isRecent && (
                  <Chip
                    size='small'
                    label='Recent'
                    color='primary'
                    variant='outlined'
                    sx={{ height: 20, fontSize: '0.7rem' }}
                  />
                )}
                {option._isFavorite && (
                  <Chip
                    size='small'
                    label='Favorite'
                    color='warning'
                    variant='outlined'
                    sx={{ height: 20, fontSize: '0.7rem' }}
                  />
                )}
              </Box>
            }
            secondary={option.description}
          />

          {enableFavorites && (
            <IconButton
              size='small'
              onClick={e => {
                e.stopPropagation();
                toggleFavorite(option);
              }}
              sx={{ ml: 1 }}
            >
              {isFavorite ? <Star color='warning' /> : <StarBorder />}
            </IconButton>
          )}
        </ListItem>
      );
    },
    [getOptionLabel, enableFavorites, favorites, getOptionValue, toggleFavorite]
  );

  // Custom group renderer
  const defaultRenderGroup = useCallback(
    params => {
      const isCollapsed = collapsedGroups.has(params.group);

      return (
        <Box key={params.group}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 1,
              backgroundColor: 'grey.100',
              cursor: groupCollapsible ? 'pointer' : 'default',
            }}
            onClick={
              groupCollapsible
                ? () => {
                    setCollapsedGroups(prev => {
                      const newSet = new Set(prev);
                      if (isCollapsed) {
                        newSet.delete(params.group);
                      } else {
                        newSet.add(params.group);
                      }
                      return newSet;
                    });
                  }
                : undefined
            }
          >
            <Typography variant='subtitle2' sx={{ fontWeight: 600 }}>
              {params.group}
            </Typography>
            <Chip
              size='small'
              label={params.children.length}
              color='primary'
              variant='outlined'
            />
          </Box>

          <Collapse in={!isCollapsed}>
            <Box>{params.children}</Box>
          </Collapse>
        </Box>
      );
    },
    [collapsedGroups, groupCollapsible]
  );

  return (
    <Box sx={{ position: 'relative', ...sx }}>
      <Autocomplete
        {...props}
        value={value}
        inputValue={inputValue}
        onChange={handleChange}
        onInputChange={handleInputChange}
        options={filteredOptions}
        loading={isLoading || loading}
        disabled={disabled}
        multiple={multiple}
        freeSolo={freeSolo}
        clearOnBlur={clearOnBlur}
        getOptionLabel={getOptionLabel}
        isOptionEqualToValue={isOptionEqualToValue}
        filterOptions={filterOptions || (x => x)} // We handle filtering ourselves
        groupBy={groupBy}
        renderOption={renderOption || defaultRenderOption}
        renderGroup={renderGroup || (groupBy ? defaultRenderGroup : undefined)}
        renderTags={renderTags}
        PopperComponent={({ children, ...popperProps }) => (
          <Popper
            {...popperProps}
            sx={{
              '& .MuiAutocomplete-paper': {
                boxShadow: premiumDesignSystem.shadows.glass.elevated,
                backdropFilter: 'blur(20px)',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
              },
            }}
          >
            <Fade in timeout={200}>
              <Paper>
                {children}

                {/* Create new option */}
                {enableCreateNew &&
                  inputValue &&
                  !filteredOptions.some(
                    option =>
                      getOptionLabel(option).toLowerCase() ===
                      inputValue.toLowerCase()
                  ) && (
                    <>
                      <Divider />
                      <ListItem
                        button
                        onClick={handleCreateNew}
                        sx={{
                          color: 'primary.main',
                          '&:hover': { backgroundColor: 'primary.50' },
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ backgroundColor: 'primary.main' }}>
                            <Add />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={`Create "${inputValue}"`}
                          secondary='Add this as a new option'
                        />
                      </ListItem>
                    </>
                  )}

                {/* Search history */}
                {searchHistory.length > 0 && !inputValue && (
                  <>
                    <Divider />
                    <Box sx={{ p: 1 }}>
                      <Typography variant='caption' color='text.secondary'>
                        Recent searches:
                      </Typography>
                      <Box
                        sx={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: 0.5,
                          mt: 0.5,
                        }}
                      >
                        {searchHistory.slice(0, 5).map((term, index) => (
                          <Chip
                            key={index}
                            size='small'
                            label={term}
                            onClick={() => setInputValue(term)}
                            sx={{ fontSize: '0.7rem' }}
                          />
                        ))}
                      </Box>
                    </Box>
                  </>
                )}
              </Paper>
            </Fade>
          </Popper>
        )}
        renderInput={params => (
          <TextField
            {...params}
            label={label}
            placeholder={placeholder}
            error={!!error}
            helperText={error || helperText}
            required={required}
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                  {icon}
                  {params.InputProps.startAdornment}
                </Box>
              ),
              endAdornment: (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {isLoading && <CircularProgress size={20} />}
                  {enableRecentSelections && recentSelections.length > 0 && (
                    <Tooltip title='Recent selections'>
                      <IconButton
                        size='small'
                        onClick={() => setShowHistory(!showHistory)}
                      >
                        <Badge
                          badgeContent={recentSelections.length}
                          max={9}
                          color='primary'
                        >
                          <History />
                        </Badge>
                      </IconButton>
                    </Tooltip>
                  )}
                  {asyncDataLoader && (
                    <Tooltip title='Refresh'>
                      <IconButton
                        size='small'
                        onClick={() => loadAsyncData(inputValue)}
                      >
                        <Refresh />
                      </IconButton>
                    </Tooltip>
                  )}
                  {params.InputProps.endAdornment}
                </Box>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
                background: 'rgba(255, 255, 255, 0.9)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 1)',
                  transform: 'translateY(-1px)',
                  boxShadow: premiumDesignSystem.shadows.glass.medium,
                },
                '&.Mui-focused': {
                  backgroundColor: 'rgba(255, 255, 255, 1)',
                  transform: 'translateY(-2px)',
                  boxShadow: premiumDesignSystem.shadows.colored.primary,
                },
              },
            }}
          />
        )}
      />

      {/* Recent selections dropdown */}
      <Collapse in={showHistory}>
        <Card
          sx={{
            mt: 1,
            position: 'absolute',
            top: '100%',
            width: '100%',
            zIndex: 1300,
          }}
        >
          <CardContent>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'between',
                alignItems: 'center',
                mb: 1,
              }}
            >
              <Typography variant='subtitle2'>Recent Selections</Typography>
              <IconButton size='small' onClick={() => setShowHistory(false)}>
                <Close />
              </IconButton>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {recentSelections.slice(0, 5).map((item, index) => (
                <Chip
                  key={index}
                  label={getOptionLabel(item)}
                  onClick={() => {
                    if (multiple) {
                      onChange([...(value || []), item]);
                    } else {
                      onChange(item);
                    }
                    setShowHistory(false);
                  }}
                  sx={{ justifyContent: 'flex-start' }}
                />
              ))}
            </Box>
          </CardContent>
        </Card>
      </Collapse>

      {/* Create new option dialog */}
      <Dialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>Create New Option</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label='Label'
              value={newOptionData.label || inputValue}
              onChange={e =>
                setNewOptionData(prev => ({ ...prev, label: e.target.value }))
              }
              fullWidth
            />

            <TextField
              label='Value'
              value={newOptionData.value || newOptionData.label || inputValue}
              onChange={e =>
                setNewOptionData(prev => ({ ...prev, value: e.target.value }))
              }
              fullWidth
            />

            <TextField
              label='Description (optional)'
              value={newOptionData.description || ''}
              onChange={e =>
                setNewOptionData(prev => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              fullWidth
              multiline
              rows={2}
            />
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setShowCreateDialog(false)}>Cancel</Button>
          <Button
            onClick={confirmCreateNew}
            variant='contained'
            startIcon={<Check />}
            disabled={!newOptionData.label && !inputValue.trim()}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SmartAutocomplete;
