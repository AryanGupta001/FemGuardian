import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Vibration,
  Platform,
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import auth from '@react-native-firebase/auth';
import { databaseService } from '../services/database';
import { sendEmergencyAlert } from '../services/api';
import type { UserProfile } from '../services/database';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';

const { width } = Dimensions.get('window');

const HomeScreen = () => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [sosActive, setSosActive] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    loadProfile();
    getCurrentLocation();
    // Watch position for continuous location updates
    const watchId = Geolocation.watchPosition(
      position => {
        const { latitude, longitude } = position.coords;
        setLocation({ latitude, longitude });
      },
      error => console.error(error),
      { enableHighAccuracy: true, distanceFilter: 10 }
    );

    return () => {
      Geolocation.clearWatch(watchId);
    };
  }, []);

  const loadProfile = async () => {
    try {
      const userId = auth().currentUser?.uid;
      if (!userId) return;

      const userProfile = await databaseService.getUserProfile(userId);
      setProfile(userProfile);
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const requestLocationPermission = async () => {
    try {
      const permission = Platform.select({
        android: PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
        ios: PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
      });
      
      if (!permission) {
        throw new Error('Platform not supported');
      }

      const result = await check(permission);
      
      if (result === RESULTS.DENIED) {
        const permissionResult = await request(permission);
        return permissionResult === RESULTS.GRANTED;
      }
      
      return result === RESULTS.GRANTED;
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return false;
    }
  };

  const getCurrentLocation = async () => {
    const hasPermission = await requestLocationPermission();
    
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Location permission is required for this feature.');
      return;
    }
    
    Geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;
        setLocation({ latitude, longitude });
      },
      error => {
        console.error(error);
        Alert.alert('Error', 'Failed to get location. Please enable location services.');
      },
      { enableHighAccuracy: true }
    );
  };

  const handleSOS = async () => {
    if (!location) {
      Alert.alert('Error', 'Unable to get your location. Please try again.');
      return;
    }

    try {
      // Vibrate the device
      Vibration.vibrate([0, 500, 200, 500]);
      
      const currentUser = auth().currentUser;
      if (!currentUser) {
        Alert.alert('Error', 'You must be logged in to use this feature');
        return;
      }

      const message = `Emergency Alert: User ${currentUser.uid} has triggered SOS at location: ${location.latitude}, ${location.longitude}`;
      await sendEmergencyAlert(message);

      setSosActive(true);
      Alert.alert(
        'SOS Activated',
        'Emergency contacts have been notified of your location.',
        [
          {
            text: 'Cancel Alert',
            onPress: handleCancelSOS,
            style: 'cancel',
          },
          { text: 'OK', onPress: () => {} },
        ]
      );
    } catch (error) {
      console.error('Error activating SOS:', error);
      Alert.alert('Error', 'Failed to activate SOS. Please try again.');
    }
  };

  const handleCancelSOS = async () => {
    try {
      setSosActive(false);
      Alert.alert('Alert Cancelled', 'Your emergency alert has been cancelled.');
    } catch (error) {
      console.error('Error cancelling SOS:', error);
      Alert.alert('Error', 'Failed to cancel alert. Please try again.');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e91e63" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome back,</Text>
        <Text style={styles.nameText}>{profile?.name}</Text>
      </View>

      <View style={styles.sosContainer}>
        <TouchableOpacity
          style={[styles.sosButton, sosActive && styles.sosButtonActive]}
          onPress={handleSOS}
        >
          <Icon name="warning" size={50} color="#fff" />
          <Text style={styles.sosButtonText}>
            {sosActive ? 'SOS ACTIVE' : 'PRESS FOR SOS'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Emergency Contacts</Text>
        {(profile?.emergencyContacts || []).map((contact, index) => (
          <View key={index} style={styles.contactCard}>
            <Icon name="person" size={24} color="#666" />
            <View style={styles.contactInfo}>
              <Text style={styles.contactName}>{contact.name}</Text>
              <Text style={styles.contactPhone}>{contact.phoneNumber}</Text>
            </View>
          </View>
        ))}
        {(!profile?.emergencyContacts || profile.emergencyContacts.length === 0) && (
          <Text style={styles.noContacts}>No emergency contacts added</Text>
        )}
      </View>

      {location && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Location</Text>
          <View style={styles.locationCard}>
            <Icon name="location-on" size={24} color="#666" />
            <Text style={styles.locationText}>
              Lat: {location.latitude.toFixed(6)}{'\n'}
              Long: {location.longitude.toFixed(6)}
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  welcomeText: {
    fontSize: 16,
    color: '#666',
  },
  nameText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  sosContainer: {
    padding: 20,
    alignItems: 'center',
  },
  sosButton: {
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: '#e91e63',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  sosButtonActive: {
    backgroundColor: '#f44336',
  },
  sosButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10,
  },
  section: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  contactInfo: {
    marginLeft: 15,
  },
  contactName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  contactPhone: {
    fontSize: 14,
    color: '#666',
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
  },
  locationText: {
    marginLeft: 15,
    fontSize: 14,
    color: '#666',
  },
  noContacts: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
  },
});

export default HomeScreen; 