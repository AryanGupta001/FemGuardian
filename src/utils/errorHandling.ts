import { Alert } from 'react-native';

export interface ErrorConfig {
  title?: string;
  defaultMessage?: string;
  showError?: boolean;
  retry?: () => void;
}

export default class ErrorHandler {
  static handle(error: any, config: ErrorConfig = {}) {
    const {
      title = 'Error',
      defaultMessage = 'Something went wrong. Please try again.',
      showError = true,
      retry,
    } = config;

    // Log the error for debugging
    console.error('Error occurred:', error);

    // Get appropriate error message
    let message = defaultMessage;
    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    }

    // Show error alert if needed
    if (showError) {
      const buttons = [];
      
      if (retry) {
        buttons.push({
          text: 'Retry',
          onPress: retry,
        });
      }
      
      buttons.push({ text: 'OK' });

      Alert.alert(title, message, buttons);
    }

    return message;
  }

  static handleAPI(error: any, config: ErrorConfig = {}) {
    let message = config.defaultMessage || 'Failed to connect to the server.';

    if (error instanceof Error) {
      if (error.message.includes('Network request failed')) {
        message = 'No internet connection. Please check your network.';
      } else if (error.message.includes('Timeout')) {
        message = 'Request timed out. Please try again.';
      } else if (error.message.includes('status: 401')) {
        message = 'Session expired. Please log in again.';
      } else if (error.message.includes('status: 403')) {
        message = 'You do not have permission to perform this action.';
      } else if (error.message.includes('status: 404')) {
        message = 'The requested resource was not found.';
      } else if (error.message.includes('status: 500')) {
        message = 'Server error. Please try again later.';
      }
    }

    return ErrorHandler.handle(error, {
      ...config,
      defaultMessage: message,
    });
  }

  static handlePermission(error: any, permission: string, config: ErrorConfig = {}) {
    let message = config.defaultMessage || `Permission required to access ${permission}.`;

    if (error instanceof Error) {
      if (error.message.includes('denied')) {
        message = `Please grant ${permission} permission to use this feature.`;
      } else if (error.message.includes('blocked')) {
        message = `${permission} permission is blocked. Please enable it in settings.`;
      } else if (error.message.includes('unavailable')) {
        message = `${permission} is not available on this device.`;
      }
    }

    return ErrorHandler.handle(error, {
      ...config,
      defaultMessage: message,
    });
  }
} 