
import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut,
  signInAnonymously,
  deleteUser
} from 'firebase/auth';
import { auth } from '../firebase';
import { syncUserProfile, UserProfile, deleteUserAccount } from '../services/userService';
import { wipeGuestData } from '../services/storageService';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInGuest: () => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  deleteGuestAccount: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const profile = await syncUserProfile(currentUser);
          setUser(currentUser);
          setUserProfile(profile);
        } catch (error) {
          console.error("Error syncing user profile:", error);
          setUser(currentUser);
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const signInGuest = async () => {
    await signInAnonymously(auth);
  };

  const logout = async () => {
    await firebaseSignOut(auth);
  };

  const deleteAccount = async () => {
    if (user) {
      const uid = user.uid;
      try {
        await deleteUserAccount(uid);
        await deleteUser(user);
      } catch (error) {
        console.error("Error deleting account:", error);
        throw error;
      }
    }
  };

  const deleteGuestAccount = async () => {
    if (user && user.isAnonymous) {
      const uid = user.uid;
      try {
        // 1. Wipe Data
        await wipeGuestData(uid);
        // 2. Delete Auth User (This automatically logs out)
        await deleteUser(user);
        setUser(null);
        setUserProfile(null);
      } catch (e) {
        console.error("Failed to delete guest account", e);
        throw e;
      }
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const profile = await syncUserProfile(user);
      setUserProfile(profile);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      userProfile, 
      loading, 
      signInWithGoogle, 
      signInGuest,
      logout,
      deleteAccount,
      deleteGuestAccount,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
