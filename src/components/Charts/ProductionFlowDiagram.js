import React, { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Card,
  LinearProgress,
  Badge,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Popover,
  Avatar,
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Warning,
  CheckCircle,
  Error,
  Info,
  Settings,
  Refresh,
  Speed,
  Timeline,
  People,
  Build,
  LocalShipping,
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { motion, AnimatePresence } from 'framer-motion';
import { premiumDesignSystem } from '../../theme/premiumDesignSystem';

// Flow stage icons mapping
const stageIcons = {
  intake: <LocalShipping />,
  assessment: <Build />,
  parts: <Info />,
  painting: <PlayArrow />,
  bodywork: <Build />,
  assembly: <Settings />,
  quality: <CheckCircle />,
  delivery: <LocalShipping />,
};

// Status configurations
const statusConfig = {
  'on-track': {
    color: premiumDesignSystem.colors.semantic.success.main,
    bgColor: premiumDesignSystem.colors.semantic.success.light,
    label: 'On Track',
    icon: <CheckCircle />,
  },
  'at-risk': {
    color: premiumDesignSystem.colors.semantic.warning.main,
    bgColor: premiumDesignSystem.colors.semantic.warning.light,
    label: 'At Risk',
    icon: <Warning />,
  },
  delayed: {
    color: premiumDesignSystem.colors.semantic.error.main,
    bgColor: premiumDesignSystem.colors.semantic.error.light,
    label: 'Delayed',
    icon: <Error />,
  },
  idle: {
    color: premiumDesignSystem.colors.neutral[500],
    bgColor: premiumDesignSystem.colors.neutral[100],
    label: 'Idle',
    icon: <Pause />,
  },
  active: {
    color: premiumDesignSystem.colors.primary[500],
    bgColor: premiumDesignSystem.colors.primary[50],
    label: 'Active',
    icon: <PlayArrow />,
  },
};

// Flow indicator animation component
const FlowIndicator = ({ isActive, color, size = 8 }) => (
  <motion.div
    animate={{
      scale: isActive ? [1, 1.2, 1] : 1,
      opacity: isActive ? [0.5, 1, 0.5] : 0.3,
    }}
    transition={{
      duration: 2,
      repeat: isActive ? Infinity : 0,
      ease: 'easeInOut',
    }}
    style={{
      width: size,
      height: size,
      borderRadius: '50%',
      backgroundColor: color,
      margin: '0 2px',
    }}
  />
);

// Flow connection component
const FlowConnection = ({ isActive, progress = 0, bottleneck = false }) => (
  <Box
    sx={{
      flex: 1,
      height: 4,
      mx: 1,
      position: 'relative',
      backgroundColor: premiumDesignSystem.colors.neutral[200],
      borderRadius: 2,
      overflow: 'hidden',
    }}
  >
    {/* Progress indicator */}
    <motion.div
      initial={{ width: '0%' }}
      animate={{ width: `${progress}%` }}
      transition={{ duration: 1, ease: 'easeOut' }}
      style={{
        height: '100%',
        background: bottleneck
          ? premiumDesignSystem.colors.semantic.error.gradient
          : premiumDesignSystem.colors.primary.gradient.default,
        borderRadius: 2,
      }}
    />

    {/* Flow indicators */}
    {isActive && (
      <Box
        sx={{
          position: 'absolute',
          top: -4,
          left: 0,
          right: 0,
          height: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-evenly',
        }}
      >
        {[...Array(5)].map((_, i) => (
          <FlowIndicator
            key={i}
            isActive={isActive}
            color={
              bottleneck
                ? premiumDesignSystem.colors.semantic.error.main
                : premiumDesignSystem.colors.primary[400]
            }
            size={bottleneck ? 10 : 8}
          />
        ))}
      </Box>
    )}
  </Box>
);

// Production stage card component
const ProductionStage = ({
  stage,
  index,
  isDragging,
  onStageClick,
  onCapacityClick,
}) => {
  const [anchorEl, setAnchorEl] = useState(null);

  const status = statusConfig[stage.status] || statusConfig['idle'];
  const utilizationPercentage = Math.round(
    (stage.currentLoad / stage.capacity) * 100
  );

  const handlePopoverOpen = useCallback(event => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handlePopoverClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const isBottleneck = stage.bottleneck || utilizationPercentage > 90;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        whileHover={{ y: -2, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Card
          sx={{
            p: 2,
            minWidth: 180,
            maxWidth: 200,
            background: `${premiumDesignSystem.colors.glass.white[10]}`,
            backdropFilter: premiumDesignSystem.effects.backdrop.md,
            border: `2px solid ${
              isDragging
                ? premiumDesignSystem.colors.primary[300]
                : isBottleneck
                  ? premiumDesignSystem.colors.semantic.error.main
                  : premiumDesignSystem.colors.glass.white[20]
            }`,
            borderRadius: premiumDesignSystem.borderRadius.lg,
            boxShadow: isDragging
              ? premiumDesignSystem.shadows.colored.primary
              : isBottleneck
                ? premiumDesignSystem.shadows.colored.error
                : premiumDesignSystem.shadows.glass.medium,
            cursor: 'pointer',
            transition: premiumDesignSystem.animations.transitions.all,
            position: 'relative',
            overflow: 'visible',
          }}
          onClick={() => onStageClick?.(stage)}
          onMouseEnter={handlePopoverOpen}
          onMouseLeave={handlePopoverClose}
        >
          {/* Bottleneck indicator */}
          {isBottleneck && (
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              style={{
                position: 'absolute',
                top: -8,
                right: -8,
                zIndex: 10,
              }}
            >
              <Badge
                badgeContent={<Warning sx={{ fontSize: 14 }} />}
                sx={{
                  '& .MuiBadge-badge': {
                    backgroundColor:
                      premiumDesignSystem.colors.semantic.error.main,
                    color: '#fff',
                    minWidth: 24,
                    height: 24,
                    borderRadius: '50%',
                  },
                }}
              />
            </motion.div>
          )}

          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
            <Avatar
              sx={{
                width: 32,
                height: 32,
                backgroundColor: `${status.color}20`,
                color: status.color,
                mr: 1,
              }}
            >
              {stageIcons[stage.type] || <Build />}
            </Avatar>
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography
                variant='subtitle2'
                sx={{
                  fontWeight:
                    premiumDesignSystem.typography.fontWeight.semibold,
                  color: premiumDesignSystem.colors.neutral[800],
                  fontSize: premiumDesignSystem.typography.fontSize.sm,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {stage.name}
              </Typography>
            </Box>
          </Box>

          {/* Status chip */}
          <Chip
            icon={status.icon}
            label={status.label}
            size='small'
            sx={{
              backgroundColor: status.bgColor,
              color: status.color,
              fontSize: '0.75rem',
              height: 24,
              mb: 1.5,
              '& .MuiChip-icon': {
                fontSize: 14,
              },
            }}
          />

          {/* Capacity utilization */}
          <Box sx={{ mb: 1 }}>
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}
            >
              <Typography
                variant='caption'
                sx={{
                  color: premiumDesignSystem.colors.neutral[600],
                  fontSize: '0.7rem',
                }}
              >
                Capacity
              </Typography>
              <Typography
                variant='caption'
                sx={{
                  color: isBottleneck
                    ? premiumDesignSystem.colors.semantic.error.main
                    : premiumDesignSystem.colors.neutral[700],
                  fontWeight:
                    premiumDesignSystem.typography.fontWeight.semibold,
                  fontSize: '0.7rem',
                }}
              >
                {utilizationPercentage}%
              </Typography>
            </Box>
            <LinearProgress
              variant='determinate'
              value={utilizationPercentage}
              sx={{
                height: 6,
                borderRadius: 3,
                backgroundColor: premiumDesignSystem.colors.neutral[200],
                '& .MuiLinearProgress-bar': {
                  backgroundColor:
                    utilizationPercentage > 90
                      ? premiumDesignSystem.colors.semantic.error.main
                      : utilizationPercentage > 75
                        ? premiumDesignSystem.colors.semantic.warning.main
                        : premiumDesignSystem.colors.semantic.success.main,
                  borderRadius: 3,
                },
              }}
            />
          </Box>

          {/* Stats */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Tooltip title='Current Jobs'>
              <Chip
                label={`${stage.currentJobs || 0}`}
                size='small'
                variant='outlined'
                sx={{
                  fontSize: '0.7rem',
                  height: 20,
                  '& .MuiChip-label': { px: 0.5 },
                }}
              />
            </Tooltip>
            <Tooltip title='Avg Completion Time'>
              <Chip
                label={`${stage.avgTime || 0}h`}
                size='small'
                variant='outlined'
                sx={{
                  fontSize: '0.7rem',
                  height: 20,
                  '& .MuiChip-label': { px: 0.5 },
                }}
              />
            </Tooltip>
          </Box>
        </Card>
      </motion.div>

      {/* Detailed popover */}
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handlePopoverClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        PaperProps={{
          sx: {
            p: 2,
            maxWidth: 250,
            background: `${premiumDesignSystem.colors.glass.white[15]}`,
            backdropFilter: premiumDesignSystem.effects.backdrop.lg,
            border: `1px solid ${premiumDesignSystem.colors.glass.white[20]}`,
            boxShadow: premiumDesignSystem.shadows.glass.elevated,
          },
        }}
      >
        <Typography variant='subtitle2' sx={{ mb: 1, fontWeight: 600 }}>
          {stage.name} Details
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant='caption'>Current Load:</Typography>
            <Typography variant='caption' fontWeight={500}>
              {stage.currentLoad}/{stage.capacity}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant='caption'>Technicians:</Typography>
            <Typography variant='caption' fontWeight={500}>
              {stage.technicians || 0}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant='caption'>Queue Time:</Typography>
            <Typography variant='caption' fontWeight={500}>
              {stage.queueTime || 0}h
            </Typography>
          </Box>
          {stage.nextAvailable && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant='caption'>Next Available:</Typography>
              <Typography variant='caption' fontWeight={500}>
                {new Date(stage.nextAvailable).toLocaleDateString()}
              </Typography>
            </Box>
          )}
        </Box>
      </Popover>
    </>
  );
};

export const ProductionFlowDiagram = React.memo(
  ({
    stages = [],
    connections = [],
    title = 'Production Flow',
    onStageReorder,
    onStageClick,
    onBottleneckAlert,
    realTimeUpdate = false,
    showMetrics = true,
    editable = true,
    height = 400,
    ...props
  }) => {
    const [selectedStage, setSelectedStage] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [stageOrder, setStageOrder] = useState(stages);

    // Update stages when prop changes
    React.useEffect(() => {
      setStageOrder(stages);
    }, [stages]);

    // Detect bottlenecks
    const bottlenecks = useMemo(() => {
      return stageOrder.filter(stage => {
        const utilization = (stage.currentLoad / stage.capacity) * 100;
        return utilization > 90 || stage.bottleneck;
      });
    }, [stageOrder]);

    // Handle drag end
    const handleDragEnd = useCallback(
      result => {
        if (!result.destination || !editable) return;

        const items = Array.from(stageOrder);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        setStageOrder(items);
        onStageReorder?.(items);
      },
      [stageOrder, onStageReorder, editable]
    );

    // Handle stage click
    const handleStageClick = useCallback(
      stage => {
        setSelectedStage(stage);
        setDialogOpen(true);
        onStageClick?.(stage);
      },
      [onStageClick]
    );

    // Calculate overall flow metrics
    const flowMetrics = useMemo(() => {
      const totalCapacity = stageOrder.reduce(
        (sum, stage) => sum + stage.capacity,
        0
      );
      const totalLoad = stageOrder.reduce(
        (sum, stage) => sum + stage.currentLoad,
        0
      );
      const averageUtilization =
        totalCapacity > 0 ? (totalLoad / totalCapacity) * 100 : 0;
      const activeStages = stageOrder.filter(
        stage => stage.status === 'active'
      ).length;

      return {
        totalCapacity,
        totalLoad,
        averageUtilization,
        activeStages,
        bottleneckCount: bottlenecks.length,
      };
    }, [stageOrder, bottlenecks]);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Box
          sx={{
            background: `${premiumDesignSystem.colors.glass.white[8]}`,
            backdropFilter: premiumDesignSystem.effects.backdrop.lg,
            border: `1px solid ${premiumDesignSystem.colors.glass.white[15]}`,
            borderRadius: premiumDesignSystem.borderRadius.xl,
            p: 3,
            boxShadow: premiumDesignSystem.shadows.glass.medium,
            minHeight: height,
          }}
          {...props}
        >
          {/* Header */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 3,
            }}
          >
            <Typography
              variant='h6'
              sx={{
                fontWeight: premiumDesignSystem.typography.fontWeight.semibold,
                color: premiumDesignSystem.colors.neutral[800],
              }}
            >
              {title}
            </Typography>

            {/* Metrics chips */}
            {showMetrics && (
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Tooltip title='Average Utilization'>
                  <Chip
                    icon={<Speed />}
                    label={`${flowMetrics.averageUtilization.toFixed(1)}%`}
                    size='small'
                    color={
                      flowMetrics.averageUtilization > 85
                        ? 'warning'
                        : 'success'
                    }
                    variant='outlined'
                  />
                </Tooltip>
                <Tooltip title='Active Stages'>
                  <Chip
                    icon={<Timeline />}
                    label={`${flowMetrics.activeStages}/${stageOrder.length}`}
                    size='small'
                    color='primary'
                    variant='outlined'
                  />
                </Tooltip>
                {bottlenecks.length > 0 && (
                  <Tooltip title='Bottlenecks Detected'>
                    <Chip
                      icon={<Warning />}
                      label={bottlenecks.length}
                      size='small'
                      color='error'
                      variant='filled'
                    />
                  </Tooltip>
                )}
              </Box>
            )}
          </Box>

          {/* Flow diagram */}
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId='production-stages' direction='horizontal'>
              {(provided, snapshot) => (
                <Box
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    overflowX: 'auto',
                    overflowY: 'visible',
                    pb: 2,
                    minHeight: 200,
                    backgroundColor: snapshot.isDraggingOver
                      ? `${premiumDesignSystem.colors.primary[50]}40`
                      : 'transparent',
                    borderRadius: premiumDesignSystem.borderRadius.lg,
                    transition:
                      premiumDesignSystem.animations.transitions.colors,
                  }}
                >
                  {stageOrder.map((stage, index) => (
                    <React.Fragment key={stage.id}>
                      <Draggable
                        draggableId={stage.id}
                        index={index}
                        isDragDisabled={!editable}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={{
                              ...provided.draggableProps.style,
                              opacity: snapshot.isDragging ? 0.8 : 1,
                            }}
                          >
                            <ProductionStage
                              stage={stage}
                              index={index}
                              isDragging={snapshot.isDragging}
                              onStageClick={handleStageClick}
                            />
                          </div>
                        )}
                      </Draggable>

                      {/* Connection between stages */}
                      {index < stageOrder.length - 1 && (
                        <FlowConnection
                          isActive={
                            stage.status === 'active' &&
                            stageOrder[index + 1].status === 'active'
                          }
                          progress={
                            connections[index]?.progress || Math.random() * 100
                          }
                          bottleneck={
                            stage.bottleneck || stageOrder[index + 1].bottleneck
                          }
                        />
                      )}
                    </React.Fragment>
                  ))}
                  {provided.placeholder}
                </Box>
              )}
            </Droppable>
          </DragDropContext>

          {/* Bottleneck alerts */}
          <AnimatePresence>
            {bottlenecks.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Box
                  sx={{
                    mt: 2,
                    p: 2,
                    backgroundColor: `${premiumDesignSystem.colors.semantic.warning.light}40`,
                    border: `1px solid ${premiumDesignSystem.colors.semantic.warning.main}`,
                    borderRadius: premiumDesignSystem.borderRadius.lg,
                  }}
                >
                  <Typography
                    variant='subtitle2'
                    sx={{
                      mb: 1,
                      color: premiumDesignSystem.colors.semantic.warning.dark,
                    }}
                  >
                    ⚠️ Bottlenecks Detected
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {bottlenecks.map(bottleneck => (
                      <Chip
                        key={bottleneck.id}
                        label={bottleneck.name}
                        size='small'
                        color='warning'
                        onClick={() => handleStageClick(bottleneck)}
                        sx={{ cursor: 'pointer' }}
                      />
                    ))}
                  </Box>
                </Box>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stage details dialog */}
          <Dialog
            open={dialogOpen}
            onClose={() => setDialogOpen(false)}
            maxWidth='sm'
            fullWidth
            PaperProps={{
              sx: {
                background: `${premiumDesignSystem.colors.glass.white[15]}`,
                backdropFilter: premiumDesignSystem.effects.backdrop.lg,
              },
            }}
          >
            {selectedStage && (
              <>
                <DialogTitle>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                      sx={{
                        backgroundColor: `${statusConfig[selectedStage.status]?.color}20`,
                        color: statusConfig[selectedStage.status]?.color,
                      }}
                    >
                      {stageIcons[selectedStage.type] || <Build />}
                    </Avatar>
                    <Box>
                      <Typography variant='h6'>{selectedStage.name}</Typography>
                      <Typography variant='body2' color='text.secondary'>
                        {statusConfig[selectedStage.status]?.label ||
                          'Unknown Status'}
                      </Typography>
                    </Box>
                  </Box>
                </DialogTitle>
                <DialogContent>
                  {/* Add detailed stage information here */}
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 2,
                      mt: 2,
                    }}
                  >
                    <Box>
                      <Typography variant='subtitle2' gutterBottom>
                        Capacity Utilization
                      </Typography>
                      <LinearProgress
                        variant='determinate'
                        value={
                          (selectedStage.currentLoad / selectedStage.capacity) *
                          100
                        }
                        sx={{ height: 8, borderRadius: 4, mb: 1 }}
                      />
                      <Typography variant='body2' color='text.secondary'>
                        {selectedStage.currentLoad} / {selectedStage.capacity}{' '}
                        jobs
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant='subtitle2' gutterBottom>
                        Performance
                      </Typography>
                      <Typography variant='body2'>
                        Avg Time: {selectedStage.avgTime || 0}h
                      </Typography>
                      <Typography variant='body2'>
                        Queue Time: {selectedStage.queueTime || 0}h
                      </Typography>
                      <Typography variant='body2'>
                        Technicians: {selectedStage.technicians || 0}
                      </Typography>
                    </Box>
                  </Box>
                </DialogContent>
                <DialogActions>
                  <Button onClick={() => setDialogOpen(false)}>Close</Button>
                </DialogActions>
              </>
            )}
          </Dialog>
        </Box>
      </motion.div>
    );
  }
);

ProductionFlowDiagram.displayName = 'ProductionFlowDiagram';

export default ProductionFlowDiagram;
