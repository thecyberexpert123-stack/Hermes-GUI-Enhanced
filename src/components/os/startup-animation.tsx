'use client';

import { cn } from '@/lib/utils';
import { Orbitron } from 'next/font/google';
import { useState, useEffect } from 'react';

const orbitron = Orbitron({ subsets: ['latin'] });

// Helper component for the background grid
const HexagonGrid = () => (
    <div className="absolute inset-[-100%] animate-boot-grid-appear opacity-0 [animation-delay:1s]"
        style={{
            backgroundImage: `
                linear-gradient(150deg, hsl(var(--primary)/0.05) 1px, transparent 1px),
                linear-gradient(30deg, hsl(var(--primary)/0.05) 1px, transparent 1px),
                linear-gradient(90deg, hsl(var(--primary)/0.05) 1px, transparent 1px)
            `,
            backgroundSize: '3rem 5.2rem',
            backgroundPosition: '0 0, 0 0, 0 0',
        }}
    />
);

// Helper for the final system status text
const SystemText = ({ lines }: { lines: string[] }) => {
    const [currentLine, setCurrentLine] = useState(0);

    useEffect(() => {
        if (currentLine >= lines.length) return;

        const timer = setTimeout(() => {
            setCurrentLine(currentLine + 1);
        }, 80);

        return () => clearTimeout(timer);
    }, [currentLine, lines.length]);

    return (
        <div className="relative h-24 w-64 text-xs font-code tracking-widest text-accent">
            {lines.slice(0, currentLine).map((line, i) => (
                <p key={i} className="animate-boot-text-flicker">{line}</p>
            ))}
        </div>
    );
};


// Main component
const StartupAnimation = () => {
  const [particles, setParticles] = useState<React.CSSProperties[]>([]);
  const [showSystemText, setShowSystemText] = useState(false);
  const particleCount = 60;
  const jarvisName = 'JARVIS';
  
  const systemCheckLines = [
    '> Bootstrapping NEON OS...',
    '> Kernel loaded.',
    '> Initializing J.A.R.V.I.S. Core...',
    '> AI matrices aligned.',
    '> Verifying quantum entanglement...',
    '> All systems nominal.',
  ];

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const newParticles = Array.from({ length: particleCount }).map((_, i) => ({
        '--angle': `${(i / particleCount) * 360}deg`,
        '--delay': `${1.8 + Math.random() * 0.5}s`,
      } as React.CSSProperties));
      setParticles(newParticles);
    }
    
    const systemTextTimer = setTimeout(() => {
        setShowSystemText(true);
    }, 4000);
    
    return () => clearTimeout(systemTextTimer);
  }, []);

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center gap-8 overflow-hidden bg-background text-primary">
        
      {/* Background Effects */}
      <HexagonGrid />
      <div className="absolute top-0 left-0 h-full w-1/2 animate-boot-scan-vertical opacity-0 [animation-delay:0.5s]">
        <div className="h-full w-full bg-gradient-to-r from-primary/5 via-primary/10 to-transparent" />
      </div>
       <div className="absolute top-0 right-0 h-full w-1/2 animate-boot-scan-vertical opacity-0 [animation-delay:0.7s]">
        <div className="h-full w-full bg-gradient-to-l from-primary/5 via-primary/10 to-transparent" />
      </div>

      {/* Main Animation Core */}
      <div className="relative h-80 w-80">
        
        {/* Converging Energy Lines */}
        <div className="absolute inset-0">
          {particles.map((style, i) => (
            <div key={i} className="absolute top-1/2 left-1/2 h-0.5 w-20 origin-left bg-gradient-to-l from-accent/0 to-accent animate-boot-line-converge opacity-0" style={style} />
          ))}
        </div>

        {/* Central Glowing Core */}
        <div className="absolute inset-[45%] rounded-full animate-boot-core-pulse opacity-0 [animation-delay:1.5s]" />

        <svg
          viewBox="0 0 200 200"
          className="absolute inset-0 h-full w-full"
          style={{ '--glow-color': 'hsl(var(--primary))' } as React.CSSProperties}
        >
          <defs>
            <filter id="ultimateGlow">
              <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <mask id="ringMask">
                <rect width="200" height="200" fill="white" />
                <circle cx="100" cy="100" r="45" fill="black" />
            </mask>
          </defs>
          
          {/* Animated Glyphs */}
          <g filter="url(#ultimateGlow)" className="fill-none stroke-current opacity-0 animate-boot-final-glow [animation-delay:2s]">
            {/* Outer Rings */}
            <circle cx="100" cy="100" r="95" strokeWidth="0.5" className="animate-boot-path-trace" style={{ animationDelay: '2.1s', strokeDasharray: 600, strokeDashoffset: 600 }} />
            <circle cx="100" cy="100" r="90" strokeWidth="1" className="animate-boot-path-trace" style={{ animationDelay: '2.2s', strokeDasharray: 565, strokeDashoffset: 565, strokeDasharray: '10 10' }} />
            
            {/* Main Hexagon Structure */}
            {[0, 60, 120, 180, 240, 300].map(angle => (
                 <path key={`hex-${angle}`}
                    transform={`rotate(${angle} 100 100)`}
                    d="M 100 10 L 100 30 M 100 10 L 108.66 15 M 100 10 L 91.34 15"
                    strokeWidth="1"
                    className="animate-boot-path-trace"
                    style={{ animationDelay: '2.4s', strokeDasharray: 40, strokeDashoffset: 40 }}
                 />
            ))}
            <path d="M100 30 L143.3 55 L143.3 105 L100 130 L56.7 105 L56.7 55 Z" strokeWidth="1.5" className="animate-boot-path-trace" style={{ animationDelay: '2.5s', strokeDasharray: 347, strokeDashoffset: 347 }}/>

            {/* Inner Details */}
            <g mask="url(#ringMask)">
                <path d="M100 50 V 150 M50 100 H 150" strokeWidth="0.5" strokeOpacity="0.5" className="animate-boot-path-trace" style={{ animationDelay: '2.8s', strokeDasharray: 200, strokeDashoffset: 200 }} />
                <path d="M 71.7 71.7 L 128.3 128.3 M 71.7 128.3 L 128.3 71.7" strokeWidth="0.5" strokeOpacity="0.5" className="animate-boot-path-trace" style={{ animationDelay: '2.9s', strokeDasharray: 160, strokeDashoffset: 160 }}/>
            </g>

             {/* Spinning Rings inside Hexagon */}
            <circle cx="100" cy="100" r="60" strokeWidth="1" className="animate-boot-path-trace animate-[spin_10s_linear_infinite]" style={{ animationDelay: '2.6s', strokeDasharray: 377, strokeDashoffset: 377 }} />
            <circle cx="100" cy="100" r="75" strokeWidth="0.5" className="animate-boot-path-trace animate-[spin_15s_linear_infinite_reverse]" style={{ animationDelay: '2.7s', strokeDasharray: 471, strokeDashoffset: 471 }} />

          </g>
        </svg>
      </div>

      {/* JARVIS Text Reveal */}
      <div className="relative flex h-12 items-center justify-center overflow-hidden">
        <div className="flex">
          {jarvisName.split('').map((letter, i) => (
            <span
              key={i}
              className={cn(
                'relative text-4xl font-bold tracking-[0.2em] opacity-0 animate-jarvis-letter-in',
                orbitron.className
              )}
              style={{ animationDelay: `${3.2 + i * 0.1}s` }}
            >
              {letter}
            </span>
          ))}
        </div>
        <div className="absolute top-0 left-0 h-full w-full animate-scanline bg-gradient-to-b from-transparent via-primary/20 to-transparent" style={{ animationDelay: '3.8s'}}/>
      </div>

      {/* System Status Text */}
      <div className="animate-fade-in" style={{animationDelay: '4s'}}>
        {showSystemText && <SystemText lines={systemCheckLines} />}
      </div>
    </div>
  );
};

export default StartupAnimation;
