// app/lib/auth-context.ts
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define the auth user type - Updated to match your types/auth.ts
export interface AuthUser {
  id: string;
  email: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'STAFF' | 'TEACHER' | 'STUDENT' | 'PARENT' | 'USER';
  firstName: string;
  lastName: string;
  name?: string; // Optional for backward compatibility
  phoneNumber?: string | null;
  avatar?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  permissions?: string[];
}

// Define the auth context type
export interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUser: (updates: Partial<AuthUser>) => void;
}

// Create the context with a default value
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Props for the provider
interface AuthProviderProps {
  children: ReactNode;
}

// Auth Provider component
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check localStorage for token
        const token = localStorage.getItem('auth_token');
        const storedUser = localStorage.getItem('auth_user');
        
        if (token && storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      // Here you would make an API call to your authentication endpoint
      // For now, we'll simulate a successful login
      const mockUser: AuthUser = {
        id: '1',
        email,
        firstName: email.split('@')[0],
        lastName: 'User',
        name: email.split('@')[0] + ' User', // For backward compatibility
        role: 'ADMIN',
        phoneNumber: null,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + email,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Store in localStorage (in production, use secure storage)
      localStorage.setItem('auth_token', 'mock-jwt-token');
      localStorage.setItem('auth_user', JSON.stringify(mockUser));
      
      setUser(mockUser);
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const refreshUser = async (): Promise<void> => {
    // Implement user refresh logic
    console.log('Refreshing user data...');
  };

  const updateUser = (updates: Partial<AuthUser>): void => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem('auth_user', JSON.stringify(updatedUser));
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    refreshUser,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}