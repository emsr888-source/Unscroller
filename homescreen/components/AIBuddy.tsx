import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Image as ImageIcon, Bot, Loader2 } from 'lucide-react';
import { generateResponse } from '../services/geminiService';
import { Message } from '../types';

interface AIBuddyProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIBuddy: React.FC<AIBuddyProps> = ({ isOpen, onClose }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: "Hi there! I'm your digital wellbeing buddy. How can I help you focus today?" }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && !selectedImage) || isLoading) return;

    const userMsg: Message = { 
      role: 'user', 
      text: input,
      image: selectedImage || undefined
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    const imageToSend = selectedImage ? selectedImage.split(',')[1] : undefined;
    setSelectedImage(null);
    setIsLoading(true);

    const result = await generateResponse(userMsg.text || "Analyze this image", imageToSend);

    setMessages(prev => [...prev, { 
      role: 'model', 
      text: result.text,
      image: result.image // Display generated image if present
    }]);
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div 
        className="bg-[#fdfbf7] w-full max-w-md h-[80vh] rounded-3xl shadow-2xl flex flex-col border-4 border-slate-700 overflow-hidden relative"
        style={{ borderRadius: "20px 25px 20px 25px" }}
      >
        {/* Header */}
        <div className="bg-slate-100 p-4 border-b-2 border-slate-200 flex justify-between items-center relative z-10">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 rounded-full border border-slate-300">
               <Bot size={24} className="text-slate-700" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-800">AI Buddy</h3>
              <p className="text-xs text-slate-500">Powered by Gemini Nano Banana</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition">
            <X size={24} className="text-slate-600" />
          </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-grid-paper relative" ref={scrollRef}>
           <div className="absolute inset-0 bg-grid-overlay pointer-events-none z-0"></div>
           <div className="relative z-10 space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-[85%] p-3 rounded-2xl border-2 text-lg leading-snug ${
                    msg.role === 'user' 
                      ? 'bg-blue-100 border-blue-300 rounded-tr-sm' 
                      : 'bg-white border-slate-300 rounded-tl-sm'
                  }`}
                  style={{ boxShadow: "2px 2px 0px rgba(0,0,0,0.05)" }}
                >
                  {/* Image User Uploaded or Model Generated */}
                  {msg.image && (
                    <img src={msg.image} alt={msg.role === 'user' ? "User upload" : "Generated content"} className="w-full rounded-lg mb-2 border border-slate-200" />
                  )}
                  {msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white p-3 rounded-2xl rounded-tl-sm border-2 border-slate-300 flex items-center gap-2">
                  <Loader2 className="animate-spin text-slate-400" size={20} />
                  <span className="text-slate-400">Thinking...</span>
                </div>
              </div>
            )}
           </div>
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t-2 border-slate-200 relative z-10">
          {selectedImage && (
            <div className="mb-2 relative inline-block">
              <img src={selectedImage} alt="Preview" className="h-16 w-16 object-cover rounded-lg border-2 border-slate-300" />
              <button 
                onClick={() => setSelectedImage(null)}
                className="absolute -top-2 -right-2 bg-red-400 text-white rounded-full p-0.5"
              >
                <X size={14} />
              </button>
            </div>
          )}
          <div className="flex gap-2 items-end">
            <label className="p-3 text-slate-500 hover:bg-slate-100 rounded-xl cursor-pointer transition border-2 border-transparent hover:border-slate-200">
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              <ImageIcon size={24} />
            </label>
            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Type a message..."
                className="w-full p-3 pr-10 rounded-xl border-2 border-slate-300 focus:border-blue-400 focus:outline-none resize-none bg-slate-50 font-hand text-xl h-14"
              />
            </div>
            <button 
              onClick={handleSend}
              disabled={isLoading || (!input && !selectedImage)}
              className="p-3 bg-slate-800 text-white rounded-xl hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition border-2 border-slate-800"
            >
              <Send size={24} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};