import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Text,
  Button,
  Card,
  Chip,
  Divider,
  List,
  ActivityIndicator,
  FAB,
} from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { fetchJobDetails, updateJobStatus, uploadPhoto } from '../../store/slices/jobsSlice';

export default function JobDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { jobId } = route.params;

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadJobDetails();
  }, [jobId]);

  const loadJobDetails = async () => {
    try {
      const result = await dispatch(fetchJobDetails(jobId)).unwrap();
      setJob(result);
    } catch (error) {
      console.error('Failed to load job details:', error);
      Alert.alert('Error', 'Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  const handleTakePhoto = async () => {
    // Request camera permission
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera permission is required to take photos');
      return;
    }

    // Launch camera
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
    });

    if (!result.canceled) {
      uploadPhotoToJob(result.assets[0]);
    }
  };

  const handleSelectPhoto = async () => {
    // Request media library permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Photo library permission is required');
      return;
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsMultipleSelection: true,
    });

    if (!result.canceled) {
      result.assets.forEach((asset) => uploadPhotoToJob(asset));
    }
  };

  const uploadPhotoToJob = async (asset) => {
    setUploading(true);
    try {
      await dispatch(
        uploadPhoto({
          jobId,
          uri: asset.uri,
          type: 'image/jpeg',
          name: `job_${jobId}_${Date.now()}.jpg`,
        })
      ).unwrap();

      Alert.alert('Success', 'Photo uploaded successfully');
      loadJobDetails(); // Reload to show new photo
    } catch (error) {
      Alert.alert('Upload Failed', error.message || 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await dispatch(
        updateJobStatus({ jobId, status: newStatus })
      ).unwrap();

      Alert.alert('Success', 'Job status updated');
      loadJobDetails();
    } catch (error) {
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const confirmStatusChange = (newStatus, label) => {
    Alert.alert(
      'Update Status',
      `Change job status to "${label}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: () => handleStatusChange(newStatus) },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1976d2" />
      </View>
    );
  }

  if (!job) {
    return (
      <View style={styles.centerContainer}>
        <Text>Job not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header Card */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.header}>
              <Text style={styles.roNumber}>RO #{job.ro_number}</Text>
              <Chip
                style={{
                  backgroundColor:
                    job.status === 'completed' ? '#388e3c' : '#1976d2',
                }}
                textStyle={{ color: 'white' }}
              >
                {job.status_label}
              </Chip>
            </View>

            <Divider style={styles.divider} />

            {/* Vehicle Info */}
            <View style={styles.infoRow}>
              <Ionicons name="car" size={24} color="#1976d2" />
              <View style={styles.infoText}>
                <Text style={styles.label}>Vehicle</Text>
                <Text style={styles.value}>
                  {job.vehicle_year} {job.vehicle_make} {job.vehicle_model}
                </Text>
                <Text style={styles.subValue}>VIN: {job.vin}</Text>
              </View>
            </View>

            {/* Customer Info */}
            <View style={styles.infoRow}>
              <Ionicons name="person" size={24} color="#1976d2" />
              <View style={styles.infoText}>
                <Text style={styles.label}>Customer</Text>
                <Text style={styles.value}>{job.customer_name}</Text>
                {job.customer_phone && (
                  <Text style={styles.subValue}>{job.customer_phone}</Text>
                )}
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Tasks/Parts Card */}
        <Card style={styles.card}>
          <Card.Title
            title="Tasks & Parts"
            left={(props) => <Ionicons name="list" size={24} color="#1976d2" />}
          />
          <Card.Content>
            {job.tasks && job.tasks.length > 0 ? (
              job.tasks.map((task, index) => (
                <List.Item
                  key={index}
                  title={task.description}
                  description={task.notes}
                  left={(props) => (
                    <List.Icon
                      {...props}
                      icon={task.completed ? 'check-circle' : 'circle-outline'}
                      color={task.completed ? '#388e3c' : '#999'}
                    />
                  )}
                  right={(props) => (
                    <Text style={styles.laborHours}>{task.labor_hours}h</Text>
                  )}
                />
              ))
            ) : (
              <Text style={styles.noData}>No tasks assigned</Text>
            )}
          </Card.Content>
        </Card>

        {/* Photos Card */}
        <Card style={styles.card}>
          <Card.Title
            title="Photos"
            left={(props) => <Ionicons name="images" size={24} color="#1976d2" />}
            right={(props) => (
              <Text style={styles.photoCount}>
                {job.photos?.length || 0} photos
              </Text>
            )}
          />
          <Card.Content>
            {job.photos && job.photos.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {job.photos.map((photo, index) => (
                  <TouchableOpacity key={index}>
                    <Image
                      source={{ uri: photo.url }}
                      style={styles.thumbnail}
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <Text style={styles.noData}>No photos yet</Text>
            )}
          </Card.Content>
        </Card>

        {/* Notes Card */}
        {job.notes && (
          <Card style={styles.card}>
            <Card.Title
              title="Notes"
              left={(props) => (
                <Ionicons name="document-text" size={24} color="#1976d2" />
              )}
            />
            <Card.Content>
              <Text>{job.notes}</Text>
            </Card.Content>
          </Card>
        )}

        {/* Quick Actions */}
        <Card style={styles.card}>
          <Card.Title title="Quick Actions" />
          <Card.Content>
            <View style={styles.actionButtons}>
              {job.status === 'not_started' && (
                <Button
                  mode="contained"
                  icon="play"
                  onPress={() =>
                    confirmStatusChange('in_progress', 'In Progress')
                  }
                  style={styles.actionButton}
                >
                  Start Job
                </Button>
              )}

              {job.status === 'in_progress' && (
                <>
                  <Button
                    mode="contained"
                    icon="pause"
                    onPress={() =>
                      confirmStatusChange('waiting_parts', 'Waiting for Parts')
                    }
                    style={styles.actionButton}
                    buttonColor="#f57c00"
                  >
                    Waiting Parts
                  </Button>

                  <Button
                    mode="contained"
                    icon="check"
                    onPress={() => confirmStatusChange('completed', 'Completed')}
                    style={styles.actionButton}
                    buttonColor="#388e3c"
                  >
                    Complete
                  </Button>
                </>
              )}

              {job.status === 'waiting_parts' && (
                <Button
                  mode="contained"
                  icon="play"
                  onPress={() =>
                    confirmStatusChange('in_progress', 'In Progress')
                  }
                  style={styles.actionButton}
                >
                  Resume Job
                </Button>
              )}
            </View>
          </Card.Content>
        </Card>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Action Buttons */}
      <FAB.Group
        open={false}
        icon="camera"
        actions={[
          {
            icon: 'camera',
            label: 'Take Photo',
            onPress: handleTakePhoto,
          },
          {
            icon: 'image',
            label: 'Choose Photo',
            onPress: handleSelectPhoto,
          },
        ]}
        onStateChange={() => {}}
        style={styles.fabGroup}
        fabStyle={{ backgroundColor: '#1976d2' }}
        loading={uploading}
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
  scrollView: {
    flex: 1,
  },
  card: {
    margin: 15,
    marginBottom: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  divider: {
    marginVertical: 15,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  infoText: {
    marginLeft: 15,
    flex: 1,
  },
  label: {
    fontSize: 12,
    color: '#999',
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 16,
    color: '#333',
    marginTop: 2,
  },
  subValue: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  laborHours: {
    fontSize: 14,
    color: '#1976d2',
    fontWeight: 'bold',
  },
  noData: {
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
  },
  photoCount: {
    fontSize: 14,
    color: '#666',
    marginRight: 15,
  },
  thumbnail: {
    width: 120,
    height: 120,
    borderRadius: 8,
    marginRight: 10,
  },
  actionButtons: {
    gap: 10,
  },
  actionButton: {
    marginBottom: 10,
  },
  fabGroup: {
    paddingBottom: 20,
  },
});
