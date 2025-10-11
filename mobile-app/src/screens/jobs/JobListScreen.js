import React, { useEffect, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import {
  Card,
  Text,
  Chip,
  ActivityIndicator,
  Searchbar,
  FAB,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { fetchJobs } from '../../store/slices/jobsSlice';
import { Ionicons } from '@expo/vector-icons';

export default function JobListScreen() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { jobs, loading } = useSelector((state) => state.jobs);
  const user = useSelector((state) => state.auth.user);

  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      await dispatch(fetchJobs({ technicianId: user.id })).unwrap();
    } catch (error) {
      console.error('Failed to load jobs:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadJobs();
    setRefreshing(false);
  };

  const getStatusColor = (status) => {
    const colors = {
      'not_started': '#757575',
      'in_progress': '#1976d2',
      'waiting_parts': '#f57c00',
      'completed': '#388e3c',
      'on_hold': '#d32f2f',
    };
    return colors[status] || '#757575';
  };

  const getStatusIcon = (status) => {
    const icons = {
      'not_started': 'time-outline',
      'in_progress': 'construct',
      'waiting_parts': 'pause-circle-outline',
      'completed': 'checkmark-circle',
      'on_hold': 'alert-circle-outline',
    };
    return icons[status] || 'time-outline';
  };

  const filteredJobs = jobs.filter((job) =>
    job.ro_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.vehicle_info?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderJobCard = ({ item }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('JobDetail', { jobId: item.id })}
    >
      <Card style={styles.card}>
        <Card.Content>
          {/* Header */}
          <View style={styles.cardHeader}>
            <Text style={styles.roNumber}>RO #{item.ro_number}</Text>
            <Chip
              icon={() => (
                <Ionicons
                  name={getStatusIcon(item.status)}
                  size={16}
                  color="white"
                />
              )}
              style={{ backgroundColor: getStatusColor(item.status) }}
              textStyle={{ color: 'white' }}
            >
              {item.status_label}
            </Chip>
          </View>

          {/* Vehicle Info */}
          <View style={styles.vehicleInfo}>
            <Ionicons name="car" size={20} color="#666" />
            <Text style={styles.vehicleText}>
              {item.vehicle_year} {item.vehicle_make} {item.vehicle_model}
            </Text>
          </View>

          {/* Customer Info */}
          <View style={styles.customerInfo}>
            <Ionicons name="person" size={20} color="#666" />
            <Text style={styles.customerText}>{item.customer_name}</Text>
          </View>

          {/* Parts Status */}
          {item.parts_status && (
            <View style={styles.partsStatus}>
              <Ionicons
                name={
                  item.parts_status === 'all_received'
                    ? 'checkmark-circle'
                    : 'time'
                }
                size={20}
                color={
                  item.parts_status === 'all_received' ? '#388e3c' : '#f57c00'
                }
              />
              <Text style={styles.partsText}>
                Parts: {item.parts_status_label}
              </Text>
            </View>
          )}

          {/* Time Info */}
          <View style={styles.timeInfo}>
            <Ionicons name="time-outline" size={16} color="#999" />
            <Text style={styles.timeText}>
              Started: {item.started_at || 'Not started'}
            </Text>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1976d2" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Jobs</Text>
        <Text style={styles.headerSubtitle}>
          {filteredJobs.length} active jobs
        </Text>
      </View>

      {/* Search */}
      <Searchbar
        placeholder="Search by RO, customer, or vehicle"
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />

      {/* Job List */}
      <FlatList
        data={filteredJobs}
        renderItem={renderJobCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="briefcase-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No jobs assigned</Text>
          </View>
        }
      />

      {/* Floating Action Button for Refresh */}
      <FAB
        icon="refresh"
        style={styles.fab}
        onPress={loadJobs}
        color="white"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#1976d2',
    padding: 20,
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 5,
  },
  searchbar: {
    margin: 15,
    elevation: 2,
  },
  list: {
    padding: 15,
    paddingTop: 5,
  },
  card: {
    marginBottom: 15,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  roNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  vehicleText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  customerText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  partsStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  partsText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  timeText: {
    marginLeft: 5,
    fontSize: 12,
    color: '#999',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    marginTop: 15,
    fontSize: 16,
    color: '#999',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#1976d2',
  },
});
