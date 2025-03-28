import auth from '@react-native-firebase/auth';
import {
  API_CHATBOT_URL,
  API_VOICE_ANALYSIS_URL,
  API_LOCATION_DEVIATION_URL,
  API_EMERGENCY_ALERT_URL,
} from '@env';

const API_ENDPOINTS = {
  CHATBOT: API_CHATBOT_URL,
  VOICE_ANALYSIS: API_VOICE_ANALYSIS_URL,
  LOCATION_DEVIATION: API_LOCATION_DEVIATION_URL,
  EMERGENCY_ALERT: API_EMERGENCY_ALERT_URL,
};

// Validate required environment variables
const requiredEnvVars = [
  'API_CHATBOT_URL',
  'API_VOICE_ANALYSIS_URL',
  'API_LOCATION_DEVIATION_URL',
  'API_EMERGENCY_ALERT_URL',
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

export const sendChatMessage = async (text: string) => {
  try {
    const response = await fetch(API_ENDPOINTS.CHATBOT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });
    return await response.json();
  } catch (error) {
    console.error('Error sending chat message:', error);
    throw error;
  }
};

export const analyzeVoice = async (audioFile: any) => {
  try {
    const formData = new FormData();
    formData.append('audio', audioFile);

    const response = await fetch(API_ENDPOINTS.VOICE_ANALYSIS, {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });
    return await response.json();
  } catch (error) {
    console.error('Error analyzing voice:', error);
    throw error;
  }
};

export const checkLocationDeviation = async (latitude: number, longitude: number) => {
  try {
    const response = await fetch(API_ENDPOINTS.LOCATION_DEVIATION, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ latitude, longitude }),
    });
    return await response.json();
  } catch (error) {
    console.error('Error checking location deviation:', error);
    throw error;
  }
};

export const sendEmergencyAlert = async (message: string) => {
  try {
    const idToken = await auth().currentUser?.getIdToken();
    if (!idToken) throw new Error('User not authenticated');

    const response = await fetch(API_ENDPOINTS.EMERGENCY_ALERT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      throw new Error('Failed to send emergency alert');
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending emergency alert:', error);
    throw error;
  }
}; 