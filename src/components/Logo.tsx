import React from 'react';

export const Logo = ({ className = "w-24 h-24" }: { className?: string }) => (
  <div className={`relative flex items-center justify-center ${className}`}>
    <div className="absolute inset-0 bg-neon-red/20 blur-2xl rounded-full animate-pulse"></div>
    <img 
      src="https://i.ibb.co/R49QdJxS/logo.png" 
      alt="Live TV Play" 
      className="relative z-10 w-full h-full object-contain drop-shadow-[0_0_15px_rgba(255,45,85,0.5)]"
      referrerPolicy="no-referrer"
    />
  </div>
);
