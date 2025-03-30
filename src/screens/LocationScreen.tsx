import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Alert,
  ActivityIndicator,
  Platform,
  SafeAreaView,
  ViewStyle,
  StyleProp,
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { checkLocationDeviation, sendEmergencyAlert } from '../services/api';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import ErrorHandler from '../utils/errorHandling';
import Button from '../components/Button';
import Card from '../components/Card';
import { colors } from '../theme/colors';

const LocationScreen = () => {
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
    address?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [sosCountdown, setSosCountdown] = useState<number | null>(null);
  const [sosTimer, setSosTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    checkLocationPermission();
    return () => {
      if (sosTimer) {
        clearInterval(sosTimer);
      }
    };
  }, []);

  const checkLocationPermission = async () => {
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
        if (permissionResult !== RESULTS.GRANTED) {
          throw new Error('Location permission denied');
        }
      } else if (result !== RESULTS.GRANTED) {
        throw new Error('Location permission not granted');
      }

      getCurrentLocation();
    } catch (error) {
      ErrorHandler.handlePermission(error, 'Location', {
        title: 'Permission Required',
        defaultMessage: 'Location permission is required for safety monitoring.',
        retry: checkLocationPermission,
      });
    }
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

  const getCurrentLocation = () => {
    setLoading(true);
    Geolocation.getCurrentPosition(
      async position => {
        const address = await getAddressFromCoordinates(
          position.coords.latitude,
          position.coords.longitude
        );
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          address,
        });
        setLoading(false);
      },
      error => {
        ErrorHandler.handle(error, {
          title: 'Location Error',
          defaultMessage: 'Failed to get your location. Please try again.',
          retry: getCurrentLocation,
        });
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  const checkDeviation = async () => {
    if (!location) {
      ErrorHandler.handle(new Error('No location available'), {
        title: 'Location Error',
        defaultMessage: 'Please wait for location to be available.',
      });
      return;
    }

    setChecking(true);
    try {
      const result = await checkLocationDeviation(location.latitude, location.longitude);
      
      if (result.deviation_detected) {
        startSOSCountdown();
      } else {
        Alert.alert('Safe Zone', 'You are within safe zones.');
      }
    } catch (error) {
      ErrorHandler.handleAPI(error, {
        title: 'Check Error',
        defaultMessage: 'Failed to check location deviation. Please try again.',
        retry: checkDeviation,
      });
    } finally {
      setChecking(false);
    }
  };

  const startSOSCountdown = () => {
    Alert.alert(
      'Deviation Detected',
      'SOS will be triggered in 5 seconds. Tap Cancel if you are safe.',
      [
        {
          text: 'Cancel',
          onPress: cancelSOS,
          style: 'cancel',
        },
        {
          text: 'Send Now',
          onPress: () => triggerSOS(true),
          style: 'destructive',
        },
      ]
    );

    setSosCountdown(5);
    const timer = setInterval(() => {
      setSosCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          triggerSOS();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    setSosTimer(timer);
  };

  const cancelSOS = () => {
    if (sosTimer) {
      clearInterval(sosTimer);
      setSosTimer(null);
    }
    setSosCountdown(null);
  };

  const triggerSOS = async (immediate = false) => {
    if (!immediate && sosCountdown !== 1) return;
    
    cancelSOS();
    try {
      await sendEmergencyAlert('Location deviation detected', location || undefined);
    } catch (error) {
      ErrorHandler.handleAPI(error, {
        title: 'SOS Error',
        defaultMessage: 'Failed to send SOS. Please try again.',
        retry: () => triggerSOS(true),
      });
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.contentContainer}>
          <Card variant="elevated" style={styles.card}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Getting your location...</Text>
          </Card>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentContainer}>
        <Card variant="elevated" style={styles.card}>
          <Text style={styles.title}>Location Status</Text>
          {location ? (
            <>
              <View style={styles.coordinatesContainer}>
                <Text style={styles.addressText}>{location.address}</Text>
                <View style={styles.divider} />
                <Text style={styles.coordinateLabel}>Latitude</Text>
                <Text style={styles.coordinateValue}>
                  {location.latitude.toFixed(6)}
                </Text>
                <Text style={styles.coordinateLabel}>Longitude</Text>
                <Text style={styles.coordinateValue}>
                  {location.longitude.toFixed(6)}
                </Text>
              </View>
              <View style={styles.buttonContainer}>
                <Button
                  onPress={checkDeviation}
                  title={checking ? 'Checking Location...' : 'Check Safety'}
                  variant="primary"
                  loading={checking}
                  style={styles.button}
                />
                <Button
                  onPress={getCurrentLocation}
                  title="Update Location"
                  variant="outline"
                  style={styles.outlineButton}
                />
              </View>
            </>
          ) : (
            <View style={styles.errorContainer}>
              <Text style={styles.errorTitle}>Location Unavailable</Text>
              <Text style={styles.errorText}>
                Unable to get your current location. Please check your GPS settings and try again.
              </Text>
              <Button
                onPress={getCurrentLocation}
                title="Try Again"
                variant="primary"
                style={styles.button}
              />
            </View>
          )}
        </Card>

        {sosCountdown !== null && (
          <View style={styles.sosContainer}>
            <Text style={styles.sosText}>
              SOS will be triggered in {sosCountdown} seconds
            </Text>
            <Button
              onPress={cancelSOS}
              title="Cancel SOS"
              variant="danger"
              style={styles.button}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  } as ViewStyle,
  contentContainer: {
    flex: 1,
    padding: 20,
  } as ViewStyle,
  card: {
    padding: 20,
    marginBottom: 20,
  } as ViewStyle,
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 20,
    textAlign: 'center',
  },
  coordinatesContainer: {
    marginBottom: 20,
  },
  addressText: {
    fontSize: 16,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  coordinateLabel: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  coordinateValue: {
    fontSize: 18,
    color: colors.text.primary,
    marginBottom: 12,
  },
  buttonContainer: {
    gap: 12,
  } as ViewStyle,
  button: {
    marginBottom: 8,
  } as ViewStyle,
  outlineButton: {
    marginBottom: 8,
    backgroundColor: 'transparent',
  } as ViewStyle,
  errorContainer: {
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.danger,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 16,
    color: colors.text.secondary,
    marginTop: 16,
    textAlign: 'center',
  },
  sosContainer: {
    padding: 20,
    marginBottom: 20,
    backgroundColor: colors.danger,
    borderRadius: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  } as ViewStyle,
  sosText: {
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
});

export default LocationScreen; 