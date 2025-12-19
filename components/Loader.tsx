
import React from 'react';

export const Loader: React.FC<{ text: string }> = ({ text }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <div className="relative w-16 h-16">
        <div className="absolute top-0 left-0 w-full h-full border-4 border-studio-border rounded-full"></div>
        <div className="absolute top-0 left-0 w-full h-full border-4 border-studio-accent rounded-full border-t-transparent animate-spin"></div>
      </div>
      <p className="text-slate-400 font-medium animate-pulse text-sm uppercase tracking-widest">{text}</p>
    </div>
  );
};
