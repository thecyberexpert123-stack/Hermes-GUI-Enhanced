'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Orbitron } from 'next/font/google';

const orbitron = Orbitron({ subsets: ['latin'] });

type AiStatus = 'listening' | 'thinking' | 'speaking' | 'idle';

interface VoiceHUDProps {
  closeDialog: () => void;
}

const VoiceHUD = ({ closeDialog }: VoiceHUDProps) => {
  const [status, setStatus] = useState<AiStatus>('listening');
  const [show, setShow] = useState(true);
  const [particles, setParticles] = useState<React.CSSProperties[]>([]);
  const [holoGeometries, setHoloGeometries] = useState<React.CSSProperties[]>([]);

  useEffect(() => {
    const newParticles = Array.from({ length: 50 }).map(() => ({
        width: `${Math.random() * 2 + 1}px`,
        height: `${Math.random() * 2 + 1}px`,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 5}s`,
        animationDuration: `${Math.random() * 10 + 5}s`,
    }));
    setParticles(newParticles);

    const newHoloGeometries = Array.from({ length: 10 }).map((_, i) => ({
      animationDelay: `${i * 0.5}s`,
      left: `${Math.random() * 80 + 10}%`,
    }));
    setHoloGeometries(newHoloGeometries);

    const sequence = async () => {
      setStatus('listening');
      await new Promise(resolve => setTimeout(resolve, 4000));
      setStatus('thinking');
      await new Promise(resolve => setTimeout(resolve, 3000));
      setStatus('speaking');
      await new Promise(resolve => setTimeout(resolve, 5000));
      setShow(false);
      await new Promise(resolve => setTimeout(resolve, 500)); // wait for fade out animation
      closeDialog();
    };
    sequence();
  }, [closeDialog]);

  const statusText: Record<AiStatus, string> = {
    listening: 'Listening...',
    thinking: 'Processing...',
    speaking: 'Responding...',
    idle: 'Idle',
  };

  const statusDurations: Record<AiStatus, number> = {
    listening: 4,
    thinking: 3,
    speaking: 5,
    idle: 0,
  };

  return (
    <div
      className={cn(
        'relative flex items-center justify-center w-[400px] h-[400px] transition-opacity duration-500',
        show ? 'opacity-100' : 'opacity-0'
      )}
    >
      {/* Background Glow */}
      <div className="absolute w-full h-full bg-primary/10 rounded-full blur-3xl animate-pulse" />

      {/* Particle Effects */}
      <div className="absolute w-full h-full overflow-hidden rounded-full">
        {particles.map((style, i) => (
          <div
            key={i}
            className="absolute bg-accent rounded-full animate-particle-float"
            style={style}
          />
        ))}
      </div>

      {/* Core Rings */}
      <div className="relative w-80 h-80 flex items-center justify-center">
        {/* Ring Animations */}
        <div className="absolute w-full h-full rounded-full border-2 border-dashed border-primary/20 animate-[spin_40s_linear_infinite]" />
        <div className="absolute w-[85%] h-[85%] rounded-full border border-accent/30 animate-[spin_30s_linear_infinite_reverse]" />
        <div className="absolute w-[70%] h-[70%] rounded-full border-2 border-primary/50 animate-[spin_10s_linear_infinite]" />
        
        {/* Voice Visualization - Listening */}
        {status === 'listening' && (
          <>
            <div className="absolute w-[90%] h-[90%] rounded-full border-2 border-accent/50 animate-pulse-slow" />
            <div className="absolute w-full h-full rounded-full animate-waveform" />
          </>
        )}

        {/* Thinking visualization */}
        {status === 'thinking' && (
            <>
                <div className="absolute w-full h-full animate-scanline-rotate">
                    <div className="h-full w-px bg-gradient-to-b from-transparent via-accent to-transparent" />
                </div>
                {/* Holographic Geometry */}
                {holoGeometries.map((style, i) => (
                    <div key={i} className="absolute text-primary/20 animate-holo-float" style={style}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                           <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4a2 2 0 0 0 1-1.73z"></path>
                        </svg>
                    </div>
                ))}
            </>
        )}

        {/* Speaking Visualization */}
        {status === 'speaking' &&
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-full h-full rounded-full bg-primary/20 animate-ripple-out"
              style={{ animationDelay: `${i * 0.5}s` }}
            />
          ))}

        {/* Central Core */}
        <div className="relative w-28 h-28 rounded-full bg-background/50 backdrop-blur-sm flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-primary/70" />
          <div className="absolute inset-1.5 rounded-full border border-dashed border-accent/50 animate-[spin_5s_linear_infinite_reverse]" />
          <div className="w-16 h-16 rounded-full bg-primary/20 border-2 border-primary animate-pulse-glow" style={{ boxShadow: '0 0 20px hsl(var(--primary)), inset 0 0 10px hsl(var(--primary))' }} />
        </div>
      </div>

      {/* Status Text */}
      <div 
        key={status} 
        className={cn("absolute bottom-16 text-center text-accent tracking-widest text-sm animate-fade-in-out", orbitron.className)}
        style={{ animationDuration: `${statusDurations[status]}s` }}
      >
        {statusText[status]}
      </div>
    </div>
  );
};

export default VoiceHUD;
