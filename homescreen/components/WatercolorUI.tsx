import React from 'react';

// Random border radius generator for hand-drawn look
const organicBorder = "255px 15px 225px 15px / 15px 225px 15px 255px";

export const WatercolorButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  color?: 'blue' | 'red' | 'green' | 'white';
}> = ({ children, onClick, className = "", color = 'white' }) => {
  
  let bgClass = "bg-white";
  if (color === 'red') bgClass = "bg-gradient-to-r from-red-300 to-red-400";
  if (color === 'blue') bgClass = "bg-gradient-to-r from-blue-100 to-blue-200";
  if (color === 'green') bgClass = "bg-gradient-to-r from-green-100 to-green-200";

  return (
    <button
      onClick={onClick}
      className={`relative group transition-transform active:scale-95 ${className}`}
    >
      <div 
        className={`absolute inset-0 border-2 border-slate-700 opacity-90 ${bgClass}`}
        style={{ borderRadius: organicBorder, boxShadow: "2px 3px 0px rgba(0,0,0,0.15)" }} 
      />
      <div className="relative z-10 p-4 flex items-center justify-center gap-3 font-bold text-slate-800 text-lg">
        {children}
      </div>
    </button>
  );
};

export const SketchIcon: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className }) => (
  <div className={`relative ${className}`}>
     {children}
  </div>
);

export const WatercolorProgress: React.FC<{
  label: string;
  subLabel: string;
  current: number;
  total: number;
  color: 'blue' | 'green';
}> = ({ label, subLabel, current, total, color }) => {
  const percent = Math.min((current / total) * 100, 100);
  const barColor = color === 'blue' ? 'bg-blue-300' : 'bg-teal-300';
  
  return (
    <div className="flex flex-col w-full mb-4">
      <div className="flex justify-between mb-1 text-sm font-bold text-slate-700 px-1">
        <span>{label}</span>
      </div>
      <div className="relative h-4 w-full border-2 border-slate-700 rounded-full overflow-hidden p-[2px]">
        <div 
          className={`h-full rounded-full opacity-80 ${barColor}`}
          style={{ width: `${percent}%`, borderRadius: "10px 4px 4px 10px" }}
        />
      </div>
    </div>
  );
};
