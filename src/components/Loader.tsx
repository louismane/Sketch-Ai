import React from 'react';

export const Loader: React.FC<{ text: string }> = ({ text }) => {
  return (
    <div
      className="flex flex-col items-center justify-center p-8 space-y-4"
      role="alert"
      aria-busy="true"
      aria-live="polite"
    >
      <div
        className="relative w-16 h-16 rounded-full"
        style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          boxShadow:
            '0 4px 30px rgba(255, 255, 255, 0.1), inset 0 0 10px rgba(255, 255, 255, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
        }}
      >
        {/* Static glossy circle */}
        <div
          className="absolute inset-0 rounded-full border-4 border-white border-opacity-20"
          style={{
            boxShadow:
              '0 0 8px 2px rgba(255,255,255,0.4), inset 0 0 15px rgba(255,255,255,0.3)',
          }}
        ></div>

        {/* Spinning border */}
        <div
          className="absolute inset-0 rounded-full border-4 border-t-transparent border-white animate-spin"
          style={{
            borderRightColor: 'rgba(255, 255, 255, 0.7)',
            borderBottomColor: 'rgba(255, 255, 255, 0.7)',
          }}
        ></div>
      </div>

      <p className="text-white font-semibold animate-pulse text-sm uppercase tracking-widest select-none drop-shadow-md">
        {text}
      </p>
    </div>
  );
};
