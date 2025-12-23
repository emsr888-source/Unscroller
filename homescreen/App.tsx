import React, { useState } from 'react';
import { 
  Settings, Flame, 
  Target, Bot, ClipboardList, Book, Trophy, Cloud, RotateCcw, 
  Handshake, BarChart2, Mail, MessageCircle, User as UserIcon, CheckCircle, Siren,
  Check, Minus
} from 'lucide-react';
import { WatercolorButton, WatercolorProgress } from './components/WatercolorUI';
import { CircularStreak } from './components/CircularStreak';
import { AIBuddy } from './components/AIBuddy';
import { NavTab } from './types';

// --- Custom Ink-Style Social Media Icons ---

const InstagramLogo = ({ size = 26, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const XLogo = ({ size = 26, className = "" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const YouTubeLogo = ({ size = 26, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
    <path d="m10 15 5-3-5-3z" fill="currentColor" stroke="none" />
  </svg>
);

const TikTokLogo = ({ size = 26, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
  </svg>
);

const FacebookLogo = ({ size = 26, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

// ----------------------------------------

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>(NavTab.Home);
  const [isBuddyOpen, setIsBuddyOpen] = useState(false);

  return (
    <div className="min-h-screen bg-grid-paper flex justify-center overflow-x-hidden relative">
      <div className="bg-grid-overlay"></div>
      <div className="w-full max-w-md bg-transparent min-h-screen pb-24 relative z-10">
        
        {/* Header */}
        <header className="px-2 pt-6 pb-2 flex justify-between items-center">
          <div className="flex items-center gap-1">
            <h1 className="text-3xl font-serif text-slate-600 tracking-normal font-bold">UNSCROLLER</h1>
            
            {/* Level Meter */}
            <div className="flex items-center gap-1 ml-4">
                <div className="relative w-8 h-8 flex items-center justify-center">
                   {/* Watercolor Background Blob */}
                   <div className="absolute inset-0 bg-sky-200 rounded-full opacity-60 transform rotate-12 scale-90" style={{ borderRadius: "55% 45% 60% 40% / 50% 60% 40% 60%" }}></div>
                   {/* Circle Outline */}
                   <div className="absolute inset-0 border border-slate-500 rounded-full opacity-60"></div>
                   <span className="relative z-10 font-sans font-medium text-slate-800 text-xs">Lv 3</span>
                </div>
                <div className="flex flex-col justify-center leading-[0.85]">
                    <span className="text-[11px] text-slate-900 font-sans font-semibold">Time</span>
                    <span className="text-[11px] text-slate-900 font-sans font-normal">Reclaimer</span>
                </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
             <div className="flex items-center gap-0.5">
               <span className="text-xl font-bold text-slate-800">5</span>
               <Flame className="text-orange-500 fill-orange-500" size={20} />
             </div>
             <Settings className="text-slate-700" size={22} />
          </div>
        </header>

        {/* Days of Week */}
        <div className="px-2 py-2 flex justify-between text-slate-800 font-bold mb-2">
          {['S','M','T','W','T','F','S'].map((day, i) => {
             const isCompleted = i < 5;
             return (
               <div key={i} className="flex flex-col items-center gap-1">
                 {/* Sketchy Circle Container */}
                 <div className="relative w-9 h-9 flex items-center justify-center">
                   
                   {/* Watercolor Color Blob for Checked Days */}
                   {isCompleted && (
                     <div 
                       className="absolute inset-0 bg-blue-200/50 rounded-full transform scale-90" 
                       style={{ borderRadius: "55% 45% 60% 40% / 50% 60% 40% 60%", transform: "scale(0.9) rotate(-10deg)" }}
                     />
                   )}

                   {/* Hand-drawn circle SVG */}
                   <svg className="absolute inset-0 w-full h-full text-slate-600" viewBox="0 0 40 40">
                     <path 
                       d="M20 3 C30 3 37 10 37 20 C37 31 30 38 20 38 C9 38 3 30 3 20 C3 11 10 3 20 3 Z" 
                       fill="none" 
                       stroke="currentColor" 
                       strokeWidth="1.3"
                       strokeLinecap="round"
                       style={{ transform: `rotate(${i * 45}deg)`, transformOrigin: 'center' }}
                     />
                   </svg>
                   {/* Icon */}
                   <div className="relative z-10 text-slate-800">
                     {isCompleted ? (
                       <Check size={20} strokeWidth={3} />
                     ) : (
                       <Minus size={20} strokeWidth={3} />
                     )}
                   </div>
                 </div>
                 {/* Day Label */}
                 <span className="text-sm font-hand font-bold text-slate-500">{day}</span>
               </div>
             );
          })}
        </div>

        {/* Quick Actions Row */}
        <div className="flex justify-between items-center px-2 mb-4">
          {[InstagramLogo, XLogo, YouTubeLogo, TikTokLogo, FacebookLogo].map((Icon, i) => (
            <button key={i} className="text-slate-700 hover:text-slate-900 transition-transform active:scale-90 p-2">
               <Icon size={26} />
            </button>
          ))}
        </div>

        {/* Main Circular Feature */}
        <CircularStreak days={5} />

        {/* Quote */}
        <div className="text-center mb-6 px-4">
           <p className="font-hand text-3xl text-slate-800 transform -rotate-1">
             "Work hard. Stay humble."
           </p>
        </div>

        {/* Big Action Buttons */}
        <div className="grid grid-cols-2 gap-3 px-3 mb-8">
          <WatercolorButton className="h-20" color="blue">
            <Target className="text-slate-700" size={28} />
            <div className="flex flex-col items-start leading-tight">
               <span className="text-lg font-bold">Start Focus</span>
               <span className="font-semibold text-slate-600">Session</span>
            </div>
          </WatercolorButton>
          <WatercolorButton className="h-20" color="white" onClick={() => setIsBuddyOpen(true)}>
            <Bot className="text-slate-700" size={28} />
            <span className="text-xl font-bold">AI Buddy</span>
          </WatercolorButton>
        </div>

        {/* Grid Menu */}
        <div className="grid grid-cols-5 gap-1 px-2 mb-8">
          {[
            { icon: ClipboardList, label: 'To-Do' },
            { icon: Book, label: 'Journal' },
            { icon: Trophy, label: 'Challenges' },
            { icon: Cloud, label: 'My Sky' },
            { icon: RotateCcw, label: 'Reset' },
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center gap-1 cursor-pointer group active:scale-95 transition-transform">
               <div className="w-12 h-12 flex items-center justify-center mb-0">
                  <item.icon size={30} className="text-slate-700" strokeWidth={1.5} />
               </div>
               <span className="text-xs font-bold text-slate-600 whitespace-nowrap">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Progress Bars */}
        <div className="grid grid-cols-2 gap-4 px-3 mb-6">
           <WatercolorProgress label="1/2 Today" subLabel="" current={1} total={2} color="blue" />
           <WatercolorProgress label="2/5 Week" subLabel="" current={2} total={5} color="green" />
        </div>

        {/* Panic Button */}
        <div className="px-3 mb-8">
          <WatercolorButton color="red" className="w-full h-16 shadow-lg">
             <div className="flex items-center gap-3">
               <Siren size={32} className="text-red-600 transform -rotate-12" fill="rgba(220, 38, 38, 0.2)" />
               <span className="text-2xl text-slate-800 font-bold">Panic Button</span>
             </div>
          </WatercolorButton>
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-transparent py-4 px-2 max-w-md mx-auto z-20">
           <div className="flex justify-between items-center text-slate-800">
              <button onClick={() => setActiveTab(NavTab.Connect)} className={`p-2 transition-transform active:scale-90 ${activeTab === NavTab.Connect ? 'text-blue-600' : ''}`}>
                 <Handshake size={32} strokeWidth={1.5} />
              </button>
              <button onClick={() => setActiveTab(NavTab.Stats)} className={`p-2 transition-transform active:scale-90 ${activeTab === NavTab.Stats ? 'text-blue-600' : ''}`}>
                 <BarChart2 size={32} strokeWidth={1.5} />
              </button>
              <button onClick={() => setActiveTab(NavTab.Home)} className={`p-2 transition-transform active:scale-90 ${activeTab === NavTab.Home ? 'text-blue-600' : ''}`}>
                 <Mail size={32} strokeWidth={1.5} />
              </button>
              <button onClick={() => setActiveTab(NavTab.Chat)} className={`p-2 transition-transform active:scale-90 ${activeTab === NavTab.Chat ? 'text-blue-600' : ''}`}>
                 <MessageCircle size={32} strokeWidth={1.5} />
              </button>
              <button onClick={() => setActiveTab(NavTab.Profile)} className={`p-2 transition-transform active:scale-90 ${activeTab === NavTab.Profile ? 'text-blue-600' : ''}`}>
                 <UserIcon size={32} strokeWidth={1.5} />
              </button>
           </div>
        </div>

        {/* AI Modal */}
        <AIBuddy isOpen={isBuddyOpen} onClose={() => setIsBuddyOpen(false)} />

      </div>
    </div>
  );
};

export default App;