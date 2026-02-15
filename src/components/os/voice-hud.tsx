'use client';

import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Orbitron } from 'next/font/google';

const orbitron = Orbitron({ subsets: ['latin'] });

type AiStatus = 'listening' | 'thinking' | 'speaking';

interface VoiceHUDProps {
  closeDialog: () => void;
}

const VoiceHUD = ({ closeDialog }: VoiceHUDProps) => {
  const [status, setStatus] = useState<AiStatus>('listening');
  const [show, setShow] = useState(true);
  const [particles, setParticles] = useState<React.CSSProperties[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const coreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Generate particles only once on mount
    const newParticles = Array.from({ length: 80 }).map(() => {
      const angle = Math.random() * 2 * Math.PI;
      const radius = 50 + Math.random() * 200; // spawn in a radius
      return {
      '--size': `${Math.random() * 2 + 1}px`,
      '--x-start': `${Math.cos(angle) * radius}px`,
      '--y-start': `${Math.sin(angle) * radius}px`,
      // for drift animation
      '--x-end': `${Math.cos(angle + Math.PI) * radius}px`,
      '--y-end': `${Math.sin(angle + Math.PI) * radius}px`,
      '--delay': `${Math.random() * 10}s`,
      '--duration': `${Math.random() * 10 + 10}s`,
      } as React.CSSProperties
    });
    setParticles(newParticles);
  }, []);
  
  useEffect(() => {
    let isMounted = true;
    const sequence = async () => {
      if (!isMounted) return;
      setStatus('listening');
      await new Promise(resolve => setTimeout(resolve, 4000));
      if (!isMounted) return;
      
      setStatus('thinking');
      await new Promise(resolve => setTimeout(resolve, 5000));
      if (!isMounted) return;

      setStatus('speaking');
      await new Promise(resolve => setTimeout(resolve, 6000));
      if (!isMounted) return;

      setShow(false);
      await new Promise(resolve => setTimeout(resolve, 500)); // wait for fade out
      if (isMounted) closeDialog();
    };
    sequence();
    return () => { isMounted = false; };
  }, [closeDialog]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!coreRef.current) return;
      const { left, top, width, height } = el.getBoundingClientRect();
      const x = (e.clientX - left) / width - 0.5;
      const y = (e.clientY - top) / height - 0.5;
      coreRef.current.style.transform = `rotateY(${x * 15}deg) rotateX(${-y * 15}deg)`;
    };

    const handleMouseLeave = () => {
      if (coreRef.current) {
        coreRef.current.style.transform = 'rotateY(0deg) rotateX(0deg)';
      }
    };

    // Attach to dialog overlay for larger parallax area
    const overlay = document.querySelector('[data-radix-dialog-overlay]');
    const target = overlay || el;

    target.addEventListener('mousemove', handleMouseMove as EventListener);
    target.addEventListener('mouseleave', handleMouseLeave as EventListener);

    return () => {
      target.removeEventListener('mousemove', handleMouseMove as EventListener);
      target.removeEventListener('mouseleave', handleMouseLeave as EventListener);
    };
  }, []);


  const statusText: Record<AiStatus, string> = {
    listening: 'Listening...',
    thinking: 'Processing...',
    speaking: 'Responding...',
  };

  const statusDurations: Record<AiStatus, number> = {
    listening: 4,
    thinking: 5,
    speaking: 6,
  };

  const Hexagon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={cn("h-full w-full", className)} {...props}>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4a2 2 0 0 0 1-1.73z" />
    </svg>
  );

  return (
    <div className={cn("relative flex flex-col items-center justify-center transition-opacity duration-500", show ? 'opacity-100' : 'opacity-0')}>
      <div ref={containerRef} className="h-[450px] w-[450px]" style={{ perspective: '1000px' }}>
        <div ref={coreRef} className="relative h-full w-full transition-transform duration-300 ease-out" style={{ transformStyle: 'preserve-3d' }}>
          
          {/* Layer 0: Background Glow */}
          <div className="absolute inset-0 rounded-full bg-primary/10 blur-3xl animate-pulse" style={{ transform: 'translateZ(-100px)' }} />

          {/* Layer 2: Drifting Particles */}
          <div className="absolute inset-0" style={{ transform: 'translateZ(-50px)' }}>
            {particles.slice(0, 20).map((style, i) => (
              <div key={i} className="absolute left-1/2 top-1/2 h-[var(--size)] w-[var(--size)] rounded-full bg-accent/50 animate-particle-drift" style={style} />
            ))}
          </div>

          {/* Layer 3: Main Rings */}
          <div className="absolute inset-0 h-full w-full" style={{ transformStyle: 'preserve-3d' }}>
            <div className="absolute inset-[5%] rounded-full border-2 border-dashed border-primary/20 animate-[spin_40s_linear_infinite]" style={{ transform: 'translateZ(-20px)' }} />
            <div className="absolute inset-[10%] rounded-full border border-accent/30 animate-[spin_30s_linear_infinite_reverse]" style={{ transform: 'translateZ(-10px)' }} />
            <div className="absolute inset-[20%] rounded-full border border-dashed border-accent/60 animate-flicker" style={{ transform: 'translateZ(10px)' }} />
            <div className="absolute inset-[25%] rounded-full border-2 border-primary/50 animate-[spin_10s_linear_infinite]" style={{ transform: 'translateZ(20px)' }} />
          </div>

          {/* Layer 4: State-specific Visuals */}
          <div className="absolute inset-0 h-full w-full" style={{ transformStyle: 'preserve-3d' }}>
            {/* LISTENING */}
            <div className={cn("absolute inset-0 transition-opacity duration-500", status === 'listening' ? 'opacity-100' : 'opacity-0')}>
              <svg viewBox="-100 -100 200 200" className="h-full w-full origin-center animate-pulse-slow">
                {Array.from({ length: 80 }).map((_, i) => (
                  <rect key={i} x="-1" y="-90" width="2" rx="1" fill="hsl(var(--accent))" transform={`rotate(${i * 4.5})`}
                    className="origin-center animate-waveform-bar" style={{ animationDelay: `${i * 0.02}s` }} />
                ))}
              </svg>
              {/* Inward particles */}
              <div className="absolute inset-0">
                {particles.slice(40, 60).map((style, i) => (
                    <div key={i}
                        className="absolute left-1/2 top-1/2 h-[var(--size)] w-[var(--size)] rounded-full bg-accent animate-particle-suck-in"
                        style={{ ...style, animationDuration: `${Math.random() * 2 + 1}s`, animationDelay: `${Math.random()}s` }} />
                ))}
              </div>
            </div>
            
            {/* THINKING */}
            <div className={cn("absolute inset-0 transition-opacity duration-500", status === 'thinking' ? 'opacity-100' : 'opacity-0')}>
               {/* Dual scanner lines */}
               <div className="absolute inset-[28%] animate-[spin_4s_linear_infinite]">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 h-1/2 w-px bg-gradient-to-b from-accent to-transparent" />
               </div>
               <div className="absolute inset-[28%] animate-[spin_6s_linear_infinite_reverse]">
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-1/2 w-px bg-gradient-to-t from-accent to-transparent" />
               </div>
               
               {/* Floating Glyphs */}
               {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="absolute text-primary/20 animate-glyph-float" style={{
                  left: `${10 + i * 18}%`,
                  height: `${15 + (i%3)*5}px`,
                  animationDelay: `${i * 0.8}s`,
                  animationDuration: `${4 + Math.random() * 2}s`,
                }}>
                  <Hexagon />
                </div>
               ))}

               {/* Hologram Grid */}
              <div className="h-full w-full animate-flicker-soft [background-image:radial-gradient(hsl(var(--primary)/0.1)_1px,transparent_1px)] [background-size:0.75rem_0.75rem]" style={{ transform: 'translateZ(-80px)' }} />

            </div>

            {/* SPEAKING */}
            <div className={cn("absolute inset-0 transition-opacity duration-500", status === 'speaking' ? 'opacity-100' : 'opacity-0')}>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="absolute inset-0 rounded-full border-2 border-primary/70 animate-ripple-out-speak" style={{ animationDelay: `${i * 0.4}s` }}/>
              ))}
            </div>
          </div>
          
          {/* Layer 5: Core Disc */}
          <div className="absolute inset-[30%] rounded-full" style={{ transform: 'translateZ(30px)', transformStyle: 'preserve-3d' }}>
            <div className="absolute inset-0 rounded-full bg-primary/30 animate-breathing-glow" />
            <div className="absolute inset-0 rounded-full border-2 border-primary" />
            <div className={cn("absolute inset-0 flex items-center justify-center text-4xl font-bold tracking-[0.2em] text-primary/90 [text-shadow:0_0_10px_hsl(var(--primary))]", orbitron.className)}>
              JARVIS
            </div>
          </div>

          {/* Layer 6: Orbiting Particles */}
          <div className="absolute inset-0" style={{ transform: 'translateZ(60px)', transformStyle: 'preserve-3d' }}>
            {particles.slice(20, 30).map((style, i) => (
              <div key={i} className="absolute inset-0 animate-orbit" style={{ ...style, '--radius': `${140 + i * 5}px` }}>
                <div className="absolute left-1/2 top-1/2 h-1 w-1 rounded-full bg-accent" style={{ transform: 'translateX(var(--radius))' }} />
              </div>
            ))}
          </div>

        </div>
      </div>
      <div 
        key={status} 
        className={cn("absolute bottom-8 text-center text-accent tracking-widest text-sm animate-fade-in-out", orbitron.className)}
        style={{ animationDuration: `${statusDurations[status]}s` }}
      >
        {statusText[status]}
      </div>
    </div>
  );
};

export default VoiceHUD;
