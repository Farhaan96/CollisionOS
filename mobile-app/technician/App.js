
// CollisionOS Technician Mobile App
// React Native implementation

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
  SafeAreaView
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

// Main Technician App Component
const TechnicianApp = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [user, setUser] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Check network connectivity
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected);
    });

    // Load user data
    loadUserData();
    loadJobs();

    return unsubscribe;
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };

  const loadJobs = async () => {
    try {
      if (isOnline) {
        // Fetch from API
        const response = await fetch('/api/technician/jobs', {
          headers: { Authorization: `Bearer ${user?.token}` }
        });
        const data = await response.json();
        setJobs(data.jobs || []);
        
        // Cache for offline use
        await AsyncStorage.setItem('jobs', JSON.stringify(data.jobs));
      } else {
        // Load from cache
        const cachedJobs = await AsyncStorage.getItem('jobs');
        if (cachedJobs) {
          setJobs(JSON.parse(cachedJobs));
        }
      }
    } catch (error) {
      console.error('Failed to load jobs:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadJobs();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <NavigationContainer>
        <Tab.Navigator>
          <Tab.Screen 
            name="Jobs" 
            component={JobsScreen} 
            options={{
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="list" size={size} color={color} />
              )
            }}
          />
          <Tab.Screen 
            name="TimeClock" 
            component={TimeClockScreen}
            options={{
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="time" size={size} color={color} />
              )
            }}
          />
          <Tab.Screen 
            name="Photos" 
            component={PhotosScreen}
            options={{
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="camera" size={size} color={color} />
              )
            }}
          />
          <Tab.Screen 
            name="Profile" 
            component={ProfileScreen}
            options={{
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="person" size={size} color={color} />
              )
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaView>
  );
};

// Jobs Screen Component
const JobsScreen = ({ navigation }) => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      const response = await fetch('/api/technician/jobs');
      const data = await response.json();
      setJobs(data.jobs || []);
    } catch (error) {
      console.error('Failed to load jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateJobStatus = async (jobId, status) => {
    try {
      await fetch(`/api/technician/jobs/${jobId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      
      // Update local state
      setJobs(jobs.map(job => 
        job.id === jobId ? { ...job, status } : job
      ));
    } catch (error) {
      Alert.alert('Error', 'Failed to update job status');
    }
  };

  const renderJob = ({ item }) => (
    <TouchableOpacity 
      style={styles.jobCard}
      onPress={() => navigation.navigate('JobDetails', { jobId: item.id })}
    >
      <View style={styles.jobHeader}>
        <Text style={styles.jobNumber}>{item.ro_number}</Text>
        <Text style={styles.jobStatus}>{item.status}</Text>
      </View>
      <Text style={styles.customerName}>{item.customer_name}</Text>
      <Text style={styles.vehicleInfo}>{item.vehicle_info}</Text>
      <View style={styles.jobActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => updateJobStatus(item.id, 'in_progress')}
        >
          <Text style={styles.actionText}>Start</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => updateJobStatus(item.id, 'completed')}
        >
          <Text style={styles.actionText}>Complete</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.screen}>
      <Text style={styles.screenTitle}>My Jobs</Text>
      <FlatList
        data={jobs}
        renderItem={renderJob}
        keyExtractor={item => item.id}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadJobs} />
        }
      />
    </View>
  );
};

// Time Clock Screen Component
const TimeClockScreen = () => {
  const [clockedIn, setClockedIn] = useState(false);
  const [currentJob, setCurrentJob] = useState(null);
  const [timeEntries, setTimeEntries] = useState([]);

  const clockIn = async (jobId) => {
    try {
      const response = await fetch('/api/technician/timeclock/clock-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: jobId })
      });
      
      if (response.ok) {
        setClockedIn(true);
        setCurrentJob(jobId);
        Alert.alert('Success', 'Clocked in successfully');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to clock in');
    }
  };

  const clockOut = async () => {
    try {
      const response = await fetch('/api/technician/timeclock/clock-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: currentJob })
      });
      
      if (response.ok) {
        setClockedIn(false);
        setCurrentJob(null);
        Alert.alert('Success', 'Clocked out successfully');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to clock out');
    }
  };

  return (
    <View style={styles.screen}>
      <Text style={styles.screenTitle}>Time Clock</Text>
      
      <View style={styles.timeClockCard}>
        <Text style={styles.clockStatus}>
          {clockedIn ? 'Clocked In' : 'Clocked Out'}
        </Text>
        
        {!clockedIn ? (
          <TouchableOpacity style={styles.clockButton} onPress={clockIn}>
            <Text style={styles.clockButtonText}>Clock In</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.clockOutButton} onPress={clockOut}>
            <Text style={styles.clockButtonText}>Clock Out</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// Photos Screen Component
const PhotosScreen = () => {
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);

  const takePhoto = async () => {
    try {
      // Camera implementation
      const result = await ImagePicker.launchCamera({
        mediaType: 'photo',
        quality: 0.8
      });
      
      if (!result.cancelled) {
        await uploadPhoto(result.uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const uploadPhoto = async (uri) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('photo', {
        uri,
        type: 'image/jpeg',
        name: 'photo.jpg'
      });
      
      const response = await fetch('/api/technician/photos', {
        method: 'POST',
        body: formData,
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (response.ok) {
        const newPhoto = await response.json();
        setPhotos([...photos, newPhoto]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <Text style={styles.screenTitle}>Photos</Text>
      
      <TouchableOpacity style={styles.cameraButton} onPress={takePhoto}>
        <Ionicons name="camera" size={24} color="white" />
        <Text style={styles.cameraButtonText}>Take Photo</Text>
      </TouchableOpacity>
      
      <FlatList
        data={photos}
        renderItem={({ item }) => (
          <Image source={{ uri: item.url }} style={styles.photo} />
        )}
        keyExtractor={item => item.id}
        numColumns={2}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  screen: {
    flex: 1,
    padding: 16
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16
  },
  jobCard: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  jobNumber: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  jobStatus: {
    fontSize: 14,
    color: '#666'
  },
  customerName: {
    fontSize: 16,
    marginBottom: 4
  },
  vehicleInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12
  },
  jobActions: {
    flexDirection: 'row',
    justifyContent: 'space-around'
  },
  actionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4
  },
  actionText: {
    color: 'white',
    fontWeight: 'bold'
  },
  timeClockCard: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  clockStatus: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16
  },
  clockButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8
  },
  clockOutButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8
  },
  clockButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold'
  },
  cameraButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16
  },
  cameraButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8
  },
  photo: {
    width: 150,
    height: 150,
    margin: 4,
    borderRadius: 8
  }
});

export default TechnicianApp;
