
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject, listAll } from "firebase/storage";
import { getFirestore, doc, setDoc, deleteDoc, collection, query, where, orderBy, getDocs, serverTimestamp, getDoc, getAggregateFromServer, sum } from "firebase/firestore";
import { app, auth } from "../firebase";
import { BrandArchetype, SavedModel } from "../types";
import { generateId } from "../utils";

// --- CONFIGURATION ---
// Explicit Bucket URL for Asset Isolation
const BUCKET_URL = "gs://chaos-chicc-de-roche.firebasestorage.app";
const storage = getStorage(app, BUCKET_URL);
const db = getFirestore(app);

// --- TYPES ---

export type AssetCategory = 'moodboard' | 'reference' | 'generated_editorial' | 'tech_pack';

export interface AssetMetadataInput {
  prompt?: string;
  seed?: number;
  brand?: BrandArchetype;
  notes?: string;
}

export interface AssetRecord {
  id: string;
  uid: string;
  fileName: string;
  fileType: string;
  size: number; // Size in bytes
  downloadUrl: string;
  storagePath: string; // Internal reference for deletion
  category: AssetCategory;
  brandArchetype?: BrandArchetype;
  aiSummary?: string; // "Prompt: [text] | Seed: [num]"
  notes?: string;
  uploadedAt: any; // ServerTimestamp
}

/**
 * SAVE METADATA (Firestore)
 * Writes the asset record to the user's digital archive.
 */
export const saveFileMetadata = async (uid: string, fileId: string, data: AssetRecord): Promise<void> => {
  try {
    const docRef = doc(db, "users", uid, "files", fileId);
    await setDoc(docRef, data, { merge: true });
  } catch (error) {
    console.error("Metadata Save Failed:", error);
    throw new Error("Failed to save asset metadata.");
  }
};

/**
 * UPLOAD PROFILE PHOTO
 * Uploads to user_uploads/{uid}/profile_{timestamp}.jpg
 */
export const uploadProfilePhoto = async (uid: string, file: File): Promise<string> => {
  try {
    // timestamp ensures uniqueness and busts cache
    const extension = file.name.split('.').pop() || 'jpg';
    const storagePath = `user_uploads/${uid}/profile_${Date.now()}.${extension}`;
    const storageRef = ref(storage, storagePath);
    
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  } catch (error) {
    console.error("Profile Upload Failed:", error);
    throw new Error("Failed to upload profile photo.");
  }
};

/**
 * DELETE OBJECT FROM URL
 * Helper to delete a file from storage given its download URL (used for replacing profile photos)
 */
export const deleteObjectFromUrl = async (url: string): Promise<void> => {
  try {
    const storageRef = ref(storage, url);
    await deleteObject(storageRef);
  } catch (error) {
    console.warn("Failed to delete old object (might not exist):", error);
  }
};

/**
 * DELETE USER STORAGE FOLDER
 * Recursively deletes all files and subfolders in user_uploads/{uid}
 */
export const deleteUserStorage = async (uid: string): Promise<void> => {
  const userFolderRef = ref(storage, `user_uploads/${uid}`);
  
  const deleteRecursive = async (folderRef: any) => {
    try {
      const listResult = await listAll(folderRef);
      const deleteFilePromises = listResult.items.map(item => deleteObject(item));
      const deleteFolderPromises = listResult.prefixes.map(prefix => deleteRecursive(prefix));
      await Promise.all([...deleteFilePromises, ...deleteFolderPromises]);
    } catch (e) {
      console.warn("Skipping storage folder cleanup (may be empty or permission denied)", e);
    }
  };

  await deleteRecursive(userFolderRef);
};

/**
 * NUCLEAR OPTION: DELETE GUEST DATA
 * Wipes Firestore User Profile, Assets, and Storage Files.
 */
export const wipeGuestData = async (uid: string) => {
  console.log(`🧹 Wiping data for guest: ${uid}`);

  // A. Delete Firestore User Profile
  try {
    await deleteDoc(doc(db, "users", uid));
  } catch (e) {
    console.warn("User profile delete failed or not found", e);
  }

  // B. Delete Firestore Collections (files, assets, collections)
  const collections = ["files", "assets", "collections"];
  for (const col of collections) {
      try {
        const colRef = collection(db, "users", uid, col);
        const snapshot = await getDocs(colRef);
        const deletePromises = snapshot.docs.map(d => deleteDoc(d.ref));
        await Promise.all(deletePromises);
      } catch (e) {
          console.warn(`Collection ${col} cleanup check failed`, e);
      }
  }

  // C. Delete Storage Files (Recursive)
  await deleteUserStorage(uid);
};

/**
 * UPLOAD FILE (Storage + Firestore Sync)
 * 1. Uploads binary to Storage (user_uploads/{uid}/{category}/{filename})
 * 2. Generates Download URL
 * 3. Syncs metadata to Firestore
 */
export const uploadFile = async (
  uid: string,
  file: Blob | File,
  fileName: string,
  category: AssetCategory,
  metadata?: AssetMetadataInput,
  customId?: string
): Promise<AssetRecord> => {
  try {
    // 1. Prepare Storage Reference
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    // Path: user_uploads/{uid}/{category}/{filename}
    // We prepend a timestamp to the filename to ensure uniqueness and prevent overwrites
    const storagePath = `user_uploads/${uid}/${category}/${Date.now()}_${sanitizedName}`;
    const storageRef = ref(storage, storagePath);

    // 2. Upload Binary
    const snapshot = await uploadBytes(storageRef, file);
    const downloadUrl = await getDownloadURL(snapshot.ref);

    // 3. Construct AI Summary
    let aiSummary = "";
    if (metadata?.prompt || metadata?.seed) {
      aiSummary = `Prompt: ${metadata.prompt || 'N/A'} | Seed: ${metadata.seed || 'Random'}`;
    }

    // 4. Create Asset Record
    // Use customId if provided, otherwise generate a new one
    const fileId = customId || doc(collection(db, "users", uid, "files")).id;
    
    const assetRecord: AssetRecord = {
      id: fileId,
      uid,
      fileName: sanitizedName,
      fileType: file.type || 'application/octet-stream',
      size: file.size,
      downloadUrl,
      storagePath,
      category,
      brandArchetype: metadata?.brand,
      aiSummary,
      notes: metadata?.notes || "",
      uploadedAt: serverTimestamp(),
    };

    // 5. Sync to Firestore
    await saveFileMetadata(uid, fileId, assetRecord);

    return assetRecord;
  } catch (error) {
    console.error("Asset Upload Failed:", error);
    throw new Error("Failed to archive asset.");
  }
};

/**
 * UPLOAD GENERATED ASSET (Streamlined for App Generation)
 * Wraps uploadFile with specific logic for generated content.
 */
export const uploadGeneratedAsset = async (
  uid: string, 
  blob: Blob, 
  prompt: string, 
  brand: BrandArchetype
): Promise<AssetRecord> => {
   // Generate a clean filename with timestamp
   const fileName = `gen_${Date.now()}.png`;
   
   return uploadFile(
     uid,
     blob,
     fileName,
     'generated_editorial',
     {
       prompt: prompt,
       brand: brand,
       seed: 0 // Seed tracking can be added if passed
     }
   );
};

/**
 * SAVE COLLECTION STATE (Architect)
 * Uploads preview image and saves JSON state to Firestore
 */
export const saveCollectionState = async (
  uid: string,
  name: string, 
  tldrawSnapshot: any, // The JSON state of the canvas
  previewBlob: Blob    // A PNG screenshot of the canvas
) => {
    try {
      const collectionId = doc(collection(db, "users", uid, "collections")).id;
      
      // A. Upload the Preview Image
      const previewPath = `user_uploads/${uid}/collections/${collectionId}_preview.png`;
      const previewRef = ref(storage, previewPath);
      await uploadBytes(previewRef, previewBlob);
      const previewUrl = await getDownloadURL(previewRef);

      // B. Save the "Brains" (JSON State) to Firestore
      const docRef = doc(db, "users", uid, "collections", collectionId);
      await setDoc(docRef, {
        id: collectionId,
        uid: uid,
        name: name,
        previewUrl: previewUrl,
        canvasState: JSON.stringify(tldrawSnapshot), // Store the logic
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return collectionId;
    } catch (error) {
      console.error("Failed to save collection:", error);
      throw error;
    }
};

/**
 * GET DOWNLOAD URL
 * Finds the storage path from Firestore and gets the download URL.
 */
export const getAssetDownloadUrl = async (uid: string, fileId: string): Promise<string> => {
  try {
    const docRef = doc(db, "users", uid, "files", fileId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error("File record not found");
    }

    const data = docSnap.data() as AssetRecord;
    if (!data.storagePath) {
       // Fallback to stored downloadUrl if storagePath is missing
       if (data.downloadUrl) return data.downloadUrl;
       throw new Error("Storage path missing in record");
    }

    const storageRef = ref(storage, data.storagePath);
    const url = await getDownloadURL(storageRef);
    return url;
  } catch (error) {
    console.error("Error retrieving download URL:", error);
    throw error;
  }
};

/**
 * GET USER STORAGE USAGE
 * Aggregates the 'size' field of all documents in the user's 'files' subcollection.
 * Returns total bytes used.
 */
export const getUserStorageUsage = async (uid: string): Promise<number> => {
  try {
    const filesCollection = collection(db, "users", uid, "files");
    const snapshot = await getAggregateFromServer(filesCollection, {
      totalSize: sum('size')
    });
    return snapshot.data().totalSize || 0;
  } catch (error) {
    console.error("Error calculating storage:", error);
    return 0;
  }
};

/**
 * DELETE FILE (Storage + Firestore Cleanup)
 * Removes the file from Storage first, then deletes the Firestore record to prevent ghost assets.
 */
export const deleteFile = async (uid: string, fileId: string): Promise<void> => {
  try {
    const fileDocRef = doc(db, "users", uid, "files", fileId);
    const fileSnap = await getDoc(fileDocRef);

    if (!fileSnap.exists()) {
      throw new Error("Asset record not found.");
    }

    const data = fileSnap.data() as AssetRecord;

    // 1. Delete from Storage
    if (data.storagePath) {
      const storageRef = ref(storage, data.storagePath);
      await deleteObject(storageRef).catch((e) => {
        console.warn("Storage file missing or already deleted:", e);
        // Proceed to delete Firestore record even if storage file is missing
      });
    }

    // 2. Delete from Firestore
    await deleteDoc(fileDocRef);

  } catch (error) {
    console.error("Asset Deletion Failed:", error);
    throw error;
  }
};

/**
 * FETCH USER ASSETS
 * Retrieves the Digital Archive for a user, filtered by category and sorted by date.
 */
export const fetchUserAssets = async (uid: string, category?: AssetCategory): Promise<AssetRecord[]> => {
  try {
    const filesCollection = collection(db, "users", uid, "files");
    
    let q;
    if (category) {
      q = query(
        filesCollection, 
        where("category", "==", category), 
        orderBy("uploadedAt", "desc")
      );
    } else {
      q = query(filesCollection, orderBy("uploadedAt", "desc"));
    }

    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as AssetRecord));

  } catch (error) {
    console.error("Error fetching assets:", error);
    return [];
  }
};

/**
 * SAVE MODEL TO AGENCY
 * Stores a reference model in a dedicated subcollection.
 */
export const saveModelToAgency = async (blob: Blob, type: 'UPLOADED' | 'GENERATED'): Promise<SavedModel> => {
  if (!auth.currentUser) throw new Error("Not authenticated");
  
  try {
    const modelId = generateId();
    // Save to distinct folder
    const path = `atelier/${auth.currentUser.uid}/models/${modelId}.png`;
    const storageRef = ref(storage, path);

    await uploadBytes(storageRef, blob);
    const downloadURL = await getDownloadURL(storageRef);

    // Index in Firestore
    const docRef = doc(db, `users/${auth.currentUser.uid}/models`, modelId);
    const modelData: SavedModel = {
      id: modelId,
      url: downloadURL,
      type: type,
      timestamp: Date.now()
    };
    
    await setDoc(docRef, modelData);
    return modelData;
  } catch (error) {
    console.error("Save Model Failed:", error);
    throw new Error("Failed to save model to agency.");
  }
};

/**
 * FETCH SAVED MODELS (THE AGENCY)
 * Retrieves saved models for the user.
 */
export const fetchMyModels = async (): Promise<SavedModel[]> => {
  if (!auth.currentUser) return [];
  try {
    const q = query(collection(db, `users/${auth.currentUser.uid}/models`), orderBy("timestamp", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => d.data() as SavedModel);
  } catch (error) {
    console.error("Fetch Models Failed:", error);
    return [];
  }
};

/**
 * HELPER: Convert Base64 Data URL to Blob for Upload
 */
export const dataURLtoBlob = (dataurl: string): Blob => {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
};
    