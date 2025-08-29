/**
 * CollisionOS Mobile Navigation System
 * React Navigation setup for Customer and Technician mobile apps
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { 
  Platform, 
  StatusBar, 
  View, 
  Text, 
  TouchableOpacity,
  Animated
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';

// =============================================
// NAVIGATION THEME
// =============================================

export const navigationTheme = {
  dark: true,
  colors: {
    primary: '#6366F1',
    background: '#0F172A',
    card: 'rgba(30, 41, 59, 0.95)',
    text: '#FFFFFF',
    border: 'rgba(255, 255, 255, 0.1)',
    notification: '#EF4444',
  },
};

// =============================================
// CUSTOM TAB BAR
// =============================================

const CustomTabBar = ({ state, descriptors, navigation }) => {
  return (
    <View style={styles.tabBar}>
      {/* Glass morphism background */}
      <LinearGradient
        colors={['rgba(30, 41, 59, 0.95)', 'rgba(15, 23, 42, 0.95)']}
        style={styles.tabBarGradient}
      />
      
      <View style={styles.tabBarContent}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = options.tabBarLabel || options.title || route.name;
          const isFocused = state.index === index;
          
          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };
          
          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };
          
          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tabButton}
            >
              <Animated.View style={[
                styles.tabIconContainer,
                isFocused && styles.tabIconContainerActive
              ]}>
                {options.tabBarIcon && 
                  options.tabBarIcon({
                    focused: isFocused,
                    color: isFocused ? '#6366F1' : '#9CA3AF',
                    size: 24
                  })
                }
                
                {options.tabBarBadge && (
                  <View style={styles.tabBadge}>
                    <Text style={styles.tabBadgeText}>
                      {options.tabBarBadge}
                    </Text>
                  </View>
                )}
              </Animated.View>
              
              <Text style={[
                styles.tabLabel,
                { color: isFocused ? '#6366F1' : '#9CA3AF' }
              ]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

// =============================================
// CUSTOMER APP NAVIGATION
// =============================================

const CustomerStack = createStackNavigator();
const CustomerTab = createBottomTabNavigator();

// Customer Tab Navigator
const CustomerTabNavigator = () => (
  <CustomerTab.Navigator
    tabBar={(props) => <CustomTabBar {...props} />}
    screenOptions={{
      headerShown: false,
    }}
  >
    <CustomerTab.Screen
      name="JobStatus"
      component={JobStatusScreen}
      options={{
        title: 'My Job',
        tabBarIcon: ({ focused, color, size }) => (
          <MaterialIcons name="work" color={color} size={size} />
        ),
      }}
    />
    
    <CustomerTab.Screen
      name="Photos"
      component={PhotosScreen}
      options={{
        title: 'Photos',
        tabBarIcon: ({ focused, color, size }) => (
          <MaterialIcons name="photo-camera" color={color} size={size} />
        ),
      }}
    />
    
    <CustomerTab.Screen
      name="Messages"
      component={MessagesScreen}
      options={{
        title: 'Messages',
        tabBarIcon: ({ focused, color, size }) => (
          <MaterialIcons name="message" color={color} size={size} />
        ),
        tabBarBadge: 2, // Unread messages count
      }}
    />
    
    <CustomerTab.Screen
      name="Estimate"
      component={EstimateScreen}
      options={{
        title: 'Estimate',
        tabBarIcon: ({ focused, color, size }) => (
          <MaterialIcons name="receipt" color={color} size={size} />
        ),
      }}
    />
    
    <CustomerTab.Screen
      name="Profile"
      component={CustomerProfileScreen}
      options={{
        title: 'Profile',
        tabBarIcon: ({ focused, color, size }) => (
          <MaterialIcons name="person" color={color} size={size} />
        ),
      }}
    />
  </CustomerTab.Navigator>
);

// Customer Stack Navigator (Main)
export const CustomerAppNavigator = () => (
  <CustomerStack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
      },
      headerTintColor: '#FFFFFF',
      headerTitleStyle: {
        fontWeight: '600',
        fontSize: 18,
      },
      headerBackTitleVisible: false,
      gestureEnabled: true,
      cardStyleInterpolator: ({ current, layouts }) => {
        return {
          cardStyle: {
            transform: [
              {
                translateX: current.progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [layouts.screen.width, 0],
                }),
              },
            ],
          },
        };
      },
    }}
  >
    <CustomerStack.Screen
      name="CustomerHome"
      component={CustomerTabNavigator}
      options={{ headerShown: false }}
    />
    
    <CustomerStack.Screen
      name="PhotoViewer"
      component={PhotoViewerScreen}
      options={{
        title: 'Photo',
        headerStyle: {
          backgroundColor: '#000000',
        },
      }}
    />
    
    <CustomerStack.Screen
      name="EstimateDetails"
      component={EstimateDetailsScreen}
      options={{
        title: 'Estimate Details',
      }}
    />
    
    <CustomerStack.Screen
      name="PaymentScreen"
      component={PaymentScreen}
      options={{
        title: 'Payment',
        headerLeft: null, // Prevent back navigation during payment
      }}
    />
    
    <CustomerStack.Screen
      name="ChatScreen"
      component={ChatScreen}
      options={({ route }) => ({
        title: route.params?.contactName || 'Chat',
      })}
    />
    
    <CustomerStack.Screen
      name="SchedulePickup"
      component={SchedulePickupScreen}
      options={{
        title: 'Schedule Pickup',
      }}
    />
  </CustomerStack.Navigator>
);

// =============================================
// TECHNICIAN APP NAVIGATION
// =============================================

const TechnicianStack = createStackNavigator();
const TechnicianTab = createBottomTabNavigator();
const TechnicianDrawer = createDrawerNavigator();

// Technician Tab Navigator
const TechnicianTabNavigator = () => (
  <TechnicianTab.Navigator
    tabBar={(props) => <CustomTabBar {...props} />}
    screenOptions={{
      headerShown: false,
    }}
  >
    <TechnicianTab.Screen
      name="Dashboard"
      component={TechnicianDashboardScreen}
      options={{
        title: 'Tasks',
        tabBarIcon: ({ focused, color, size }) => (
          <MaterialIcons name="dashboard" color={color} size={size} />
        ),
      }}
    />
    
    <TechnicianTab.Screen
      name="Scanner"
      component={QRScannerScreen}
      options={{
        title: 'Scan',
        tabBarIcon: ({ focused, color, size }) => (
          <MaterialIcons name="qr-code-scanner" color={color} size={size} />
        ),
      }}
    />
    
    <TechnicianTab.Screen
      name="TimeTracker"
      component={TimeTrackerScreen}
      options={{
        title: 'Time',
        tabBarIcon: ({ focused, color, size }) => (
          <MaterialIcons name="access-time" color={color} size={size} />
        ),
        tabBarBadge: 'ON', // Show if timer is running
      }}
    />
    
    <TechnicianTab.Screen
      name="Jobs"
      component={TechnicianJobsScreen}
      options={{
        title: 'Jobs',
        tabBarIcon: ({ focused, color, size }) => (
          <MaterialIcons name="work" color={color} size={size} />
        ),
      }}
    />
    
    <TechnicianTab.Screen
      name="Profile"
      component={TechnicianProfileScreen}
      options={{
        title: 'Profile',
        tabBarIcon: ({ focused, color, size }) => (
          <MaterialIcons name="person" color={color} size={size} />
        ),
      }}
    />
  </TechnicianTab.Navigator>
);

// Technician Drawer Navigator
const TechnicianDrawerNavigator = () => (
  <TechnicianDrawer.Navigator
    screenOptions={{
      headerShown: false,
      drawerStyle: {
        backgroundColor: 'rgba(30, 41, 59, 0.95)',
        borderRightWidth: 1,
        borderRightColor: 'rgba(255, 255, 255, 0.1)',
      },
      drawerActiveBackgroundColor: 'rgba(99, 102, 241, 0.2)',
      drawerActiveTintColor: '#6366F1',
      drawerInactiveTintColor: '#9CA3AF',
      drawerLabelStyle: {
        fontWeight: '500',
      },
    }}
    drawerContent={(props) => <CustomDrawerContent {...props} />}
  >
    <TechnicianDrawer.Screen
      name="TechnicianMain"
      component={TechnicianTabNavigator}
      options={{
        title: 'Dashboard',
        drawerIcon: ({ focused, color, size }) => (
          <MaterialIcons name="dashboard" color={color} size={size} />
        ),
      }}
    />
    
    <TechnicianDrawer.Screen
      name="QualityControl"
      component={QualityControlScreen}
      options={{
        title: 'Quality Control',
        drawerIcon: ({ focused, color, size }) => (
          <MaterialIcons name="verified" color={color} size={size} />
        ),
      }}
    />
    
    <TechnicianDrawer.Screen
      name="Inventory"
      component={InventoryScreen}
      options={{
        title: 'Parts & Inventory',
        drawerIcon: ({ focused, color, size }) => (
          <MaterialIcons name="inventory" color={color} size={size} />
        ),
      }}
    />
    
    <TechnicianDrawer.Screen
      name="Reports"
      component={ReportsScreen}
      options={{
        title: 'Reports',
        drawerIcon: ({ focused, color, size }) => (
          <MaterialIcons name="bar-chart" color={color} size={size} />
        ),
      }}
    />
  </TechnicianDrawer.Navigator>
);

// Technician Stack Navigator (Main)
export const TechnicianAppNavigator = () => (
  <TechnicianStack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
      },
      headerTintColor: '#FFFFFF',
      headerTitleStyle: {
        fontWeight: '600',
        fontSize: 18,
      },
      headerBackTitleVisible: false,
      gestureEnabled: true,
    }}
  >
    <TechnicianStack.Screen
      name="TechnicianHome"
      component={TechnicianDrawerNavigator}
      options={{ headerShown: false }}
    />
    
    <TechnicianStack.Screen
      name="TaskDetails"
      component={TaskDetailsScreen}
      options={({ route }) => ({
        title: route.params?.taskTitle || 'Task Details',
      })}
    />
    
    <TechnicianStack.Screen
      name="JobDetails"
      component={JobDetailsScreen}
      options={({ route }) => ({
        title: route.params?.jobNumber || 'Job Details',
      })}
    />
    
    <TechnicianStack.Screen
      name="PhotoCapture"
      component={PhotoCaptureScreen}
      options={{
        title: 'Take Photo',
        headerStyle: {
          backgroundColor: '#000000',
        },
      }}
    />
    
    <TechnicianStack.Screen
      name="QCInspection"
      component={QCInspectionScreen}
      options={{
        title: 'Quality Inspection',
      }}
    />
  </TechnicianStack.Navigator>
);

// =============================================
// CUSTOM DRAWER CONTENT
// =============================================

const CustomDrawerContent = (props) => {
  const { state, navigation, descriptors } = props;
  
  return (
    <View style={styles.drawerContainer}>
      {/* Header */}
      <View style={styles.drawerHeader}>
        <LinearGradient
          colors={['rgba(99, 102, 241, 0.8)', 'rgba(139, 92, 246, 0.8)']}
          style={styles.drawerHeaderGradient}
        />
        <View style={styles.drawerHeaderContent}>
          <View style={styles.technicianAvatar}>
            <Text style={styles.avatarText}>JS</Text>
          </View>
          <View>
            <Text style={styles.technicianName}>John Smith</Text>
            <Text style={styles.technicianRole}>Senior Technician</Text>
          </View>
        </View>
      </View>
      
      {/* Navigation Items */}
      <View style={styles.drawerItems}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          
          const onPress = () => {
            navigation.navigate(route.name);
          };
          
          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={[
                styles.drawerItem,
                isFocused && styles.drawerItemActive
              ]}
            >
              {options.drawerIcon && 
                options.drawerIcon({
                  focused: isFocused,
                  color: isFocused ? '#6366F1' : '#9CA3AF',
                  size: 24
                })
              }
              <Text style={[
                styles.drawerLabel,
                { color: isFocused ? '#6366F1' : '#9CA3AF' }
              ]}>
                {options.title}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      
      {/* Footer */}
      <View style={styles.drawerFooter}>
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => navigation.navigate('Settings')}
        >
          <MaterialIcons name="settings" color="#9CA3AF" size={20} />
          <Text style={styles.settingsText}>Settings</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={() => {/* Handle logout */}}
        >
          <MaterialIcons name="logout" color="#EF4444" size={20} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// =============================================
// AUTH NAVIGATION
// =============================================

const AuthStack = createStackNavigator();

export const AuthNavigator = () => (
  <AuthStack.Navigator
    screenOptions={{
      headerShown: false,
      cardStyleInterpolator: ({ current, layouts }) => {
        return {
          cardStyle: {
            transform: [
              {
                translateX: current.progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [layouts.screen.width, 0],
                }),
              },
            ],
            opacity: current.progress.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 1],
            }),
          },
        };
      },
    }}
  >
    <AuthStack.Screen name="Welcome" component={WelcomeScreen} />
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    <AuthStack.Screen name="CreateAccount" component={CreateAccountScreen} />
  </AuthStack.Navigator>
);

// =============================================
// ROOT NAVIGATOR
// =============================================

export const RootNavigator = ({ userType, isAuthenticated }) => (
  <NavigationContainer theme={navigationTheme}>
    <StatusBar 
      barStyle="light-content" 
      backgroundColor="#0F172A"
      translucent={Platform.OS === 'android'}
    />
    
    {!isAuthenticated ? (
      <AuthNavigator />
    ) : userType === 'customer' ? (
      <CustomerAppNavigator />
    ) : (
      <TechnicianAppNavigator />
    )}
  </NavigationContainer>
);

// =============================================
// STYLES
// =============================================

const styles = {
  // Tab Bar Styles
  tabBar: {
    position: 'relative',
    height: Platform.OS === 'ios' ? 90 : 70,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
  },
  
  tabBarGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  
  tabBarContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  tabIconContainer: {
    position: 'relative',
    padding: 8,
    borderRadius: 12,
  },
  
  tabIconContainerActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
  },
  
  tabBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  tabBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  
  // Drawer Styles
  drawerContainer: {
    flex: 1,
    backgroundColor: 'rgba(30, 41, 59, 0.95)',
  },
  
  drawerHeader: {
    height: 160,
    position: 'relative',
  },
  
  drawerHeaderGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  
  drawerHeaderContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  
  technicianAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  
  technicianName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  
  technicianRole: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  
  drawerItems: {
    flex: 1,
    paddingTop: 20,
  },
  
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginHorizontal: 12,
    borderRadius: 12,
  },
  
  drawerItemActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
  },
  
  drawerLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 16,
  },
  
  drawerFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  
  settingsText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginLeft: 12,
  },
  
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  
  logoutText: {
    fontSize: 16,
    color: '#EF4444',
    marginLeft: 12,
  },
};

export default RootNavigator;