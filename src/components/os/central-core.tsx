'use client';

import { useState } from 'react';
import { Mic } from 'lucide-react';

const CentralCore = () => {
  const [isVoiceMode, setIsVoiceMode] = useState(false);

  const handleVoiceToggle = () => {
    setIsVoiceMode(true);
    setTimeout(() => setIsVoiceMode(false), 2000); // Animation duration
  };

  return (
    <div className="relative flex h-80 w-80 items-center justify-center">
      {/* Pulsing Ripples for Voice Mode */}
      {isVoiceMode &&
        Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="absolute h-full w-full rounded-full bg-primary/20 animate-pulse-ripple"
            style={{ animationDelay: `${i * 0.3}s` }}
          />
        ))}

      {/* Rotating Rings */}
      <div className="absolute h-full w-full animate-spin-slow rounded-full border border-dashed border-primary/20 [animation-direction:reverse]" />
      <div className="absolute h-[85%] w-[85%] animate-spin-slow rounded-full border border-accent/30" />
      <div className="absolute h-[70%] w-[70%] animate-[spin_18s_linear_infinite] rounded-full border border-dashed border-primary/20" />
      
      {/* Center Button */}
      <button
        onClick={handleVoiceToggle}
        className="group relative z-10 flex h-24 w-24 items-center justify-center rounded-full bg-background/50 backdrop-blur-sm transition-all duration-300 ease-in-out hover:bg-primary/20 hover:scale-105"
        style={{
          boxShadow: '0 0 15px hsl(var(--primary)/0.3), inset 0 0 10px hsl(var(--primary)/0.2)',
        }}
      >
        <div className="absolute inset-0 rounded-full border-2 border-primary/50 group-hover:border-primary" />
        <Mic className="h-10 w-10 text-primary transition-all duration-300 group-hover:h-12 group-hover:w-12 [filter:drop-shadow(0_0_5px_hsl(var(--primary)))]" />
      </button>
    </div>
  );
};

export default CentralCore;
