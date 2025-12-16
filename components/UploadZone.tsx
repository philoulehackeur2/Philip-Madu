import React, { useState } from 'react';
import { Upload, X, AlertCircle } from 'lucide-react';
import { UploadedFile } from '../types';
import { fileToBase64, generateId, resizeImage } from '../utils';

interface UploadZoneProps {
  label: string;
  category: UploadedFile['category'];
  files: UploadedFile[];
  onAddFiles: (newFiles: UploadedFile[]) => void;
  onRemoveFile: (id: string) => void;
  accept?: string;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  label,
  category,
  files,
  onAddFiles,
  onRemoveFile,
  accept = "image/*"
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const MAX_FILES = 5;

  const processFiles = async (fileList: FileList) => {
    if (files.length + fileList.length > MAX_FILES) {
       alert(`Limit Reached: To ensure optimal AI performance, please limit uploads to ${MAX_FILES} assets per category.`);
       return;
    }

    const newFiles: UploadedFile[] = [];
    
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      // Basic check for image type if accept is set to image/*
      if (accept === "image/*" && !file.type.startsWith('image/')) {
        continue;
      }

      try {
        // RESIZE IMAGE ON CLIENT SIDE
        const resizedBlob = await resizeImage(file, 1024);
        const base64 = await fileToBase64(resizedBlob);
        
        newFiles.push({
          id: generateId(),
          file,
          previewUrl: URL.createObjectURL(resizedBlob), // Use the resized blob for preview
          base64,
          mimeType: resizedBlob.type, // Use the actual type (likely jpeg)
          category
        });
      } catch (error) {
        console.error("Error processing file", file.name, error);
      }
    }
    
    if (newFiles.length > 0) {
      onAddFiles(newFiles);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.currentTarget.contains(e.relatedTarget as Node)) {
      return;
    }
    
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFiles(e.dataTransfer.files);
    }
  };

  return (
    <div className="mb-6">
      <div className="flex justify-between items-baseline mb-2">
        <label className="text-xs uppercase tracking-widest text-gray-400 font-semibold">{label}</label>
        <span className={`text-[10px] ${files.length >= MAX_FILES ? 'text-red-500' : 'text-gray-600'}`}>{files.length}/{MAX_FILES} ASSETS</span>
      </div>
      
      <div 
        className={`grid grid-cols-4 gap-2 mb-2 p-1 rounded-md transition-all border ${isDragging ? 'bg-white/10 border-dashed border-white/50' : 'border-transparent -m-1'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {files.map((file) => (
          <div key={file.id} className="relative group aspect-square pointer-events-none">
            <div className="w-full h-full pointer-events-auto relative">
              <img 
                src={file.previewUrl} 
                alt="preview" 
                className="w-full h-full object-cover border border-white/10"
              />
              <button
                onClick={(e) => { e.stopPropagation(); onRemoveFile(file.id); }}
                className="absolute top-0 right-0 p-1 bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <X size={12} />
              </button>
            </div>
          </div>
        ))}
        
        {files.length < MAX_FILES && (
          <label className={`border border-dashed aspect-square flex flex-col items-center justify-center cursor-pointer transition-colors ${isDragging ? 'border-white bg-white/20' : 'border-white/20 hover:border-white/50 bg-white/5 hover:bg-white/10'}`}>
            <Upload size={16} className={`mb-1 ${isDragging ? 'text-white' : 'text-gray-400'}`} />
            <span className={`text-[9px] uppercase ${isDragging ? 'text-white' : 'text-gray-500'}`}>Add</span>
            <input 
              type="file" 
              className="hidden" 
              multiple 
              accept={accept} 
              onChange={handleFileChange} 
            />
          </label>
        )}
      </div>
      {files.length >= MAX_FILES && (
        <div className="flex items-center gap-1 mt-1 text-[9px] text-gray-500">
           <AlertCircle size={10} />
           <span>Max assets reached. This prevents AI overload.</span>
        </div>
      )}
    </div>
  );
};