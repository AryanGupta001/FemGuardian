import { Platform } from 'react-native';

// Determine the current environment
const ENV = {
  dev: {
    apiUrl: 'http://localhost:3000',
    firebaseConfig: {
      // Development Firebase config
    },
  },
  staging: {
    apiUrl: 'https://staging-api.femguardian.com',
    firebaseConfig: {
      // Staging Firebase config
    },
  },
  prod: {
    apiUrl: 'https://api.femguardian.com',
    firebaseConfig: {
      // Production Firebase config
    },
  },
};

// Get the current environment based on build configuration
const getEnvironment = () => {
  if (__DEV__) {
    return ENV.dev;
  }
  // You can add logic here to determine staging vs production
  // For example, based on a build flag or environment variable
  return ENV.prod;
};

const environment = getEnvironment();

export default environment; 