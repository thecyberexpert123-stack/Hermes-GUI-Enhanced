'use client';

import { cn } from '@/lib/utils';
import { Orbitron } from 'next/font/google';
import { useEffect, useState } from 'react';

const orbitron = Orbitron({ subsets: ['latin'] });

// Component for the scrolling system check text
const SystemLog = ({ lines, startDelay }: { lines: string[]; startDelay: number }) => {
    const [visibleLines, setVisibleLines] = useState<string[]>([]);

    useEffect(() => {
        const timeout = setTimeout(() => {
            let i = 0;
            const interval = setInterval(() => {
                if (i < lines.length) {
                    setVisibleLines(prev => [...prev, lines[i]]);
                    i++;
                } else {
                    clearInterval(interval);
                }
            }, 75); // Time between each line appearing

            return () => clearInterval(interval);
        }, startDelay);

        return () => clearTimeout(timeout);
    }, [lines, startDelay]);

    return (
        <div className="relative h-24 w-72 font-code text-xs tracking-wider text-accent/80 overflow-hidden">
            <div className="absolute bottom-0 left-0 w-full animate-log-scroll">
                {visibleLines.map((line, i) => (
                    <p key={i} className="whitespace-nowrap animate-log-line-flicker">
                        {line}
                    </p>
                ))}
            </div>
        </div>
    );
};


const StartupAnimation = () => {
  const systemCheckLines = [
    'NEON OS v1.0 KERNEL-J.A.R.V.I.S.',
    '---------------------------------',
    '[0.001] BOOTSTRAP INIT',
    '[0.152] MEM CHECK: 128 ZB ... OK',
    '[0.381] CPU: ARK-2500 REACTOR... OK',
    '[0.455] GPU: STARK GFX-9000... OK',
    '[0.982] LOADING AI CORE...',
    '[1.533] ALIGNING HEURISTIC MATRICES',
    '[2.104] VERIFYING Q-ENTANGLEMENT... SYNCED',
    '[3.561] SENSORY INPUT... ONLINE',
    '[4.012] GLOBAL COMMS... ONLINE',
    '[5.218] UI RENDERER... INITIALIZED',
    '[6.988] ALL SYSTEMS NOMINAL.',
    '[7.500] WELCOME.',
  ];

  const totalBootTime = 10000; // 10 seconds

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center gap-8 overflow-hidden bg-background text-primary">
      
      {/* Background Grid & Scanlines */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-[-100%] animate-boot-grid-in opacity-0"
            style={{
                backgroundImage: `
                    linear-gradient(150deg, hsl(var(--primary)/0.03) 1px, transparent 1px),
                    linear-gradient(30deg, hsl(var(--primary)/0.03) 1px, transparent 1px),
                    linear-gradient(90deg, hsl(var(--primary)/0.03) 1px, transparent 1px)
                `,
                backgroundSize: '3rem 5.2rem',
            }}
        />
        <div className="absolute top-0 left-0 h-full w-full animate-boot-scanner bg-gradient-to-b from-primary/10 to-transparent opacity-0" />
      </div>

      {/* Main Animation Core */}
      <div className="relative h-96 w-96 z-10">
        
        <svg
          viewBox="0 0 400 400"
          className="absolute inset-0 h-full w-full"
          style={{ '--glow-color': 'hsl(var(--primary))' } as React.CSSProperties}
        >
          <defs>
            <filter id="ultraGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <radialGradient id="coreGradient">
                <stop offset="0%" stopColor="hsl(var(--accent))" />
                <stop offset="100%" stopColor="hsl(var(--primary))" />
            </radialGradient>
          </defs>
          
          <g filter="url(#ultraGlow)" className="fill-none stroke-current">
            {/* Phase 1: Outer Structure & Energy Feed */}
            <g className="animate-boot-phase-1-in opacity-0">
                {/* Energy feed lines */}
                {[0, 90, 180, 270].map(angle => (
                    <path key={`feed-${angle}`}
                        transform={`rotate(${angle} 200 200)`}
                        d="M 200 0 L 200 120"
                        strokeWidth="0.5"
                        className="animate-boot-path-draw"
                        stroke="hsl(var(--accent)/0.5)"
                        style={{ strokeDasharray: 120, strokeDashoffset: 120, animationDelay: '0.5s' }}
                    />
                ))}
                {/* Outer targeting circles */}
                <circle cx="200" cy="200" r="190" strokeWidth="0.2" className="animate-boot-path-draw" style={{ strokeDasharray: 1200, strokeDashoffset: 1200 }} />
                <circle cx="200" cy="200" r="180" strokeWidth="0.5" strokeDasharray="5 15" className="animate-boot-path-draw animate-[spin_40s_linear_infinite]" style={{ strokeDasharray: 1131, strokeDashoffset: 1131, animationDelay: '0.2s' }} />
            </g>

            {/* Phase 2: Main Hexagon Assembly */}
            <g className="animate-boot-phase-2-in opacity-0">
                <path d="M200 50 L329.9 125 L329.9 275 L200 350 L70.1 275 L70.1 125 Z" strokeWidth="2" 
                      className="animate-boot-path-draw"
                      style={{ strokeDasharray: 780, strokeDashoffset: 780, animationDelay: '1.5s', animationDuration: '2s' }}/>
                {/* Hexagon inner connections */}
                {[0, 1, 2, 3, 4, 5].map(i => (
                    <path key={`hex-connect-${i}`}
                        transform={`rotate(${i * 60} 200 200)`}
                        d="M 200 200 L 200 50"
                        strokeWidth="0.5"
                        className="animate-boot-path-draw"
                        style={{ strokeDasharray: 150, strokeDashoffset: 150, animationDelay: '2.5s' }}
                    />
                ))}
            </g>

            {/* Phase 3: Spinning Inner Rings */}
            <g className="animate-boot-phase-3-in opacity-0">
                <circle cx="200" cy="200" r="100" strokeWidth="1.5" className="animate-boot-path-draw animate-[spin_10s_linear_infinite]" style={{ strokeDasharray: 628, strokeDashoffset: 628, animationDelay: '3.5s' }}/>
                <circle cx="200" cy="200" r="80" strokeWidth="1" strokeDasharray="10 10" className="animate-boot-path-draw animate-[spin_8s_linear_infinite_reverse]" style={{ strokeDasharray: 502, strokeDashoffset: 502, animationDelay: '4s' }}/>
            </g>

            {/* Phase 4: Central Core Ignition */}
            <g className="animate-boot-phase-4-in opacity-0">
                <circle cx="200" cy="200" r="40" fill="url(#coreGradient)" className="animate-boot-core-ignite" style={{ transformOrigin: 'center' }} />
                <circle cx="200" cy="200" r="50" strokeWidth="1" className="animate-boot-path-draw animate-boot-core-pulse" style={{ strokeDasharray: 314, strokeDashoffset: 314, animationDelay: '5s' }}/>
                <circle cx="200" cy="200" r="55" strokeWidth="0.5" className="animate-boot-path-draw animate-boot-core-pulse" style={{ strokeDasharray: 345, strokeDashoffset: 345, animationDelay: '5.2s', animationDirection: 'reverse' }}/>
            </g>
          </g>
        </svg>
      </div>

      {/* JARVIS Text Reveal */}
      <div className={cn("relative z-20 flex h-12 items-center justify-center overflow-hidden animate-boot-text-reveal opacity-0", orbitron.className)}>
        <h1 className="text-4xl font-bold tracking-[0.3em] text-transparent animate-boot-text-fill bg-clip-text bg-gradient-to-r from-accent to-primary"
            style={{ textShadow: '0 0 15px hsl(var(--primary)/0.7)' }}>
          JARVIS
        </h1>
        <div className="absolute top-0 left-[-10%] h-full w-[120%] animate-boot-text-scanline bg-gradient-to-r from-transparent via-accent/70 to-transparent" />
      </div>

      {/* System Status Text */}
      <div className="z-10 animate-boot-log-appear opacity-0">
        <SystemLog lines={systemCheckLines} startDelay={7000} />
      </div>

      {/* Final Fadeout Overlay */}
      <div className="absolute inset-0 z-30 bg-background animate-boot-fade-out opacity-0" style={{ animationDelay: `${(totalBootTime - 500) / 1000}s` }} />
    </div>
  );
};

export default StartupAnimation;
