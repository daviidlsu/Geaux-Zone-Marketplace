import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth, db } from '../firebase/firebase';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, Timestamp } from 'firebase/firestore';

// Define the shape of your user data
interface userData {
  uid: string;
  username: string;
  accountCreation: Timestamp;
}

// Define the shape of the context value
interface AuthContextType {
  currentUser: User | null;
  currentUserData: userData | null;
  isLoading: boolean;
  logout: () => Promise<void>;
}

// Create the Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom hook for consuming the context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth Provider Component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentUserData, setCurrentUserData] = useState<userData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // This observer is the key: it listens for state changes
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Fetch additional user data from Firestore
        const docSnap = await getDoc(doc(db, 'Users', user.uid));
        if (docSnap.exists()) {
          setCurrentUserData(docSnap.data() as userData);
        } else {
          setCurrentUserData(null);
        }
      } else {
        setCurrentUserData(null);
      }
      setIsLoading(false);
    });

    // Clean up the subscription on unmount
    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await signOut(auth);
    // onAuthStateChanged will handle updating state after sign out
  };

  const value = {
    currentUser,
    currentUserData,
    isLoading,
    logout,
  };

  // Only render children after the initial auth state has been determined
  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};