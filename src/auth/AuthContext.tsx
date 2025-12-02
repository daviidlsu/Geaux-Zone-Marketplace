import { createContext, useContext } from 'react';
import { User } from 'firebase/auth';
import { Timestamp } from 'firebase/firestore';

// Define the shape of your user data
export interface userData {
  uid: string;
  username: string;
  accountCreation: Timestamp;
}

// Define the shape of the context value
export interface AuthContextType {
  currentUser: User | null;
  currentUserData: userData | null;
  isLoading: boolean;
  isEmailVerified: boolean;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

// Create the Context
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom hook for consuming the context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};