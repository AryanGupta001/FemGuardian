import { Alert } from 'react-native';

export class ErrorHandler {
  static handle(error: unknown) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    Alert.alert('Error', message);
  }
} 