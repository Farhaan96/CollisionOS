import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import {
  Text,
  Button,
  Card,
  Chip,
  List,
  Divider,
  ActivityIndicator,
} from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { clockIn, clockOut, fetchTimeEntries } from '../../store/slices/timeClockSlice';

export default function TimeClockScreen() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const { currentEntry, todayEntries, loading } = useSelector(
    (state) => state.timeClock
  );

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Update current time every second
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    loadTodayEntries();

    return () => clearInterval(interval);
  }, []);

  const loadTodayEntries = async () => {
    try {
      await dispatch(fetchTimeEntries()).unwrap();
    } catch (error) {
      console.error('Failed to load time entries:', error);
    }
  };

  const handleClockIn = async (jobId = null) => {
    try {
      await dispatch(clockIn({ jobId })).unwrap();
      Alert.alert('Success', 'Clocked in successfully');
      loadTodayEntries();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to clock in');
    }
  };

  const handleClockOut = async () => {
    Alert.alert(
      'Clock Out',
      'Are you sure you want to clock out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clock Out',
          onPress: async () => {
            try {
              await dispatch(clockOut()).unwrap();
              Alert.alert('Success', 'Clocked out successfully');
              loadTodayEntries();
            } catch (error) {
              Alert.alert('Error', error.message || 'Failed to clock out');
            }
          },
        },
      ]
    );
  };

  const calculateDuration = (startTime, endTime = null) => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : currentTime;
    const diff = Math.floor((end - start) / 1000 / 60); // minutes
    const hours = Math.floor(diff / 60);
    const minutes = diff % 60;
    return `${hours}h ${minutes}m`;
  };

  const calculateTotalHours = () => {
    if (!todayEntries || todayEntries.length === 0) return '0h 0m';

    let totalMinutes = 0;
    todayEntries.forEach((entry) => {
      const start = new Date(entry.clock_in);
      const end = entry.clock_out ? new Date(entry.clock_out) : currentTime;
      totalMinutes += Math.floor((end - start) / 1000 / 60);
    });

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
  };

  const isClockedIn = !!currentEntry;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Time Clock</Text>
        <Text style={styles.headerSubtitle}>
          {currentTime.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Current Status Card */}
        <Card style={styles.card}>
          <Card.Content>
            {/* Clock Display */}
            <Text style={styles.clockDisplay}>
              {currentTime.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </Text>

            {/* Status */}
            <View style={styles.statusContainer}>
              {isClockedIn ? (
                <>
                  <Chip
                    icon={() => (
                      <View style={styles.pulsingDot}>
                        <View style={styles.pulsingDotInner} />
                      </View>
                    )}
                    style={styles.activeChip}
                    textStyle={{ color: 'white' }}
                  >
                    CLOCKED IN
                  </Chip>
                  <Text style={styles.duration}>
                    {calculateDuration(currentEntry.clock_in)}
                  </Text>
                  {currentEntry.job_id && (
                    <Text style={styles.jobInfo}>
                      Working on: RO #{currentEntry.ro_number}
                    </Text>
                  )}
                </>
              ) : (
                <Chip
                  icon="clock-outline"
                  style={styles.inactiveChip}
                  textStyle={{ color: '#666' }}
                >
                  Not Clocked In
                </Chip>
              )}
            </View>

            <Divider style={styles.divider} />

            {/* Clock In/Out Button */}
            {isClockedIn ? (
              <Button
                mode="contained"
                icon="clock-out"
                onPress={handleClockOut}
                style={styles.clockButton}
                buttonColor="#d32f2f"
                disabled={loading}
              >
                Clock Out
              </Button>
            ) : (
              <Button
                mode="contained"
                icon="clock-in"
                onPress={() => handleClockIn()}
                style={styles.clockButton}
                disabled={loading}
              >
                Clock In
              </Button>
            )}
          </Card.Content>
        </Card>

        {/* Today's Summary */}
        <Card style={styles.card}>
          <Card.Title
            title="Today's Summary"
            left={(props) => (
              <Ionicons name="calendar-outline" size={24} color="#1976d2" />
            )}
          />
          <Card.Content>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total Hours</Text>
                <Text style={styles.summaryValue}>{calculateTotalHours()}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Clock-ins</Text>
                <Text style={styles.summaryValue}>
                  {todayEntries?.length || 0}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Today's Time Entries */}
        <Card style={styles.card}>
          <Card.Title
            title="Time Entries"
            left={(props) => (
              <Ionicons name="time-outline" size={24} color="#1976d2" />
            )}
          />
          <Card.Content>
            {loading ? (
              <ActivityIndicator size="small" color="#1976d2" />
            ) : todayEntries && todayEntries.length > 0 ? (
              todayEntries.map((entry, index) => (
                <View key={index}>
                  <List.Item
                    title={
                      entry.job_id
                        ? `RO #${entry.ro_number}`
                        : 'General Time'
                    }
                    description={`${new Date(
                      entry.clock_in
                    ).toLocaleTimeString()} - ${
                      entry.clock_out
                        ? new Date(entry.clock_out).toLocaleTimeString()
                        : 'In Progress'
                    }`}
                    left={(props) => (
                      <List.Icon
                        {...props}
                        icon={entry.clock_out ? 'check-circle' : 'clock'}
                        color={entry.clock_out ? '#388e3c' : '#1976d2'}
                      />
                    )}
                    right={(props) => (
                      <Text style={styles.entryDuration}>
                        {calculateDuration(entry.clock_in, entry.clock_out)}
                      </Text>
                    )}
                  />
                  {index < todayEntries.length - 1 && <Divider />}
                </View>
              ))
            ) : (
              <Text style={styles.noData}>No time entries today</Text>
            )}
          </Card.Content>
        </Card>

        {/* Tips */}
        <Card style={styles.card}>
          <Card.Title
            title="Tips"
            left={(props) => (
              <Ionicons name="information-circle-outline" size={24} color="#1976d2" />
            )}
          />
          <Card.Content>
            <Text style={styles.tipText}>
              • Clock in when you start working on a job{'\n'}
              • Clock out when taking breaks or finishing work{'\n'}
              • Time is automatically tracked per job{'\n'}
              • Your hours are synced to the office system
            </Text>
          </Card.Content>
        </Card>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  content: {
    flex: 1,
  },
  card: {
    margin: 15,
    marginBottom: 0,
  },
  clockDisplay: {
    fontSize: 48,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#1976d2',
    marginVertical: 10,
  },
  statusContainer: {
    alignItems: 'center',
    marginVertical: 15,
  },
  activeChip: {
    backgroundColor: '#388e3c',
  },
  inactiveChip: {
    backgroundColor: '#e0e0e0',
  },
  pulsingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulsingDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#388e3c',
  },
  duration: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  jobInfo: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  divider: {
    marginVertical: 15,
  },
  clockButton: {
    paddingVertical: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  entryDuration: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  noData: {
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
});
