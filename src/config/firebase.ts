import { initializeApp, getApp } from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import {
  FIREBASE_API_KEY,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
  FIREBASE_APP_ID,
  FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_DATABASE_URL,
} from '@env';

function initializeFirebase() {
  try {
    return getApp();
  } catch (error) {
    // Validate required environment variables
    const requiredEnvVars = [
      'FIREBASE_API_KEY',
      'FIREBASE_PROJECT_ID',
      'FIREBASE_STORAGE_BUCKET',
      'FIREBASE_APP_ID',
      'FIREBASE_MESSAGING_SENDER_ID',
      'FIREBASE_DATABASE_URL',
    ];

    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
      }
    }

    const firebaseConfig = {
      apiKey: FIREBASE_API_KEY,
      projectId: FIREBASE_PROJECT_ID,
      storageBucket: FIREBASE_STORAGE_BUCKET,
      appId: FIREBASE_APP_ID,
      messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
      databaseURL: FIREBASE_DATABASE_URL,
    };

    return initializeApp(firebaseConfig);
  }
}

const app = initializeFirebase();
export default app; 