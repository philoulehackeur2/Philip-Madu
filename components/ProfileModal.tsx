
import React, { useState, useRef } from 'react';
import { X, User, Save, Trash2, AlertTriangle, Camera, Upload, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { BrandArchetype } from '../types';
import { updateUserProfile } from '../services/userService';
import { uploadProfilePhoto, deleteObjectFromUrl } from '../services/storageService';
import { updateProfile } from 'firebase/auth';
import { auth } from '../firebase';

interface ProfileModalProps {
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ onClose }) => {
  const { user, userProfile, refreshProfile, deleteAccount, logout } = useAuth();
  const [name, setName] = useState(userProfile?.displayName || '');
  const [archetype, setArchetype] = useState<BrandArchetype>(userProfile?.brandArchetype || BrandArchetype.DE_ROCHE);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  
  // Photo State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const isDeRoche = userProfile?.brandArchetype === BrandArchetype.DE_ROCHE;
  const borderColor = isDeRoche ? 'border-gray-200' : 'border-[#C5A059]';
  const bgColor = isDeRoche ? 'bg-[#f4f4f4]' : 'bg-[#0a0a0a]';
  const textColor = isDeRoche ? 'text-black' : 'text-[#C5A059]';

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      // 1. Update Firestore
      await updateUserProfile(user.uid, {
        displayName: name,
        brandArchetype: archetype
      });
      
      // 2. Update Auth Profile (Display Name)
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: name });
      }

      await refreshProfile();
      onClose();
    } catch (e) {
      console.error(e);
      alert("Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    // Basic validation
    if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
      alert("Please upload an image file under 5MB.");
      return;
    }

    setIsUploadingPhoto(true);
    try {
      // 1. Delete old photo if it exists and is a firebase storage URL
      if (userProfile?.photoURL && userProfile.photoURL.includes('firebasestorage')) {
        await deleteObjectFromUrl(userProfile.photoURL);
      }

      // 2. Upload new photo
      const newPhotoUrl = await uploadProfilePhoto(user.uid, file);

      // 3. Update Firestore
      await updateUserProfile(user.uid, { photoURL: newPhotoUrl });

      // 4. Update Auth Object (Critical for immediate UI reflection)
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { photoURL: newPhotoUrl });
      }

      // 5. Refresh Local State
      await refreshProfile();

    } catch (err) {
      console.error("Profile photo update failed:", err);
      alert("Failed to upload photo. Please try again.");
    } finally {
      setIsUploadingPhoto(false);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !window.confirm("Remove profile photo?")) return;

    setIsUploadingPhoto(true);
    try {
      if (userProfile?.photoURL && userProfile.photoURL.includes('firebasestorage')) {
        await deleteObjectFromUrl(userProfile.photoURL);
      }

      await updateUserProfile(user.uid, { photoURL: null });
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { photoURL: '' });
      }
      await refreshProfile();
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirm !== 'DELETE') return;
    if (window.confirm("Are you absolutely sure? This cannot be undone.")) {
      try {
        await deleteAccount();
      } catch (e: any) {
        if (e.code === 'auth/requires-recent-login') {
          alert("Security: Please sign out and sign back in to delete your account.");
          logout();
        } else {
          alert("Failed to delete account.");
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
      <div className={`w-full max-w-md p-8 border ${borderColor} ${bgColor} shadow-2xl relative`}>
        <button onClick={onClose} className={`absolute top-4 right-4 hover:opacity-50 ${textColor}`}>
          <X size={24} />
        </button>

        <div className="flex items-center gap-4 mb-8">
          <div className="relative group cursor-pointer">
            <div 
              className={`w-16 h-16 rounded-full border-2 flex items-center justify-center overflow-hidden transition-all group-hover:opacity-50 ${borderColor} relative`}
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploadingPhoto ? (
                <Loader2 size={24} className={`animate-spin ${textColor}`} />
              ) : userProfile?.photoURL ? (
                <img src={userProfile.photoURL} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User size={32} className={textColor} />
              )}
            </div>
            
            {/* Upload Overlay Icon */}
            <div 
              className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
            >
              <Camera size={20} className={isDeRoche ? 'text-black' : 'text-white'} />
            </div>

            {/* Hidden Input */}
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handlePhotoSelect}
            />

            {/* Remove Photo Button */}
            {userProfile?.photoURL && !isUploadingPhoto && (
              <button 
                onClick={handleRemovePhoto}
                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
                title="Remove Photo"
              >
                <X size={10} />
              </button>
            )}
          </div>

          <div>
            <h2 className={`text-xl font-header uppercase tracking-wider ${textColor}`}>Identity Card</h2>
            <p className="text-[10px] font-mono opacity-60 uppercase">{userProfile?.role} // {userProfile?.uid.slice(0,6)}</p>
            {isUploadingPhoto && <p className="text-[9px] font-mono animate-pulse mt-1">Syncing Storage...</p>}
          </div>
        </div>

        <div className="space-y-6">
          
          {/* Name Input */}
          <div className="space-y-2">
            <label className={`text-[9px] uppercase font-bold tracking-widest ${textColor} opacity-70`}>Designer Name</label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              className={`w-full p-3 bg-transparent border text-xs font-mono focus:outline-none ${borderColor} ${textColor}`}
            />
          </div>

          {/* Archetype Select */}
          <div className="space-y-2">
            <label className={`text-[9px] uppercase font-bold tracking-widest ${textColor} opacity-70`}>Primary Archetype</label>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => setArchetype(BrandArchetype.DE_ROCHE)}
                className={`py-3 text-[10px] font-bold uppercase border transition-all ${archetype === BrandArchetype.DE_ROCHE ? 'bg-black text-white border-black' : 'opacity-50 hover:opacity-100 border-gray-500'}`}
              >
                De Roche
              </button>
              <button 
                onClick={() => setArchetype(BrandArchetype.CHAOSCHICC)}
                className={`py-3 text-[10px] font-bold uppercase border transition-all ${archetype === BrandArchetype.CHAOSCHICC ? 'bg-[#C5A059] text-black border-[#C5A059]' : 'opacity-50 hover:opacity-100 border-[#C5A059]/50 text-[#C5A059]'}`}
              >
                ChaosChicc
              </button>
            </div>
          </div>

          {/* Save Button */}
          <button 
            onClick={handleSave}
            disabled={isSaving || isUploadingPhoto}
            className={`w-full py-3 flex items-center justify-center gap-2 font-bold uppercase text-xs tracking-widest transition-all ${isDeRoche ? 'bg-black text-white hover:bg-gray-800' : 'bg-[#C5A059] text-black hover:bg-white'}`}
          >
            {isSaving ? "Updating..." : <><Save size={14}/> Update Profile</>}
          </button>

          {/* Danger Zone */}
          <div className="mt-8 pt-8 border-t border-dashed border-red-900/30">
            <h3 className="text-red-500 text-xs font-bold uppercase mb-4 flex items-center gap-2">
              <AlertTriangle size={14} /> Danger Zone
            </h3>
            <p className="text-[10px] text-gray-500 mb-4">
              Permanent deletion. Type "DELETE" to confirm.
            </p>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="DELETE"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                className="flex-1 p-2 bg-red-500/5 border border-red-500/20 text-red-500 text-xs font-mono focus:outline-none"
              />
              <button 
                onClick={handleDelete}
                disabled={deleteConfirm !== 'DELETE'}
                className="px-4 bg-red-600 text-white text-xs font-bold uppercase hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
