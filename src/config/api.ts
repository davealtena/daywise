import { Platform } from 'react-native';
import Constants from 'expo-constants';

const getApiBaseUrl = () => {
  if (__DEV__) {
    // In development, Expo provides the manifest with the correct host
    const debuggerHost = Constants.expoConfig?.hostUri?.split(':').shift();
    
    if (debuggerHost) {
      // Use the same host as the Expo dev server, but with our backend port
      return `http://${debuggerHost}:3000/api/v1`;
    }
    
    // Fallback to localhost (works with Expo's network bridging)
    return Platform.OS === 'android' 
      ? 'http://10.0.2.2:3000/api/v1'  // Android emulator localhost mapping
      : 'http://localhost:3000/api/v1'; // iOS simulator
  }
  
  // Production - replace with your actual production API URL
  return 'https://your-production-api.com/api/v1';
};

export const API_BASE_URL = getApiBaseUrl();

console.log('API Base URL:', API_BASE_URL);