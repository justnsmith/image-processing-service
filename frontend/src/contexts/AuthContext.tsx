// src/contexts/AuthContext.tsx

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../types';
import { clearAuth, isAuthenticated, storeAuthData } from '../utils/storage';
import { getUserProfile, login, register } from '../api/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      if (isAuthenticated()) {
        try {
          // Fetch user profile if token exists
          const userProfile = await getUserProfile();
          setUser(userProfile);
        } catch (error) {
          console.error('Failed to fetch user profile:', error);
          clearAuth();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const loginUser = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await login({ email, password });
      storeAuthData(response.token, response.user_id, response.email);
      setUser({ id: response.user_id, email: response.email });
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const registerUser = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await register({ email, password });
      storeAuthData(response.token, response.user_id, response.email);
      setUser({ id: response.user_id, email: response.email });
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    clearAuth();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login: loginUser,
        register: registerUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
