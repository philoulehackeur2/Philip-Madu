
import { db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, serverTimestamp, collection, getDocs, writeBatch } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { BrandArchetype } from '../types';
import { deleteUserStorage } from './storageService';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string | null;
  brandArchetype: BrandArchetype;
  role: string;
  createdAt: any;
  lastLogin: any;
  isGuest: boolean;
}

export const syncUserProfile = async (user: User): Promise<UserProfile> => {
  const userRef = doc(db, "users", user.uid);
  const snapshot = await getDoc(userRef);

  if (snapshot.exists()) {
    // Document exists: Sync latest auth data and update login time
    // This also handles "Guest Conversion" where a previously guest UID might now have an email attached (if linked)
    // or if the user logged in with a provider that updated their photo/name.
    await updateDoc(userRef, {
      lastLogin: serverTimestamp(),
      email: user.email || snapshot.data().email,
      photoURL: user.photoURL || snapshot.data().photoURL,
      displayName: user.displayName || snapshot.data().displayName,
      isGuest: user.isAnonymous
    });
    
    return snapshot.data() as UserProfile;
  } else {
    // Create new document
    const newProfile: Omit<UserProfile, 'createdAt' | 'lastLogin'> & { createdAt: any, lastLogin: any } = {
      uid: user.uid,
      displayName: user.displayName || "Anonymous Architect",
      email: user.email || "",
      photoURL: user.photoURL || null,
      brandArchetype: BrandArchetype.DE_ROCHE,
      role: "Creative Director",
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
      isGuest: user.isAnonymous
    };

    await setDoc(userRef, newProfile);
    return newProfile as UserProfile;
  }
};

export const updateUserProfile = async (uid: string, data: Partial<UserProfile>) => {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, data);
};

export const deleteUserAccount = async (uid: string) => {
  // 1. Delete all assets from Firebase Storage
  await deleteUserStorage(uid);

  // 2. Delete Firestore 'files' subcollection
  // Note: Client-side deletion requires reading documents first.
  const filesRef = collection(db, "users", uid, "files");
  const filesSnap = await getDocs(filesRef);
  
  if (!filesSnap.empty) {
    const batch = writeBatch(db);
    filesSnap.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
  }

  // 3. Delete the User Document
  const userRef = doc(db, "users", uid);
  await deleteDoc(userRef);
};
