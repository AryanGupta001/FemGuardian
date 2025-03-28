import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Alert,
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

const LocationScreen = () => {
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    if (Platform.OS === 'ios') {
      getLocation();
    } else {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'This app needs access to your location for safety features.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          getLocation();
        } else {
          Alert.alert('Permission Denied', 'Location permission is required for this feature.');
        }
      } catch (err) {
        console.warn(err);
      }
    }
  };

  const getLocation = () => {
    Geolocation.getCurrentPosition(
      position => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLoading(false);
        checkDeviation(position.coords.latitude, position.coords.longitude);
      },
      error => {
        console.error(error);
        setLoading(false);
        Alert.alert('Error', 'Failed to get location');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
    );
  };

  const checkDeviation = async (latitude: number, longitude: number) => {
    setChecking(true);
    try {
      const response = await fetch('https://deploy-tracking-model.onrender.com/check-deviation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ latitude, longitude }),
      });

      const data = await response.json();
      
      if (data.anomaly === 1) {
        Alert.alert(
          'Warning',
          'Unusual location pattern detected. Would you like to send an SOS?',
          [
            { text: 'No, I\'m safe' },
            {
              text: 'Send SOS',
              style: 'destructive',
              onPress: () => {
                // Navigate to Home screen and trigger SOS
                // navigation.navigate('Home', { triggerSOS: true });
              },
            },
          ],
        );
      }
    } catch (error) {
      console.error('Error checking deviation:', error);
    } finally {
      setChecking(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e91e63" />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {location && (
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          region={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
        >
          <Marker
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            title="Your Location"
          />
        </MapView>
      )}
      {checking && (
        <View style={styles.checkingContainer}>
          <ActivityIndicator size="small" color="#e91e63" />
          <Text style={styles.checkingText}>Analyzing location pattern...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  map: {
    flex: 1,
  },
  checkingContainer: {
    position: 'absolute',
    top: 20,
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 10,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkingText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#666',
  },
});

export default LocationScreen; 