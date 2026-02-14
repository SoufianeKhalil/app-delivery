import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../utils/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        const response = await api.get('/auth/me');
        if (response.data.success) {
          setUser(response.data.user);
        } else {
          await AsyncStorage.removeItem('token');
        }
      }
    } catch (error) {
      await AsyncStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      console.log('🔐 Tentative de connexion...', { email });
      const response = await api.post('/auth/login', {
        email,
        mot_de_passe: password
      });
      
      if (response.data.success) {
        console.log('✅ Connexion réussie!', response.data.user);
        await AsyncStorage.setItem('token', response.data.token);
        setUser(response.data.user);
        return { success: true };
      }
      console.log('❌ Réponse du serveur:', response.data);
      return { success: false, message: response.data.message || 'Erreur de connexion' };
    } catch (error) {
      console.log('❌ Erreur de connexion:', error.message);
      if (error.code === 'ECONNABORTED') {
        console.log('   → Timeout réseau');
        return { success: false, message: 'Connexion timeout - vérifiez votre réseau et l\'IP du serveur' };
      }
      if (error.code === 'ENOTFOUND' || error.message?.includes('getaddrinfo')) {
        console.log('   → Serveur non accessible');
        return { success: false, message: 'Serveur non accessible - vérifiez l\'IP et la connexion Wi-Fi' };
      }
      return { 
        success: false, 
        message: error.response?.data?.message || error.message || 'Erreur de connexion' 
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      
      if (response.data.success) {
        await AsyncStorage.setItem('token', response.data.token);
        setUser(response.data.user);
        return { success: true };
      }
      // If backend returns validation errors, include them
      const serverMessage = response.data.message || (response.data.errors && response.data.errors.map(e => e.msg).join(' - '));
      return { success: false, message: serverMessage || 'Erreur d\'inscription' };
    } catch (error) {
      // If server returned an array of validation errors, join them
      const resp = error.response?.data;
      const serverMessage = resp?.message || (resp?.errors && resp.errors.map(e => e.msg).join(' - '));
      return { 
        success: false, 
        message: serverMessage || 'Erreur d\'inscription' 
      };
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be within AuthProvider');
  }
  return context;
}
