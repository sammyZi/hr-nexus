import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '@/lib/api';
import { storage } from '@/lib/storage';
import type { User, SignInData, SignUpData, AuthResponse } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (data: SignInData) => Promise<void>;
  signUp: (data: SignUpData) => Promise<void>;
  signOut: () => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  acceptInvitation: (token: string, password: string, fullName: string) => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    setLoading(true);
    try {
      const token = await storage.getToken();
      
      if (!token) {
        // No token, user is not authenticated
        setUser(null);
        setLoading(false);
        return;
      }

      // Try to fetch user data from storage first
      const userData = await storage.getUser();
      
      if (userData) {
        // Verify token is still valid by making API call
        try {
          const currentUser = await api.getCurrentUser();
          setUser(currentUser);
          await storage.setUser(currentUser);
        } catch (apiError) {
          // Token is invalid, clear everything
          console.error('Token validation failed:', apiError);
          await storage.removeToken();
          setUser(null);
        }
      } else {
        // No cached user data, fetch from API
        try {
          const currentUser = await api.getCurrentUser();
          setUser(currentUser);
          await storage.setUser(currentUser);
        } catch (apiError) {
          // API call failed, clear token
          console.error('Failed to fetch user data:', apiError);
          await storage.removeToken();
          setUser(null);
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      await storage.removeToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (data: SignInData) => {
    try {
      const response = await api.signIn(data);
      await storage.setToken(response.access_token);
      
      // Fetch user data
      const currentUser = await api.getCurrentUser();
      setUser(currentUser);
      await storage.setUser(currentUser);
    } catch (error: any) {
      console.error('Sign in failed:', error);
      throw new Error(error.response?.data?.detail || 'Sign in failed');
    }
  };

  const signUp = async (data: SignUpData) => {
    try {
      const response = await api.signUp(data);
      // Don't auto sign in, require email verification
      // await storage.setToken(response.access_token);
    } catch (error: any) {
      console.error('Sign up failed:', error);
      throw new Error(error.response?.data?.detail || 'Sign up failed');
    }
  };

  const signOut = async () => {
    try {
      await storage.removeToken();
      setUser(null);
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  const verifyEmail = async (token: string) => {
    try {
      await api.verifyEmail(token);
    } catch (error: any) {
      console.error('Email verification failed:', error);
      throw new Error(error.response?.data?.detail || 'Verification failed');
    }
  };

  const acceptInvitation = async (token: string, password: string, fullName: string) => {
    try {
      const response = await api.acceptInvitation(token, password, fullName);
      await storage.setToken(response.access_token);
      
      // Fetch user data
      const currentUser = await api.getCurrentUser();
      setUser(currentUser);
      await storage.setUser(currentUser);
    } catch (error: any) {
      console.error('Accept invitation failed:', error);
      throw new Error(error.response?.data?.detail || 'Failed to accept invitation');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
        verifyEmail,
        acceptInvitation,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
