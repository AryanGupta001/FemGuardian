import { Alert, Linking, Platform } from 'react-native';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';

export const checkPermission = async (permission: string) => {
  try {
    const result = await check(permission);
    switch (result) {
      case RESULTS.UNAVAILABLE:
        Alert.alert(
          'Permission Unavailable',
          'This feature is not available on this device'
        );
        return false;
      case RESULTS.DENIED:
        const requestResult = await request(permission);
        return requestResult === RESULTS.GRANTED;
      case RESULTS.GRANTED:
        return true;
      case RESULTS.BLOCKED:
        Alert.alert(
          'Permission Blocked',
          'Please enable the required permission in your device settings',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: openSettings },
          ]
        );
        return false;
      default:
        return false;
    }
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
};

export const openSettings = () => {
  if (Platform.OS === 'ios') {
    Linking.openURL('app-settings:');
  } else {
    Linking.openSettings();
  }
};

export const validateEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string) => {
  const phoneRegex = /^\+?[1-9]\d{9,14}$/;
  return phoneRegex.test(phone);
};

export const validatePassword = (password: string) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
  return passwordRegex.test(password);
};

export const getLocationPermission = async () => {
  const permission = Platform.OS === 'ios'
    ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
    : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;
  return checkPermission(permission);
};

export const getMicrophonePermission = async () => {
  const permission = Platform.OS === 'ios'
    ? PERMISSIONS.IOS.MICROPHONE
    : PERMISSIONS.ANDROID.RECORD_AUDIO;
  return checkPermission(permission);
};

export const formatPhoneNumber = (phone: string) => {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Format based on length
  if (cleaned.length === 10) {
    return `+1${cleaned}`; // Assuming US number
  } else if (cleaned.length > 10) {
    return `+${cleaned}`;
  }
  return cleaned;
};

export const getErrorMessage = (error: any) => {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  return 'An unexpected error occurred';
}; 