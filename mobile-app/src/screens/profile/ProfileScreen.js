import React from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { List, Avatar, Text, Button, Divider, Switch } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const [notifications, setNotifications] = React.useState(true);
  const [darkMode, setDarkMode] = React.useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            dispatch(logout());
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Avatar.Text
          size={80}
          label={user?.name ? user.name.substring(0, 2).toUpperCase() : 'TC'}
          style={styles.avatar}
        />
        <Text style={styles.name}>{user?.name || 'Technician'}</Text>
        <Text style={styles.role}>{user?.role || 'Technician'}</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Account Section */}
        <List.Section>
          <List.Subheader>Account</List.Subheader>
          <List.Item
            title="Email"
            description={user?.email || 'Not set'}
            left={(props) => <List.Icon {...props} icon="email" />}
          />
          <List.Item
            title="Phone"
            description={user?.phone || 'Not set'}
            left={(props) => <List.Icon {...props} icon="phone" />}
          />
          <List.Item
            title="Employee ID"
            description={user?.employee_id || 'Not set'}
            left={(props) => <List.Icon {...props} icon="badge-account" />}
          />
        </List.Section>

        <Divider />

        {/* Settings Section */}
        <List.Section>
          <List.Subheader>Settings</List.Subheader>
          <List.Item
            title="Push Notifications"
            description="Receive job updates and alerts"
            left={(props) => <List.Icon {...props} icon="bell" />}
            right={() => (
              <Switch
                value={notifications}
                onValueChange={setNotifications}
              />
            )}
          />
          <List.Item
            title="Dark Mode"
            description="Use dark theme"
            left={(props) => <List.Icon {...props} icon="theme-light-dark" />}
            right={() => (
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
              />
            )}
          />
        </List.Section>

        <Divider />

        {/* Stats Section */}
        <List.Section>
          <List.Subheader>This Week</List.Subheader>
          <List.Item
            title="Jobs Completed"
            description="12 jobs"
            left={(props) => <List.Icon {...props} icon="check-circle" color="#388e3c" />}
          />
          <List.Item
            title="Hours Logged"
            description="38.5 hours"
            left={(props) => <List.Icon {...props} icon="clock" color="#1976d2" />}
          />
          <List.Item
            title="Efficiency"
            description="95%"
            left={(props) => <List.Icon {...props} icon="speedometer" color="#f57c00" />}
          />
        </List.Section>

        <Divider />

        {/* About Section */}
        <List.Section>
          <List.Subheader>About</List.Subheader>
          <List.Item
            title="App Version"
            description="1.0.0"
            left={(props) => <List.Icon {...props} icon="information" />}
          />
          <List.Item
            title="Help & Support"
            left={(props) => <List.Icon {...props} icon="help-circle" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => Alert.alert('Help', 'Contact support@collisionos.com')}
          />
          <List.Item
            title="Terms of Service"
            left={(props) => <List.Icon {...props} icon="file-document" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
          />
          <List.Item
            title="Privacy Policy"
            left={(props) => <List.Icon {...props} icon="shield-check" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
          />
        </List.Section>

        {/* Logout Button */}
        <View style={styles.logoutContainer}>
          <Button
            mode="contained"
            icon="logout"
            onPress={handleLogout}
            buttonColor="#d32f2f"
            style={styles.logoutButton}
          >
            Logout
          </Button>
        </View>

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
    alignItems: 'center',
    paddingVertical: 40,
    paddingTop: 60,
  },
  avatar: {
    backgroundColor: '#1565c0',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 15,
  },
  role: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 5,
  },
  content: {
    flex: 1,
  },
  logoutContainer: {
    padding: 20,
    marginTop: 20,
  },
  logoutButton: {
    paddingVertical: 5,
  },
});
