import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { User } from '../types';
import { api } from '../api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  apiBaseUrl: string;
  setApiBaseUrl: (url: string) => Promise<void>;
  login: (phoneNumber: string, otp: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

// Cross-platform simple storage helper
const storage = {
  async getItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
      // On mobile native, dynamic require of async-storage
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      return await AsyncStorage.getItem(key);
    } catch {
      return null;
    }
  },
  async setItem(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
        return;
      }
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem(key, value);
    } catch {}
  },
  async removeItem(key: string): Promise<void> {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
        return;
      }
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.removeItem(key);
    } catch {}
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [apiBaseUrl, setApiBaseUrlState] = useState<string>(api.getBaseUrl());

  useEffect(() => {
    loadStoredSession();
  }, []);

  const loadStoredSession = async () => {
    try {
      setIsLoading(true);
      const savedBaseUrl = await storage.getItem('miniledger_base_url');
      if (savedBaseUrl) {
        api.setBaseUrl(savedBaseUrl);
        setApiBaseUrlState(savedBaseUrl);
      }

      const savedToken = await storage.getItem('miniledger_token');
      const savedUserStr = await storage.getItem('miniledger_user');

      if (savedToken && savedUserStr) {
        const parsedUser = JSON.parse(savedUserStr);
        api.setToken(savedToken);
        setToken(savedToken);
        setUser(parsedUser);

        // Verify token with backend in background
        api.getMe().then((res) => {
          if (!res.success) {
            // Token expired or invalid
            logout();
          }
        });
      }
    } catch (e) {
      console.warn('Failed to restore auth session:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const setApiBaseUrl = async (url: string) => {
    api.setBaseUrl(url);
    setApiBaseUrlState(url);
    await storage.setItem('miniledger_base_url', url);
  };

  const login = async (phoneNumber: string, otp: string): Promise<{ success: boolean; error?: string }> => {
    const res = await api.verifyOtp(phoneNumber, otp);
    if (res.success && res.data) {
      const { token: authToken, user: authUser } = res.data;
      api.setToken(authToken);
      setToken(authToken);
      setUser(authUser);

      await storage.setItem('miniledger_token', authToken);
      await storage.setItem('miniledger_user', JSON.stringify(authUser));
      return { success: true };
    }
    return { success: false, error: res.error || 'Login failed' };
  };

  const logout = async () => {
    api.setToken(null);
    setToken(null);
    setUser(null);
    await storage.removeItem('miniledger_token');
    await storage.removeItem('miniledger_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        apiBaseUrl,
        setApiBaseUrl,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
