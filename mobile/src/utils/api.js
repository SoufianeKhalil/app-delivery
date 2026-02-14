import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Change to your backend URL (use your PC IP for device, localhost for emulator)
// Updated to the current PC Wi-Fi IP so the phone can reach the backend
const baseURL = 'http://192.168.43.67:3000/api';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000  // 10 secondes de timeout
});

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('token');
    }
    return Promise.reject(error);
  }
);

export default api;
export { baseURL };
