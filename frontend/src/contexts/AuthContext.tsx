import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, AuthResponse } from '../types';
import { clearAuth, isAuthenticated, storeAuthData } from '../utils/storage';
import { getUserProfile, login as apiLogin, register as apiRegister } from '../api/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AuthResponse>;
  register: (email: string, password: string) => Promise<AuthResponse>;
  logout: () => void;
  setAuthData: (token: string, userId: string, email: string) => void;
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

  const loginUser = async (email: string, password: string): Promise<AuthResponse> => {
    try {
      setIsLoading(true);
      // Normalize email to lowercase to avoid case sensitivity issues
      const normalizedEmail = email.toLowerCase();
      console.log(`Attempting login with normalized email: ${normalizedEmail}`);
      const response = await apiLogin({ email: normalizedEmail, password });
      console.log('Login successful, storing auth data');
      storeAuthData(response.token, response.user_id, response.email);
      // Update the user state to trigger re-renders
      setUser({ id: response.user_id, email: response.email });
      return response;
    } catch (error) {
      console.error('Login failed in AuthContext:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const registerUser = async (email: string, password: string): Promise<AuthResponse> => {
    try {
      setIsLoading(true);
      const response = await apiRegister({ email, password });
      // Only store auth data if no email verification is required
      // If verification is required, this should be skipped
      if (response.token) {
        storeAuthData(response.token, response.user_id, response.email);
        setUser({ id: response.user_id, email: response.email });
      }
      return response; // Return the response so RegisterForm can check properties
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Add new function to set auth data directly
  const setAuthDataDirectly = (token: string, userId: string, email: string) => {
    storeAuthData(token, userId, email);
    setUser({ id: userId, email: email });
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
        setAuthData: setAuthDataDirectly
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
