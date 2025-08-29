import React, { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Grid,
  Card,
  IconButton,
  Tooltip,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  Button,
  Switch,
  FormControlLabel,
  Typography,
  Fab,
  Zoom,
  CircularProgress,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  DragIndicator,
  Fullscreen,
  FullscreenExit,
  Refresh,
  Settings,
  Visibility,
  VisibilityOff,
  Add,
  GridView,
  ViewModule,
  Dashboard as DashboardIcon
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { motion, AnimatePresence } from 'framer-motion';

// Utils
import { getGlassStyles, glassHoverEffects } from '../../utils/glassTheme';
import { microAnimations, springConfigs } from '../../utils/animations';
import { useTheme as useAppTheme } from '../../contexts/ThemeContext';

const WidgetGrid = ({ 
  widgets, 
  onWidgetUpdate, 
  onLayoutChange,
  onWidgetRefresh,
  onAddWidget,
  layout = 'grid',
  isEditing = false
}) => {
  const theme = useTheme();
  const { mode } = useAppTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));

  const [fullscreenWidget, setFullscreenWidget] = useState(null);
  const [widgetSettings, setWidgetSettings] = useState(null);
  const [refreshingWidgets, setRefreshingWidgets] = useState(new Set());
  const [widgetVisibility, setWidgetVisibility] = useState({});

  // Initialize widget visibility
  React.useEffect(() => {
    const initialVisibility = {};
    widgets.forEach(widget => {
      initialVisibility[widget.id] = widget.visible !== false;
    });
    setWidgetVisibility(initialVisibility);
  }, [widgets]);

  // Handle drag end
  const onDragEnd = useCallback((result) => {
    if (!result.destination) return;

    const newWidgets = Array.from(widgets);
    const [reorderedWidget] = newWidgets.splice(result.source.index, 1);
    newWidgets.splice(result.destination.index, 0, reorderedWidget);

    onLayoutChange?.(newWidgets);
  }, [widgets, onLayoutChange]);

  // Handle widget refresh
  const handleRefreshWidget = useCallback(async (widgetId) => {
    setRefreshingWidgets(prev => new Set([...prev, widgetId]));
    
    try {
      await onWidgetRefresh?.(widgetId);
    } finally {
      setTimeout(() => {
        setRefreshingWidgets(prev => {
          const newSet = new Set([...prev]);
          newSet.delete(widgetId);
          return newSet;
        });
      }, 1000);
    }
  }, [onWidgetRefresh]);

  // Handle fullscreen toggle
  const handleFullscreen = useCallback((widget) => {
    setFullscreenWidget(fullscreenWidget?.id === widget.id ? null : widget);
  }, [fullscreenWidget]);

  // Handle widget visibility toggle
  const handleVisibilityToggle = useCallback((widgetId) => {
    setWidgetVisibility(prev => ({
      ...prev,
      [widgetId]: !prev[widgetId]
    }));
    
    const widget = widgets.find(w => w.id === widgetId);
    if (widget) {
      onWidgetUpdate?.(widgetId, { ...widget, visible: !widgetVisibility[widgetId] });
    }
  }, [widgets, widgetVisibility, onWidgetUpdate]);

  // Get widget grid size based on widget type and screen size
  const getWidgetSize = useCallback((widget) => {
    if (isMobile) {
      return { xs: 12, sm: 12, md: 12 };
    }

    const sizeMap = {
      small: { xs: 12, sm: 6, md: 4, lg: 3 },
      medium: { xs: 12, sm: 6, md: 6, lg: 4 },
      large: { xs: 12, sm: 12, md: 8, lg: 6 },
      wide: { xs: 12, sm: 12, md: 12, lg: 8 },
      tall: { xs: 12, sm: 6, md: 4, lg: 3 }
    };

    return sizeMap[widget.size] || sizeMap.medium;
  }, [isMobile]);

  // Widget wrapper component
  const WidgetWrapper = ({ widget, index, isDragging }) => {
    const isRefreshing = refreshingWidgets.has(widget.id);
    const isVisible = widgetVisibility[widget.id];

    if (!isVisible && !isEditing) return null;

    return (
      <Grid item {...getWidgetSize(widget)} key={widget.id}>
        <motion.div
          layout
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ 
            opacity: isVisible || isEditing ? 1 : 0.3, 
            scale: 1,
            filter: isDragging ? 'blur(2px)' : 'none'
          }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={springConfigs.gentle}
          whileHover={!isDragging ? { y: -4 } : {}}
        >
          <Card
            sx={{
              height: widget.height || 'auto',
              minHeight: widget.minHeight || 200,
              position: 'relative',
              ...getGlassStyles(widget.variant || 'default', mode),
              ...(!isDragging && glassHoverEffects(mode, 2)),
              border: isDragging ? `2px dashed ${theme.palette.primary.main}` : undefined,
              transform: isDragging ? 'rotate(2deg)' : 'none',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              overflow: 'hidden'
            }}
          >
            {/* Widget Controls */}
            <Box
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                zIndex: 10,
                display: 'flex',
                gap: 0.5,
                opacity: isEditing ? 1 : 0,
                '&:hover': { opacity: 1 },
                transition: 'opacity 0.2s ease-in-out',
                background: 'rgba(0, 0, 0, 0.1)',
                backdropFilter: 'blur(10px)',
                borderRadius: 2,
                p: 0.5
              }}
            >
              {isEditing && (
                <Tooltip title="Drag to reorder">
                  <IconButton
                    size="small"
                    sx={{
                      cursor: 'grab',
                      '&:active': { cursor: 'grabbing' },
                      color: 'text.secondary'
                    }}
                  >
                    <DragIndicator fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}

              <Tooltip title={isVisible ? 'Hide widget' : 'Show widget'}>
                <IconButton
                  size="small"
                  onClick={() => handleVisibilityToggle(widget.id)}
                  sx={{ color: 'text.secondary' }}
                >
                  {isVisible ? <Visibility fontSize="small" /> : <VisibilityOff fontSize="small" />}
                </IconButton>
              </Tooltip>

              <Tooltip title="Refresh widget">
                <IconButton
                  size="small"
                  onClick={() => handleRefreshWidget(widget.id)}
                  disabled={isRefreshing}
                  sx={{ color: 'text.secondary' }}
                >
                  {isRefreshing ? (
                    <CircularProgress size={16} />
                  ) : (
                    <Refresh fontSize="small" />
                  )}
                </IconButton>
              </Tooltip>

              <Tooltip title="Widget settings">
                <IconButton
                  size="small"
                  onClick={() => setWidgetSettings(widget)}
                  sx={{ color: 'text.secondary' }}
                >
                  <Settings fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title="Fullscreen">
                <IconButton
                  size="small"
                  onClick={() => handleFullscreen(widget)}
                  sx={{ color: 'text.secondary' }}
                >
                  <Fullscreen fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>

            {/* Widget Content */}
            <Box
              sx={{
                height: '100%',
                opacity: isRefreshing ? 0.6 : 1,
                transition: 'opacity 0.3s ease-in-out',
                position: 'relative'
              }}
            >
              {widget.component}
              
              {isRefreshing && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(5px)'
                  }}
                >
                  <CircularProgress />
                </Box>
              )}
            </Box>
          </Card>
        </motion.div>
      </Grid>
    );
  };

  const visibleWidgets = useMemo(() => 
    widgets.filter(widget => widgetVisibility[widget.id] || isEditing),
    [widgets, widgetVisibility, isEditing]
  );

  return (
    <>
      {/* Grid Layout */}
      {layout === 'grid' ? (
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="widget-grid" direction="horizontal">
            {(provided, snapshot) => (
              <Box
                ref={provided.innerRef}
                {...provided.droppableProps}
                sx={{
                  minHeight: 200,
                  borderRadius: 2,
                  border: snapshot.isDraggingOver ? `2px dashed ${theme.palette.primary.main}` : 'none',
                  background: snapshot.isDraggingOver ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
                  transition: 'all 0.3s ease-in-out'
                }}
              >
                <Grid container spacing={3}>
                  <AnimatePresence>
                    {visibleWidgets.map((widget, index) => (
                      <Draggable 
                        key={widget.id} 
                        draggableId={widget.id} 
                        index={index}
                        isDragDisabled={!isEditing}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={{
                              ...provided.draggableProps.style,
                              width: '100%'
                            }}
                          >
                            <WidgetWrapper 
                              widget={widget} 
                              index={index}
                              isDragging={snapshot.isDragging}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                  </AnimatePresence>
                  {provided.placeholder}
                </Grid>
              </Box>
            )}
          </Droppable>
        </DragDropContext>
      ) : (
        // List Layout
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <AnimatePresence>
            {visibleWidgets.map((widget, index) => (
              <motion.div
                key={widget.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <WidgetWrapper widget={widget} index={index} />
              </motion.div>
            ))}
          </AnimatePresence>
        </Box>
      )}

      {/* Add Widget FAB */}
      {isEditing && (
        <Zoom in timeout={300}>
          <Fab
            color="primary"
            aria-label="add widget"
            onClick={onAddWidget}
            sx={{
              position: 'fixed',
              bottom: 80,
              right: 24,
              background: 'linear-gradient(135deg, #1e40af 0%, #10b981 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #1e3a8a 0%, #059669 100%)',
                transform: 'scale(1.1)'
              }
            }}
          >
            <Add />
          </Fab>
        </Zoom>
      )}

      {/* Fullscreen Dialog */}
      <Dialog
        fullScreen
        open={!!fullscreenWidget}
        onClose={() => setFullscreenWidget(null)}
        PaperProps={{
          sx: {
            background: mode === 'dark' ? 
              'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' :
              'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
            backdropFilter: 'blur(20px)'
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          background: 'rgba(0, 0, 0, 0.05)',
          backdropFilter: 'blur(10px)'
        }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {fullscreenWidget?.title || 'Widget'}
          </Typography>
          <IconButton
            edge="end"
            color="inherit"
            onClick={() => setFullscreenWidget(null)}
            aria-label="close"
          >
            <FullscreenExit />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0, height: '100%' }}>
          {fullscreenWidget?.component}
        </DialogContent>
      </Dialog>

      {/* Widget Settings Dialog */}
      <Dialog
        open={!!widgetSettings}
        onClose={() => setWidgetSettings(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            ...getGlassStyles('elevated', mode),
            backdropFilter: 'blur(20px)'
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>
          Widget Settings: {widgetSettings?.title}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ py: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={widgetVisibility[widgetSettings?.id] || false}
                  onChange={() => widgetSettings && handleVisibilityToggle(widgetSettings.id)}
                />
              }
              label="Visible"
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Additional widget-specific settings would go here based on the widget type.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWidgetSettings(null)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={() => setWidgetSettings(null)}
            sx={{
              background: 'linear-gradient(135deg, #1e40af 0%, #10b981 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #1e3a8a 0%, #059669 100%)'
              }
            }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default WidgetGrid;