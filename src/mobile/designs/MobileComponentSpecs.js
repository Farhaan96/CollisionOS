/**
 * CollisionOS Mobile Component Specifications
 * Design specifications for mobile-first components adapted from desktop
 */

// =============================================
// CUSTOMER MOBILE APP COMPONENTS
// =============================================

export const CustomerMobileComponents = {
  // Job Status Tracking Screen
  JobStatusScreen: {
    component: `
      <Screen style={styles.container}>
        <StatusHeader 
          jobNumber="240826-001"
          vehicleInfo="2022 Toyota Camry"
          estimatedCompletion="Aug 30, 2024"
        />
        
        <ProgressTimeline 
          currentStage="paint_booth"
          stages={[
            { id: 'estimate', name: 'Estimate', completed: true },
            { id: 'parts_ordering', name: 'Parts Ordered', completed: true },
            { id: 'body_work', name: 'Body Work', completed: true },
            { id: 'paint_booth', name: 'Paint', active: true },
            { id: 'reassembly', name: 'Reassembly', upcoming: true },
            { id: 'quality_check', name: 'Quality Check', upcoming: true },
            { id: 'ready_pickup', name: 'Ready', upcoming: true }
          ]}
        />
        
        <PhotoGallery 
          title="Progress Photos"
          photos={progressPhotos}
          allowUpload={true}
        />
        
        <QuickActions 
          actions={[
            { label: 'Message Shop', icon: 'message', action: 'openChat' },
            { label: 'View Estimate', icon: 'receipt', action: 'viewEstimate' },
            { label: 'Schedule Pickup', icon: 'calendar', action: 'schedulePickup' }
          ]}
        />
      </Screen>
    `,

    styles: `
      container: {
        flex: 1,
        backgroundColor: '#0F172A',
        paddingTop: StatusBar.currentHeight,
      },
    `,
  },

  // Status Header Component
  StatusHeader: {
    component: `
      <GlassCard style={styles.headerCard}>
        <View style={styles.headerContent}>
          <View style={styles.jobInfo}>
            <Text style={styles.jobNumber}>{jobNumber}</Text>
            <Text style={styles.vehicleInfo}>{vehicleInfo}</Text>
          </View>
          
          <StatusBadge 
            status={currentStatus}
            color={getStatusColor(currentStatus)}
          />
        </View>
        
        <View style={styles.estimatedCompletion}>
          <Icon name="schedule" size={16} color="#10B981" />
          <Text style={styles.completionText}>
            Estimated completion: {estimatedCompletion}
          </Text>
        </View>
        
        <LinearProgress 
          progress={getProgressPercentage(currentStage)}
          color="#10B981"
          style={styles.progressBar}
        />
      </GlassCard>
    `,

    styles: `
      headerCard: {
        margin: 16,
        padding: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.12)',
      },
      headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
      },
      jobNumber: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 4,
      },
      vehicleInfo: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.7)',
      },
      estimatedCompletion: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
      },
      completionText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#10B981',
        fontWeight: '500',
      },
      progressBar: {
        height: 8,
        borderRadius: 4,
      },
    `,
  },

  // Progress Timeline Component
  ProgressTimeline: {
    component: `
      <GlassCard style={styles.timelineCard}>
        <Text style={styles.timelineTitle}>Repair Progress</Text>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.timelineScroll}
        >
          {stages.map((stage, index) => (
            <TouchableOpacity 
              key={stage.id}
              style={styles.stageContainer}
              onPress={() => onStagePress(stage)}
            >
              <View style={[
                styles.stageDot,
                {
                  backgroundColor: stage.completed 
                    ? '#10B981' 
                    : stage.active 
                      ? '#F59E0B' 
                      : '#374151'
                }
              ]}>
                {stage.completed && (
                  <Icon name="check" size={16} color="#FFFFFF" />
                )}
                {stage.active && (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                )}
              </View>
              
              <Text style={[
                styles.stageText,
                {
                  color: stage.completed || stage.active 
                    ? '#FFFFFF' 
                    : 'rgba(255, 255, 255, 0.5)'
                }
              ]}>
                {stage.name}
              </Text>
              
              {index < stages.length - 1 && (
                <View style={[
                  styles.connector,
                  {
                    backgroundColor: stages[index + 1].completed 
                      ? '#10B981' 
                      : '#374151'
                  }
                ]} />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </GlassCard>
    `,

    styles: `
      timelineCard: {
        margin: 16,
        marginTop: 8,
        padding: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: 16,
      },
      timelineTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: 16,
      },
      timelineScroll: {
        flexDirection: 'row',
      },
      stageContainer: {
        alignItems: 'center',
        marginRight: 24,
      },
      stageDot: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
      },
      stageText: {
        fontSize: 12,
        textAlign: 'center',
        maxWidth: 60,
      },
      connector: {
        position: 'absolute',
        top: 19,
        left: 40,
        width: 24,
        height: 2,
      },
    `,
  },

  // Photo Gallery Component
  PhotoGallery: {
    component: `
      <GlassCard style={styles.galleryCard}>
        <View style={styles.galleryHeader}>
          <Text style={styles.galleryTitle}>{title}</Text>
          
          {allowUpload && (
            <TouchableOpacity 
              style={styles.addPhotoButton}
              onPress={onAddPhoto}
            >
              <Icon name="add-a-photo" size={20} color="#6366F1" />
            </TouchableOpacity>
          )}
        </View>
        
        <ScrollView 
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.photoScroll}
        >
          {photos.map((photo, index) => (
            <TouchableOpacity 
              key={index}
              onPress={() => openPhotoViewer(photo)}
            >
              <Image 
                source={{ uri: photo.thumbnail }}
                style={styles.photoThumbnail}
                resizeMode="cover"
              />
              
              <View style={styles.photoOverlay}>
                <Text style={styles.photoDate}>
                  {formatDate(photo.takenAt)}
                </Text>
                <Text style={styles.photoType}>
                  {photo.type}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
          
          {photos.length === 0 && (
            <View style={styles.noPhotos}>
              <Icon name="photo-library" size={48} color="#6B7280" />
              <Text style={styles.noPhotosText}>
                No photos yet
              </Text>
            </View>
          )}
        </ScrollView>
      </GlassCard>
    `,

    styles: `
      galleryCard: {
        margin: 16,
        marginTop: 8,
        padding: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: 16,
      },
      galleryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
      },
      galleryTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
      },
      addPhotoButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
      },
      photoScroll: {
        flexDirection: 'row',
      },
      photoThumbnail: {
        width: 120,
        height: 90,
        borderRadius: 8,
        marginRight: 12,
      },
      photoOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 12,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        padding: 8,
        borderBottomLeftRadius: 8,
        borderBottomRightRadius: 8,
      },
      photoDate: {
        fontSize: 10,
        color: '#FFFFFF',
        fontWeight: '500',
      },
      photoType: {
        fontSize: 9,
        color: 'rgba(255, 255, 255, 0.7)',
        textTransform: 'uppercase',
      },
      noPhotos: {
        alignItems: 'center',
        justifyContent: 'center',
        height: 90,
        width: 200,
      },
      noPhotosText: {
        marginTop: 8,
        color: '#6B7280',
        fontSize: 14,
      },
    `,
  },
};

// =============================================
// TECHNICIAN MOBILE APP COMPONENTS
// =============================================

export const TechnicianMobileComponents = {
  // Task Dashboard Screen
  TaskDashboard: {
    component: `
      <Screen style={styles.container}>
        <DashboardHeader 
          technicianName="John Smith"
          activeJobs={activeJobs.length}
          completedToday={completedTasks}
        />
        
        <TasksGrid 
          tasks={tasks}
          onTaskPress={handleTaskPress}
          onTaskComplete={handleTaskComplete}
        />
        
        <FloatingActionButton 
          icon="qr-code-scanner"
          onPress={openScanner}
          style={styles.fab}
        />
      </Screen>
    `,

    styles: `
      container: {
        flex: 1,
        backgroundColor: '#0F172A',
        paddingTop: StatusBar.currentHeight,
      },
      fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        backgroundColor: '#6366F1',
        elevation: 8,
      },
    `,
  },

  // Task Card Component
  TaskCard: {
    component: `
      <TouchableOpacity 
        onPress={onPress}
        style={styles.taskCard}
      >
        <GlassCard style={styles.cardContent}>
          <View style={styles.taskHeader}>
            <View style={styles.jobInfo}>
              <Text style={styles.jobNumber}>{task.jobNumber}</Text>
              <Text style={styles.customerName}>{task.customerName}</Text>
            </View>
            
            <PriorityBadge priority={task.priority} />
          </View>
          
          <Text style={styles.taskDescription}>
            {task.description}
          </Text>
          
          <View style={styles.taskFooter}>
            <View style={styles.estimatedTime}>
              <Icon name="schedule" size={16} color="#10B981" />
              <Text style={styles.timeText}>
                {task.estimatedHours}h estimated
              </Text>
            </View>
            
            <TouchableOpacity 
              style={styles.completeButton}
              onPress={() => onTaskComplete(task.id)}
            >
              <Icon name="check-circle" size={20} color="#10B981" />
            </TouchableOpacity>
          </View>
          
          <LinearProgress 
            progress={task.progress}
            color="#10B981"
            style={styles.progressBar}
          />
        </GlassCard>
      </TouchableOpacity>
    `,

    styles: `
      taskCard: {
        margin: 8,
        marginBottom: 16,
      },
      cardContent: {
        padding: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: 12,
      },
      taskHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
      },
      jobNumber: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
      },
      customerName: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.7)',
        marginTop: 2,
      },
      taskDescription: {
        fontSize: 14,
        color: '#FFFFFF',
        marginBottom: 16,
        lineHeight: 20,
      },
      taskFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
      },
      estimatedTime: {
        flexDirection: 'row',
        alignItems: 'center',
      },
      timeText: {
        marginLeft: 4,
        fontSize: 12,
        color: '#10B981',
        fontWeight: '500',
      },
      completeButton: {
        padding: 8,
        borderRadius: 6,
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
      },
      progressBar: {
        height: 6,
        borderRadius: 3,
      },
    `,
  },

  // QR Scanner Screen
  QRScannerScreen: {
    component: `
      <Screen style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={onClose}
            style={styles.closeButton}
          >
            <Icon name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Scan Job QR Code</Text>
          
          <TouchableOpacity 
            onPress={toggleFlash}
            style={styles.flashButton}
          >
            <Icon 
              name={flashOn ? "flash-off" : "flash-on"} 
              size={24} 
              color="#FFFFFF" 
            />
          </TouchableOpacity>
        </View>
        
        <RNCamera
          ref={cameraRef}
          style={styles.camera}
          onBarCodeRead={onBarCodeRead}
          barCodeTypes={[RNCamera.Constants.BarCodeType.qr]}
          flashMode={flashOn ? RNCamera.Constants.FlashMode.torch : RNCamera.Constants.FlashMode.off}
        >
          <View style={styles.scannerOverlay}>
            <View style={styles.scannerFrame} />
            
            <Text style={styles.scannerText}>
              Position QR code within the frame
            </Text>
          </View>
        </RNCamera>
        
        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.manualEntryButton}
            onPress={onManualEntry}
          >
            <Icon name="keyboard" size={20} color="#6366F1" />
            <Text style={styles.manualEntryText}>Manual Entry</Text>
          </TouchableOpacity>
        </View>
      </Screen>
    `,

    styles: `
      container: {
        flex: 1,
        backgroundColor: '#000000',
      },
      header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        paddingTop: StatusBar.currentHeight + 20,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
      },
      headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFFFFF',
      },
      closeButton: {
        padding: 8,
      },
      flashButton: {
        padding: 8,
      },
      camera: {
        flex: 1,
      },
      scannerOverlay: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
      },
      scannerFrame: {
        width: 250,
        height: 250,
        borderWidth: 2,
        borderColor: '#FFFFFF',
        borderRadius: 12,
        backgroundColor: 'transparent',
      },
      scannerText: {
        marginTop: 24,
        fontSize: 16,
        color: '#FFFFFF',
        textAlign: 'center',
        paddingHorizontal: 40,
      },
      footer: {
        padding: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        alignItems: 'center',
      },
      manualEntryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
      },
      manualEntryText: {
        marginLeft: 8,
        fontSize: 16,
        color: '#6366F1',
        fontWeight: '500',
      },
    `,
  },
};

// =============================================
// SHARED MOBILE COMPONENTS
// =============================================

export const SharedMobileComponents = {
  // Glass Card with Mobile Optimizations
  GlassCard: {
    component: `
      <View style={[styles.glassCard, style]}>
        {children}
      </View>
    `,

    styles: `
      glassCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.12)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 32,
        elevation: 8,
      },
    `,
  },

  // Status Badge
  StatusBadge: {
    component: `
      <View style={[styles.badge, { backgroundColor: color + '20' }]}>
        <View style={[styles.dot, { backgroundColor: color }]} />
        <Text style={[styles.text, { color }]}>{status}</Text>
      </View>
    `,

    styles: `
      badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
      },
      dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
      },
      text: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'capitalize',
      },
    `,
  },

  // Linear Progress with Glass Effect
  LinearProgress: {
    component: `
      <View style={[styles.progressContainer, style]}>
        <View style={styles.progressTrack}>
          <Animated.View 
            style={[
              styles.progressFill,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', \`\${progress * 100}%\`],
                }),
                backgroundColor: color,
              }
            ]}
          />
        </View>
      </View>
    `,

    styles: `
      progressContainer: {
        height: 8,
        borderRadius: 4,
        overflow: 'hidden',
      },
      progressTrack: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 4,
      },
      progressFill: {
        height: '100%',
        borderRadius: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 2,
      },
    `,
  },

  // Mobile Navigation Tab Bar
  TabBar: {
    component: `
      <View style={styles.tabBar}>
        {routes.map((route, index) => (
          <TouchableOpacity
            key={route.key}
            style={[
              styles.tabButton,
              { opacity: index === activeIndex ? 1 : 0.6 }
            ]}
            onPress={() => onTabPress(index)}
          >
            <Icon 
              name={route.icon} 
              size={24} 
              color={index === activeIndex ? '#6366F1' : '#9CA3AF'} 
            />
            <Text style={[
              styles.tabLabel,
              { color: index === activeIndex ? '#6366F1' : '#9CA3AF' }
            ]}>
              {route.title}
            </Text>
            
            {route.badge && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{route.badge}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    `,

    styles: `
      tabBar: {
        flexDirection: 'row',
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
        paddingBottom: 20, // Safe area padding
        paddingTop: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 8,
      },
      tabButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        position: 'relative',
      },
      tabLabel: {
        fontSize: 12,
        fontWeight: '500',
        marginTop: 4,
      },
      badge: {
        position: 'absolute',
        top: 0,
        right: '25%',
        backgroundColor: '#EF4444',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
      },
      badgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#FFFFFF',
      },
    `,
  },

  // Floating Action Button
  FloatingActionButton: {
    component: `
      <TouchableOpacity 
        style={[styles.fab, style]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <Icon name={icon} size={24} color="#FFFFFF" />
      </TouchableOpacity>
    `,

    styles: `
      fab: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#6366F1',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
      },
    `,
  },
};

// =============================================
// MOBILE STYLE SYSTEM
// =============================================

export const MobileStyles = {
  // Spacing system
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  // Typography
  typography: {
    h1: { fontSize: 28, fontWeight: '800', lineHeight: 32 },
    h2: { fontSize: 24, fontWeight: '700', lineHeight: 28 },
    h3: { fontSize: 20, fontWeight: '700', lineHeight: 24 },
    h4: { fontSize: 18, fontWeight: '600', lineHeight: 22 },
    h5: { fontSize: 16, fontWeight: '600', lineHeight: 20 },
    h6: { fontSize: 14, fontWeight: '600', lineHeight: 18 },
    body1: { fontSize: 16, fontWeight: '400', lineHeight: 24 },
    body2: { fontSize: 14, fontWeight: '400', lineHeight: 20 },
    caption: { fontSize: 12, fontWeight: '400', lineHeight: 16 },
    overline: {
      fontSize: 10,
      fontWeight: '600',
      lineHeight: 16,
      textTransform: 'uppercase',
    },
  },

  // Colors
  colors: {
    primary: '#6366F1',
    secondary: '#8B5CF6',
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#0EA5E9',
    background: '#0F172A',
    surface: 'rgba(30, 41, 59, 0.50)',
    onBackground: '#FFFFFF',
    onSurface: '#FFFFFF',
  },

  // Border radius
  borderRadius: {
    small: 8,
    medium: 12,
    large: 16,
    xlarge: 20,
    round: 9999,
  },

  // Shadows
  shadows: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 8,
    },
  },
};

export default {
  CustomerMobileComponents,
  TechnicianMobileComponents,
  SharedMobileComponents,
  MobileStyles,
};
