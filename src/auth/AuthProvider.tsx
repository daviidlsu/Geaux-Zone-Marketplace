import React, { useEffect, useState, ReactNode } from 'react';
import { auth, db } from '../firebase/firebase';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { AuthContext, userData } from './AuthContext';

// Auth Provider Component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentUserData, setCurrentUserData] = useState<userData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  // Reload Firebase user to get updated emailVerified
  const refreshUser = async () => {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      setIsEmailVerified(auth.currentUser.emailVerified);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // CRITICAL: Reload user to get fresh emailVerified status
        await user.reload();
        
        // Get the fresh user object after reload
        const refreshedUser = auth.currentUser;
        
        if (!refreshedUser || !refreshedUser.emailVerified) {
          console.log('User email not verified:', user.email);
          setCurrentUser(null);
          setCurrentUserData(null);
          setIsEmailVerified(false);
          setIsLoading(false);
          return;
        }

        // Email is verified, proceed to load user data
        setCurrentUser(refreshedUser);
        setIsEmailVerified(true);

        try {
          const docSnap = await getDoc(doc(db, 'Users', refreshedUser.uid));
          if (docSnap.exists()) {
            setCurrentUserData(docSnap.data() as userData);
          } else {
            console.log('No Firestore document found for user');
            setCurrentUserData(null);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setCurrentUserData(null);
        }
      } else {
        // No user signed in
        setCurrentUser(null);
        setCurrentUserData(null);
        setIsEmailVerified(false);
      }
      
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await signOut(auth);
  };

  const value = {
    currentUser,
    currentUserData,
    isLoading,
    isEmailVerified,
    refreshUser,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};