
import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Loader2, Maximize2, Minimize2, Sparkles } from 'lucide-react';
import { BrandArchetype } from '../types';
import { sendChatMessage } from '../services/geminiService';

interface ChatBotProps {
  brand: BrandArchetype;
}

export const ChatBot: React.FC<ChatBotProps> = ({ brand }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string }[]>([
    { role: 'model', text: brand === BrandArchetype.DE_ROCHE ? 'Lumière Architectural System Online. Awaiting directive.' : 'Lumière Chaos Engine Initialized. Disrupt the silence.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isDeRoche = brand === BrandArchetype.DE_ROCHE;
  const themeClass = isDeRoche ? 'bg-[#E6E1E7] text-[#232222] border-[#232222]' : 'bg-[#0a0a0a] text-[#C5A059] border-[#C5A059]';
  const buttonClass = isDeRoche ? 'bg-[#232222] text-white' : 'bg-[#C5A059] text-black';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    // Format history for Gemini
    const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
    }));

    try {
        const responseText = await sendChatMessage(history, userMsg, brand);
        setMessages(prev => [...prev, { role: 'model', text: responseText }]);
    } catch (e) {
        setMessages(prev => [...prev, { role: 'model', text: "Signal lost. The void consumes." }]);
    } finally {
        setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-8 right-8 z-[90] p-4 rounded-full shadow-2xl transition-transform hover:scale-110 flex items-center justify-center border-2 ${isDeRoche ? 'bg-white text-black border-black' : 'bg-black text-[#C5A059] border-[#C5A059]'}`}
      >
        <MessageSquare size={24} />
      </button>
    );
  }

  return (
    <div 
        className={`fixed z-[90] border-2 shadow-2xl flex flex-col transition-all duration-300 ${themeClass} ${isExpanded ? 'bottom-8 right-8 w-[600px] h-[80vh] rounded-lg' : 'bottom-8 right-8 w-[350px] h-[500px] rounded-xl'}`}
    >
      {/* Header */}
      <div className={`p-4 border-b flex justify-between items-center ${isDeRoche ? 'border-gray-300 bg-white/50' : 'border-[#C5A059]/30 bg-black/50'}`}>
        <div className="flex items-center gap-2">
            <Sparkles size={16} />
            <span className="text-xs font-bold uppercase tracking-widest">Lumière Assistant</span>
        </div>
        <div className="flex items-center gap-2">
            <button onClick={() => setIsExpanded(!isExpanded)} className="hover:opacity-60">
                {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            <button onClick={() => setIsOpen(false)} className="hover:opacity-60">
                <X size={18} />
            </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar font-mono text-xs">
        {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-lg border ${
                    msg.role === 'user' 
                        ? (isDeRoche ? 'bg-[#232222] text-white border-transparent' : 'bg-[#C5A059] text-black border-transparent')
                        : (isDeRoche ? 'bg-white border-gray-300' : 'bg-[#1a1a1a] border-[#C5A059]/30')
                }`}>
                    {msg.text}
                </div>
            </div>
        ))}
        {isLoading && (
            <div className="flex justify-start">
                <div className={`p-3 rounded-lg border flex items-center gap-2 ${isDeRoche ? 'bg-white border-gray-300' : 'bg-[#1a1a1a] border-[#C5A059]/30'}`}>
                    <Loader2 size={12} className="animate-spin" />
                    <span className="opacity-50">Thinking...</span>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className={`p-3 border-t ${isDeRoche ? 'border-gray-300 bg-white' : 'border-[#C5A059]/30 bg-black'}`}>
        <div className="flex gap-2">
            <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask for creative direction..."
                className={`flex-1 bg-transparent border-none outline-none text-xs font-mono p-2 ${isDeRoche ? 'placeholder-gray-500' : 'placeholder-[#C5A059]/50'}`}
                autoFocus
            />
            <button 
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className={`p-2 rounded-md transition-colors disabled:opacity-50 ${buttonClass}`}
            >
                <Send size={16} />
            </button>
        </div>
      </div>
    </div>
  );
};
