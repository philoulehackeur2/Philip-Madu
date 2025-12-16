import React, { useState, useRef, useEffect } from 'react';
import { Pen } from 'lucide-react';
import { BrandArchetype } from '../types';

interface EditableCaptionProps {
  initialValue?: string;
  onSave: (value: string) => void;
  textColorClass: string;
}

export const EditableCaption: React.FC<EditableCaptionProps> = ({ initialValue = '', onSave, textColorClass }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    if (value !== initialValue) {
      onSave(value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onClick={(e) => e.stopPropagation()}
        className="w-full bg-transparent border-b border-white/20 text-[10px] text-white py-1 focus:outline-none focus:border-white font-mono uppercase tracking-wide"
        placeholder="Type caption..."
      />
    );
  }

  return (
    <div 
      className="group flex items-center justify-between gap-2 cursor-text py-1 min-h-[24px]"
      onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
    >
      <p className={`text-[10px] font-mono truncate uppercase tracking-wide ${value ? 'text-gray-300' : 'text-gray-600'}`}>
        {value || 'Add caption...'}
      </p>
      <Pen size={10} className={`opacity-0 group-hover:opacity-100 transition-opacity ${textColorClass}`} />
    </div>
  );
};