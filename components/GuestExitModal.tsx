
import React, { useState } from 'react';
import { AlertTriangle, Save, Trash2, Loader2, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface GuestExitModalProps {
  onClose: () => void;      // Logic if they cancel (stay on site)
  onConvertToUser: () => void; // Logic if they want to save (Open Signup)
}

export const GuestExitModal: React.FC<GuestExitModalProps> = ({ onClose, onConvertToUser }) => {
  const { deleteGuestAccount } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleRefuseAndLeave = async () => {
    if (confirm("FINAL WARNING: This will permanently delete all generated designs. Confirm?")) {
        setIsDeleting(true);
        try {
            await deleteGuestAccount();
            // User is now deleted and logged out. App will revert to AuthOverlay.
        } catch (e) {
            console.error("Delete failed", e);
            setIsDeleting(false);
        }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 backdrop-blur-md">
      <div className="w-full max-w-md bg-[#111] border border-red-500/30 rounded-lg p-6 relative animate-in fade-in zoom-in duration-200">
        
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
             <AlertTriangle size={24} />
          </div>
          
          <div>
             <h2 className="text-xl font-bold text-white uppercase tracking-wider">Unsaved Atelier Session</h2>
             <p className="text-xs text-gray-400 mt-2 font-mono">
               You are in Guest Mode. If you leave without creating an account, 
               all generated assets and tech packs will be destroyed immediately.
             </p>
          </div>

          <div className="grid grid-cols-1 w-full gap-3 mt-4">
             {/* OPTION 1: SAVE */}
             <button 
               onClick={onConvertToUser}
               className="w-full py-3 bg-[#C5A059] text-black font-bold uppercase tracking-widest text-xs rounded hover:bg-white transition-colors flex items-center justify-center gap-2"
             >
               <Save size={14} /> Create Account & Save
             </button>

             {/* OPTION 2: DESTROY */}
             <button 
               onClick={handleRefuseAndLeave}
               disabled={isDeleting}
               className="w-full py-3 border border-red-900/50 text-red-700 font-bold uppercase tracking-widest text-xs rounded hover:bg-red-900/20 transition-colors flex items-center justify-center gap-2"
             >
               {isDeleting ? <Loader2 className="animate-spin" size={14}/> : <Trash2 size={14} />}
               {isDeleting ? "WIPING DATA..." : "Delete Files & Leave"}
             </button>
          </div>

          <button onClick={onClose} className="text-[9px] uppercase text-gray-600 hover:text-gray-400 mt-4">
             Cancel (Return to Studio)
          </button>
        </div>
      </div>
    </div>
  );
};
