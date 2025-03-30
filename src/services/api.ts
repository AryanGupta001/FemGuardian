import auth from '@react-native-firebase/auth';
import {
  API_CHATBOT_URL,
  API_VOICE_ANALYSIS_URL,
  API_LOCATION_DEVIATION_URL,
  API_EMERGENCY_ALERT_URL,
} from '@env';
import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import Toast from 'react-native-toast-message';
import { ErrorHandler } from '../utils/ErrorHandler';

// Validate API endpoints
const requiredEndpoints = {
  API_CHATBOT_URL,
  API_VOICE_ANALYSIS_URL,
  API_LOCATION_DEVIATION_URL,
  API_EMERGENCY_ALERT_URL,
};

Object.entries(requiredEndpoints).forEach(([name, value]) => {
  if (!value) {
    throw new Error(`Missing ${name} environment variable`);
  }
});

// Create API instances with proper configuration
const createApiInstance = (baseURL: string) => {
  const instance = axios.create({
    baseURL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Add request interceptor for authentication
  instance.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      try {
        const user = auth().currentUser;
        if (user) {
          const token = await user.getIdToken();
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      } catch (error) {
        return Promise.reject(error);
      }
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Add response interceptor for error handling
  instance.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      if (error.response) {
        // Handle specific error responses
        const status = error.response.status;
        if (status === 401) {
          // Handle unauthorized
          Toast.show({
            type: 'error',
            text1: 'Session Expired',
            text2: 'Please log in again',
          });
        } else if (status === 403) {
          // Handle forbidden
          Toast.show({
            type: 'error',
            text1: 'Access Denied',
            text2: 'You do not have permission to perform this action',
          });
        }
      } else if (error.code === 'ECONNABORTED') {
        // Handle timeout
        Toast.show({
          type: 'error',
          text1: 'Connection Timeout',
          text2: 'Please check your internet connection',
        });
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

const voiceApi = createApiInstance(API_VOICE_ANALYSIS_URL);
const locationApi = createApiInstance(API_LOCATION_DEVIATION_URL);
const emergencyApi = createApiInstance(API_EMERGENCY_ALERT_URL);

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phoneNumber: string;
  emergencyContacts: {
    id: string;
    name: string;
    phoneNumber: string;
    relation: string;
  }[];
}

interface SOSPayload {
  userId: string;
  message: string;
  location: {
    latitude: number;
    longitude: number;
  };
}

const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  Toast.show({
    type,
    text1: type === 'success' ? 'Success' : type === 'error' ? 'Error' : 'Info',
    text2: message,
    position: 'bottom',
    visibilityTime: 3000,
    autoHide: true,
    topOffset: 30,
    bottomOffset: 40,
  });
};

export const sendChatMessage = async (text: string) => {
  try {
    const response = await axios.post(API_CHATBOT_URL, { text });
    return response.data;
  } catch (error) {
    console.error('Error sending chat message:', error);
    throw error;
  }
};

interface VoiceAnalysisResponse {
  is_threat: boolean;
  threat_score: number;
  transcribed_text?: string;
  confidence: number;
}

interface SOSResponse {
  success: boolean;
  message: string;
  emergency_services_notified: boolean;
  contacts_notified: string[];
}

export const analyzeVoice = async (formData: FormData): Promise<VoiceAnalysisResponse> => {
  try {
    const response = await voiceApi.post('/analyze-voice', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000, // 60 seconds for voice analysis
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Voice analysis timed out. Please try again.');
      }
      if (error.response?.status === 413) {
        throw new Error('Recording is too long. Please keep it under 60 seconds.');
      }
      throw new Error(error.response?.data?.message || 'Failed to analyze voice recording.');
    }
    throw error;
  }
};

export const loadUserProfile = async () => {
  const user = auth().currentUser;
  if (!user) throw new Error('User not authenticated');
  
  const response = await voiceApi.get(`/users/${user.uid}/profile`);
  return response.data;
};

export const sendSOS = async (
  location: { latitude: number; longitude: number },
  message: string = 'Emergency assistance needed!'
): Promise<any> => {
  const user = auth().currentUser;
  if (!user) throw new Error('User not authenticated');

  try {
    const payload = {
      userId: user.uid,
      message,
      location: {
        ...location,
        timestamp: Date.now(),
      },
    };

    const response = await emergencyApi.post('/alert', payload);
    Toast.show({
      type: 'success',
      text1: 'Emergency Alert Sent',
      text2: 'Emergency contacts have been notified',
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('SOS request timed out. Please try again or call emergency services directly.');
      }
      const message = error.response?.data?.message || 'Failed to send SOS alert.';
      ErrorHandler.handle(new Error(message));
    }
    throw error;
  }
};

export const checkLocationDeviation = async (latitude: number, longitude: number) => {
  try {
    const user = auth().currentUser;
    if (!user) throw new Error('User not authenticated');

    const response = await locationApi.post('/check-deviation', {
      userId: user.uid,
      latitude,
      longitude,
      timestamp: Date.now(),
    });

    if (response.data.anomaly === -1) {
      await sendSOS(
        { latitude, longitude },
        'Unusual location pattern detected - Emergency assistance needed!'
      );
    }

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || 'Failed to check location.';
      ErrorHandler.handle(new Error(message));
    }
    throw error;
  }
};

export const updateUserProfile = async (profileData: Partial<UserProfile>) => {
  const response = await voiceApi.put('/user/profile', profileData);
  showToast('Profile updated successfully', 'success');
  return response.data;
};

export const updateLocation = async (latitude: number, longitude: number) => {
  try {
    const user = auth().currentUser;
    if (!user) throw new Error('User not authenticated');

    const response = await locationApi.post('/update-location', {
      userId: user.uid,
      latitude,
      longitude,
      timestamp: Date.now(),
    });

    Toast.show({
      type: 'success',
      text1: 'Location Updated',
      text2: 'Your location has been updated successfully',
    });

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || 'Failed to update location.';
      ErrorHandler.handle(new Error(message));
    }
    throw error;
  }
};

export const addEmergencyContact = async (contactData: Omit<UserProfile['emergencyContacts'][0], 'id'>) => {
  const response = await voiceApi.post('/user/emergency-contacts', contactData);
  showToast('Emergency contact added successfully', 'success');
  return response.data;
};

export const removeEmergencyContact = async (contactId: string) => {
  const response = await voiceApi.delete(`/user/emergency-contacts/${contactId}`);
  showToast('Emergency contact removed successfully', 'success');
  return response.data;
}; 