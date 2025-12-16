import React from 'react';
import { Key } from 'lucide-react';

interface ApiKeyModalProps {
  onSelect: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onSelect }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <div className="bg-[#111] border border-white/20 p-8 max-w-md w-full text-center shadow-2xl shadow-white/5">
        <div className="mx-auto w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6">
          <Key className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-serif text-white mb-4">Access Required</h2>
        <p className="text-gray-400 mb-8 font-light">
          To generate high-resolution 4K fashion editorials, you must select a valid API key with billing enabled.
        </p>
        <button
          onClick={onSelect}
          className="w-full py-4 bg-white text-black font-semibold tracking-widest hover:bg-gray-200 transition-colors uppercase text-sm"
        >
          Select API Key
        </button>
        <p className="mt-4 text-xs text-gray-600">
          <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-400">
            Read billing documentation
          </a>
        </p>
      </div>
    </div>
  );
};