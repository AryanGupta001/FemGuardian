import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  Dimensions,
  Platform,
  Linking,
  Animated,
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import auth from '@react-native-firebase/auth';
import { databaseService } from '../services/database';
import { sendSOS } from '../services/api';
import type { UserProfile } from '../services/database';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import ErrorHandler from '../utils/errorHandling';
import SkeletonLoader from '../components/SkeletonLoader';
import Button from '../components/Button';
import Card from '../components/Card';
import { colors } from '../theme/colors';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

const { width } = Dimensions.get('window');

interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const HomeScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [sosActive, setSosActive] = useState(false);
  const [location, setLocation] = useState<Location | null>(null);
  const [sendingSOS, setSendingSOS] = useState(false);
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    initializeScreen();
  }, []);

  useEffect(() => {
    if (sosActive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [sosActive]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadProfile();
    });

    return unsubscribe;
  }, [navigation]);

  const initializeScreen = async () => {
    try {
      await Promise.all([
        loadProfile(),
        requestLocationPermission()
      ]);
    } catch (error) {
      ErrorHandler.handle(error);
    } finally {
      setLoading(false);
    }
  };

  const loadProfile = async () => {
    const userId = auth().currentUser?.uid;
    if (!userId) throw new Error('User not authenticated');

    const userProfile = await databaseService.getUserProfile(userId);
    if (!userProfile) throw new Error('Profile not found');
    
    setProfile(userProfile);
  };

  const requestLocationPermission = async () => {
    const permission = Platform.select({
      android: PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
      ios: PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
    });

    if (!permission) throw new Error('Platform not supported');

    const result = await check(permission);
    
    if (result === RESULTS.DENIED) {
      const permissionResult = await request(permission);
      if (permissionResult !== RESULTS.GRANTED) {
        throw new Error('Location permission denied');
      }
    } else if (result !== RESULTS.GRANTED) {
      throw new Error('Location permission not granted');
    }

    await getCurrentLocation();
  };

  const getAddressFromCoordinates = async (latitude: number, longitude: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
      );
      const data = await response.json();
      return data.display_name || 'Address not found';
    } catch (error) {
      console.error('Error getting address:', error);
      return 'Unable to get address';
    }
  };

  const getCurrentLocation = async () => {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        async position => {
          try {
            const address = await getAddressFromCoordinates(
              position.coords.latitude,
              position.coords.longitude
            );
            setLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              address,
            });
            resolve(undefined);
          } catch (error) {
            reject(error);
          }
        },
        error => reject(error),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    });
  };

  const handleSOS = async () => {
    if (!location || !profile) {
      ErrorHandler.handle(new Error(!location ? 'No location available' : 'No profile available'), {
        title: !location ? 'Location Required' : 'Profile Required',
        defaultMessage: !location 
          ? 'Unable to send SOS without location. Please enable location services.'
          : 'Unable to send SOS without user profile.',
        retry: !location ? getCurrentLocation : loadProfile,
      });
      return;
    }

    setSendingSOS(true);
    try {
      const message = `Emergency Alert: ${profile.name} needs immediate assistance!`;
      await sendSOS(location, message);

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
          { text: 'OK' },
        ]
      );
    } catch (error) {
      ErrorHandler.handle(error, {
        title: 'SOS Error',
        defaultMessage: 'Failed to send SOS. Please try again.',
        retry: handleSOS,
      });
    } finally {
      setSendingSOS(false);
    }
  };

  const handleCancelSOS = () => {
    setSosActive(false);
    Alert.alert('Alert Cancelled', 'Your emergency alert has been cancelled.');
  };

  const handleCall = async (phoneNumber: string) => {
    try {
      const url = `tel:${phoneNumber}`;
      const supported = await Linking.canOpenURL(url);
      
      if (!supported) {
        throw new Error('Phone calls are not supported on this device');
      }
      
      await Linking.openURL(url);
    } catch (error) {
      ErrorHandler.handle(error, {
        title: 'Call Error',
        defaultMessage: 'Failed to initiate call. Please try again.',
      });
    }
  };

  if (loading) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <SkeletonLoader width={120} height={16} style={styles.skeletonText} />
          <SkeletonLoader width={200} height={24} style={styles.skeletonText} />
        </View>

        <View style={styles.sosContainer}>
          <View style={[styles.sosButton, styles.skeletonButton]}>
            <SkeletonLoader width={width * 0.7} height={width * 0.7} borderRadius={width * 0.35} />
          </View>
        </View>

        <View style={styles.section}>
          <SkeletonLoader width={150} height={20} style={styles.skeletonTitle} />
          {[1, 2, 3].map((index) => (
            <View key={index} style={styles.contactCard}>
              <View style={styles.contactInfo}>
                <SkeletonLoader width={120} height={16} style={styles.skeletonText} />
                <SkeletonLoader width={100} height={14} style={styles.skeletonText} />
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <SkeletonLoader width={120} height={20} style={styles.skeletonTitle} />
          <View style={styles.locationCard}>
            <View style={styles.contactInfo}>
              <SkeletonLoader width={150} height={14} style={styles.skeletonText} />
            </View>
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome back,</Text>
        <Text style={styles.nameText}>{profile?.name}</Text>
      </View>

      <View style={styles.sosContainer}>
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <Button
            onPress={handleSOS}
            title={sendingSOS ? 'Sending SOS...' : 'SOS'}
            variant={sosActive ? 'danger' : 'primary'}
            size="large"
            loading={sendingSOS}
            disabled={!location}
            style={sosActive ? styles.sosButtonActive : styles.sosButton}
            textStyle={sosActive ? styles.sosButtonTextActive : styles.sosButtonText}
          />
        </Animated.View>
        {!location && (
          <Text style={styles.sosDisabledText}>
            Enable location access to activate SOS
          </Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Emergency Contacts</Text>
        {profile?.emergencyContacts?.length ? (
          profile.emergencyContacts.map((contact, index) => (
            <Card key={index} variant="elevated" style={styles.contactCardContainer}>
              <View style={styles.contactCard}>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactName}>{contact.name}</Text>
                  <Text style={styles.contactPhone}>{contact.phoneNumber}</Text>
                </View>
                <Button
                  onPress={() => handleCall(contact.phoneNumber)}
                  title="Call"
                  variant="outline"
                  size="small"
                  style={styles.callButton}
                />
              </View>
            </Card>
          ))
        ) : (
          <Card variant="outlined" style={styles.noContactsCard}>
            <Text style={styles.noContacts}>No emergency contacts added</Text>
            <Button
              onPress={() => navigation.navigate('Profile')}
              title="Add Contact"
              variant="primary"
              size="small"
              style={styles.addContactButton}
            />
          </Card>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Location</Text>
        <Card variant="elevated" style={styles.locationCardContainer}>
          <View style={styles.locationCard}>
            <View style={styles.locationInfo}>
              <Text style={styles.addressLabel}>Current Address</Text>
              <Text style={styles.addressText}>
                {location?.address || 'Fetching address...'}
              </Text>
              <View style={styles.divider} />
              <Text style={styles.coordinatesLabel}>Coordinates</Text>
              <Text style={styles.coordinatesText}>
                {location ? `${location.latitude}, ${location.longitude}` : 'Fetching location...'}
              </Text>
            </View>
            <Button
              onPress={getCurrentLocation}
              title="Update"
              variant="outline"
              size="small"
              style={styles.updateLocationButton}
            />
          </View>
        </Card>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 48 : 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  welcomeText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  nameText: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text.primary,
  },
  sosContainer: {
    padding: 12,
    alignItems: 'center',
  },
  sosButton: {
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: width * 0.35,
    elevation: 8,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  sosButtonActive: {
    elevation: 12,
    shadowOpacity: 0.5,
    shadowRadius: 8,
    backgroundColor: colors.danger,
  },
  sosButtonText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  sosButtonTextActive: {
    fontSize: 36,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  sosDisabledText: {
    marginTop: 8,
    fontSize: 13,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  section: {
    padding: 12,
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: colors.text.primary,
  },
  contactCardContainer: {
    marginBottom: 8,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  contactPhone: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  callButton: {
    minWidth: 72,
    height: 32,
  },
  locationCardContainer: {
    marginTop: 4,
  },
  locationCard: {
    padding: 12,
  },
  locationInfo: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 13,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  addressText: {
    fontSize: 15,
    color: colors.text.primary,
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 8,
  },
  coordinatesLabel: {
    fontSize: 13,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  coordinatesText: {
    fontSize: 15,
    color: colors.text.primary,
    marginBottom: 8,
  },
  noContactsCard: {
    padding: 16,
    alignItems: 'center',
  },
  noContacts: {
    fontSize: 13,
    color: colors.text.secondary,
    marginBottom: 8,
    textAlign: 'center',
  },
  addContactButton: {
    minWidth: 120,
    height: 36,
  },
  updateLocationButton: {
    alignSelf: 'flex-start',
    height: 32,
  },
  skeletonText: {
    marginBottom: 8,
  },
  skeletonTitle: {
    marginBottom: 15,
  },
  skeletonButton: {
    backgroundColor: 'transparent',
    elevation: 0,
    shadowOpacity: 0,
  },
});

export default HomeScreen; 