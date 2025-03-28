import {
  FIREBASE_API_KEY,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
  FIREBASE_APP_ID,
  FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_DATABASE_URL,
  GOOGLE_WEB_CLIENT_ID,
  API_CHATBOT_URL,
  API_VOICE_ANALYSIS_URL,
  API_LOCATION_DEVIATION_URL,
  API_EMERGENCY_ALERT_URL,
} from '@env';

export const ENV = {
  FIREBASE: {
    API_KEY: FIREBASE_API_KEY,
    PROJECT_ID: FIREBASE_PROJECT_ID,
    STORAGE_BUCKET: FIREBASE_STORAGE_BUCKET,
    APP_ID: FIREBASE_APP_ID,
    MESSAGING_SENDER_ID: FIREBASE_MESSAGING_SENDER_ID,
    DATABASE_URL: FIREBASE_DATABASE_URL,
  },
  GOOGLE: {
    WEB_CLIENT_ID: GOOGLE_WEB_CLIENT_ID,
  },
  API: {
    CHATBOT_URL: API_CHATBOT_URL,
    VOICE_ANALYSIS_URL: API_VOICE_ANALYSIS_URL,
    LOCATION_DEVIATION_URL: API_LOCATION_DEVIATION_URL,
    EMERGENCY_ALERT_URL: API_EMERGENCY_ALERT_URL,
  },
}; 