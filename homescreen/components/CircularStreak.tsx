import React from 'react';

export const CircularStreak: React.FC<{ days: number }> = ({ days }) => {
  return (
    <div className="relative w-64 h-64 mx-auto flex items-center justify-center my-4">
      {/* Hand-drawn SVG Circle */}
      <svg className="absolute w-full h-full rotate-[-90deg]" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="watercolorGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#93C5FD" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#6EE7B7" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#34D399" stopOpacity="0.8" />
          </linearGradient>
          <filter id="displacementFilter">
            <feTurbulence type="turbulence" baseFrequency="0.03" numOctaves="2" result="turbulence" />
            <feDisplacementMap in2="turbulence" in="SourceGraphic" scale="3" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
        
        {/* Background Track */}
        <circle 
          cx="50" cy="50" r="45" 
          fill="none" 
          stroke="#e5e7eb" 
          strokeWidth="4" 
          strokeLinecap="round"
          className="opacity-50"
        />

        {/* Progress Stroke - simulates imperfect hand drawing */}
        <circle 
          cx="50" cy="50" r="45" 
          fill="none" 
          stroke="url(#watercolorGradient)" 
          strokeWidth="7" 
          strokeDasharray="283" 
          strokeDashoffset="60" // Arbitrary progress
          strokeLinecap="round"
          style={{ filter: "url(#displacementFilter)" }}
        />
      </svg>
      
      <div className="z-10 text-center flex flex-col items-center mt-2">
        <span className="text-sm font-semibold text-slate-600 mb-0 font-hand">Scroll-free streak</span>
        <span className="font-serif text-5xl text-slate-700 leading-tight">{days} Days</span>
        <span className="text-md text-slate-800 font-bold mt-1 font-hand">Keep it up! 🔥</span>
      </div>
    </div>
  );
};