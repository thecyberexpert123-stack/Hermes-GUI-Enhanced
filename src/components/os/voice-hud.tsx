'use client';

import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { orbitron } from '@/lib/fonts';
import {
  Mic,
  MicOff,
  Send,
  X,
  Volume2,
  ArrowRight,
  AlertCircle,
  Radio,
  Zap,
  Sparkles,
  ShieldAlert,
  Activity,
} from 'lucide-react';
import { soundFx } from '@/lib/audio-synth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useRealVoice } from '@/hooks/use-real-voice';

interface VoiceHUDProps {
  closeDialog: () => void;
  onOpenChatWithSession?: (sessionId?: string) => void;
}

const VoiceHUD = ({ closeDialog, onOpenChatWithSession }: VoiceHUDProps) => {
  const [typedInput, setTypedInput] = useState('');
  const [particles, setParticles] = useState<React.CSSProperties[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>(undefined);

  const [micPeaks, setMicPeaks] = useState<number[]>(() => new Array(24).fill(6));
  const micPeaksRef = useRef<number[]>(new Array(24).fill(6));

  const {
    mode,
    setMode,
    toggleMode,
    status,
    transcript,
    response,
    error,
    audioLevel,
    frequencyBars,
    inputDb,
    isVoiceActive,
    isSupported,
    isWakeWordDetected,
    wakeWord,
    startListening,
    stopListening,
    startMonitoring,
    sendVoiceQuery,
    speakText,
    cancel,
  } = useRealVoice({
    sessionId: currentSessionId,
    onQueryComplete: (query, res, sid) => {
      if (sid) setCurrentSessionId(sid);
    },
  });

  useEffect(() => {
    const updated = frequencyBars.map((val, idx) => {
      const prev = micPeaksRef.current[idx] || 0;
      if (val > prev) return val;
      return Math.max(val, Math.round(prev * 0.92));
    });
    micPeaksRef.current = updated;
    setMicPeaks(updated);
  }, [frequencyBars]);

  useEffect(() => {
    // Generate holographic background particles
    const newParticles = Array.from({ length: 60 }).map(() => {
      const angle = Math.random() * 2 * Math.PI;
      const radius = 30 + Math.random() * 110;
      return {
        '--size': `${Math.random() * 2 + 1}px`,
        '--x-start': `${Math.cos(angle) * radius}px`,
        '--y-start': `${Math.sin(angle) * radius}px`,
        '--x-end': `${Math.cos(angle + (Math.random() - 0.5) * Math.PI) * radius}px`,
        '--y-end': `${Math.sin(angle + (Math.random() - 0.5) * Math.PI) * radius}px`,
        '--delay': `${Math.random() * 10}s`,
        '--duration': `${Math.random() * 8 + 8}s`,
      } as React.CSSProperties;
    });
    setParticles(newParticles);
  }, []);

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedInput.trim()) return;
    sendVoiceQuery(typedInput);
    setTypedInput('');
  };

  const handleClose = () => {
    soundFx.playClick();
    cancel();
    closeDialog();
  };

  const handleOpenChat = () => {
    soundFx.playClick();
    cancel();
    closeDialog();
    if (onOpenChatWithSession) {
      onOpenChatWithSession(currentSessionId);
    }
  };

  const handleCenterCoreClick = () => {
    if (status === 'speaking') {
      cancel();
      if (mode === 'auto') {
        setTimeout(startMonitoring, 200);
      }
      return;
    }

    if (mode === 'auto') {
      if (status === 'listening') {
        stopListening();
      } else {
        startListening();
      }
    } else {
      if (status === 'listening') {
        stopListening();
      } else {
        startListening();
      }
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-between p-4 sm:p-5 bg-background/95 backdrop-blur-2xl border border-primary/40 rounded-3xl shadow-[0_0_60px_hsl(var(--primary)/0.35)] w-[94vw] max-w-lg max-h-[88vh] overflow-y-auto scrollbar-thin">
      {/* Cybernetic Scanlines */}
      <div className="pointer-events-none absolute inset-0 rounded-3xl bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] opacity-25 overflow-hidden" />

      {/* Top Header */}
      <div className="w-full flex items-center justify-between pb-1.5 border-b border-primary/20 z-10 shrink-0">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'h-2 w-2 rounded-full',
              mode === 'auto' ? 'bg-accent animate-ping' : 'bg-emerald-400'
            )}
          />
          <span className={cn('text-xs font-bold tracking-widest text-primary', orbitron.className)}>
            HERMES VOICE INTERACTION // WSL
          </span>
        </div>
        <button
          onClick={handleClose}
          className="rounded-full border border-primary/30 p-1.5 text-primary hover:bg-primary/20 hover:text-accent transition-colors"
          title="Close Voice HUD"
        >
          <X size={16} />
        </button>
      </div>

      {/* Dual Mode Switcher Bar */}
      <div className="w-full flex items-center justify-center gap-2 p-1.5 rounded-2xl bg-background/80 border border-primary/30 my-2 z-10 shadow-inner shrink-0">
        <button
          type="button"
          onClick={() => setMode('manual')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-xl text-[11px] font-mono tracking-wider transition-all duration-200 select-none cursor-pointer',
            mode === 'manual'
              ? 'bg-primary/20 text-primary border border-primary/60 shadow-[0_0_15px_hsl(var(--primary)/0.3)] font-bold'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
          )}
        >
          <Mic size={13} className={mode === 'manual' ? 'text-accent' : 'opacity-60'} />
          <span>MANUAL MODE</span>
        </button>

        <button
          type="button"
          onClick={() => setMode('auto')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-xl text-[11px] font-mono tracking-wider transition-all duration-200 select-none cursor-pointer',
            mode === 'auto'
              ? 'bg-accent/20 text-accent border border-accent/60 shadow-[0_0_15px_hsl(var(--accent)/0.3)] font-bold'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
          )}
        >
          <Radio size={13} className={mode === 'auto' ? 'text-accent animate-pulse' : 'opacity-60'} />
          <span>AUTO // "HERMES"</span>
        </button>
      </div>

      {/* Ambient Wake-Word Banner / Mode Status Tag */}
      <div className="w-full flex items-center justify-between px-3 py-1 bg-primary/5 border border-primary/20 rounded-lg text-[10px] font-mono text-muted-foreground mb-1 z-10 shrink-0">
        <div className="flex items-center gap-1.5">
          {mode === 'auto' ? (
            <>
              <Sparkles size={11} className="text-accent animate-spin-slow" />
              <span className="text-accent font-semibold">WAKE-WORD ACTIVE:</span>
              <span className="text-foreground tracking-wider font-bold">"HERMES"</span>
            </>
          ) : (
            <>
              <Mic size={11} className="text-primary" />
              <span className="text-primary font-semibold">PUSH-TO-TALK:</span>
              <span>CLICK MIC TO SPEAK</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-1 text-[9px] uppercase tracking-wider">
          {mode === 'auto' && status === 'monitoring' && (
            <span className="text-emerald-400 flex items-center gap-1 font-bold">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
              AMBIENT ON
            </span>
          )}
          {status === 'listening' && (
            <span className="text-destructive font-bold animate-pulse flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-destructive animate-ping" />
              RECORDING
            </span>
          )}
          {status === 'thinking' && (
            <span className="text-accent font-bold animate-pulse flex items-center gap-1">
              <Zap size={10} className="animate-bounce" />
              INFERENCE
            </span>
          )}
          {status === 'speaking' && (
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <Volume2 size={10} />
              SPEAKING
            </span>
          )}
          {status === 'idle' && mode === 'manual' && (
            <span className="text-primary/70">STANDBY</span>
          )}
        </div>
      </div>

      {/* Center Holographic Core Visual */}
      <div className="relative h-36 w-36 sm:h-40 sm:w-40 my-1 sm:my-2 flex items-center justify-center shrink-0">
        {/* Real Audio Reactive Outer Ring */}
        <div
          className={cn(
            'absolute inset-0 rounded-full border transition-transform duration-100 ease-out',
            isWakeWordDetected
              ? 'border-accent shadow-[0_0_35px_hsl(var(--accent)/0.6)] scale-110'
              : status === 'thinking'
              ? 'animate-[spin_4s_linear_infinite] border-accent/60'
              : status === 'monitoring'
              ? 'animate-[spin_12s_linear_infinite] border-accent/30'
              : 'animate-[spin_20s_linear_infinite] border-primary/25'
          )}
          style={{
            transform: `scale(${1 + audioLevel * 0.35})`,
          }}
        />

        {/* Dashed Secondary Ring */}
        <div
          className={cn(
            'absolute inset-3 rounded-full border border-dashed transition-transform duration-100',
            status === 'speaking'
              ? 'animate-[spin_6s_linear_infinite_reverse] border-primary'
              : status === 'monitoring'
              ? 'animate-[spin_8s_linear_infinite_reverse] border-primary/40'
              : 'animate-[spin_15s_linear_infinite_reverse] border-accent/30'
          )}
          style={{
            transform: `scale(${1 + audioLevel * 0.2})`,
          }}
        />

        {/* Circular Waveform Equalizer Bars */}
        <div className="absolute inset-2 flex items-center justify-center pointer-events-none">
          <svg viewBox="-100 -100 200 200" className="h-full w-full">
            {frequencyBars.map((val, i) => {
              const angle = (i / frequencyBars.length) * 360;
              const barHeight = Math.max(3, (val / 100) * 22);
              const isHot = (status === 'listening' || isWakeWordDetected) && val > 25;
              return (
                <rect
                  key={i}
                  x="-1"
                  y="-88"
                  width="2"
                  height={barHeight}
                  rx="1"
                  fill={
                    isHot
                      ? 'hsl(var(--destructive))'
                      : status === 'speaking'
                      ? 'hsl(var(--accent))'
                      : status === 'monitoring'
                      ? 'hsl(var(--primary)/0.6)'
                      : 'hsl(var(--primary))'
                  }
                  opacity={
                    status === 'listening' || status === 'speaking' || isWakeWordDetected
                      ? 0.95
                      : 0.35
                  }
                  transform={`rotate(${angle})`}
                  className="transition-all duration-75"
                />
              );
            })}
          </svg>
        </div>

        {/* Speaking energy ripples */}
        {status === 'speaking' && (
          <>
            <div className="absolute inset-0 rounded-full border-2 border-accent animate-speaking-ripple" />
            <div className="absolute inset-0 rounded-full border-2 border-primary animate-speaking-ripple [animation-delay:0.35s]" />
          </>
        )}

        {/* Wake-word surge burst */}
        {isWakeWordDetected && (
          <div className="absolute inset-[-10px] rounded-full border-2 border-accent animate-ping" />
        )}

        {/* Center Mic Button */}
        <button
          onClick={handleCenterCoreClick}
          className={cn(
            'group relative z-10 h-16 w-16 sm:h-20 sm:w-20 rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-[0_0_25px_hsl(var(--primary)/0.3)] cursor-pointer',
            isWakeWordDetected
              ? 'bg-accent/40 border-2 border-accent scale-110 shadow-[0_0_35px_hsl(var(--accent))] animate-pulse'
              : status === 'listening'
              ? 'bg-destructive/30 border-2 border-destructive animate-pulse shadow-[0_0_30px_hsl(var(--destructive)/0.5)]'
              : status === 'thinking'
              ? 'bg-accent/20 border-2 border-accent animate-spin-slow'
              : status === 'monitoring'
              ? 'bg-accent/15 border-2 border-accent/70 hover:bg-accent/25 hover:scale-105'
              : 'bg-primary/20 border-2 border-primary hover:bg-primary/30 hover:border-accent hover:scale-105'
          )}
          title={
            mode === 'auto'
              ? status === 'monitoring'
                ? 'Ambient listening active for "Hermes" (or click to force wake)'
                : 'Click to stop listening'
              : status === 'listening'
              ? 'Click to stop listening'
              : 'Click to start speaking'
          }
        >
          {isWakeWordDetected ? (
            <Zap size={22} className="text-accent drop-shadow-[0_0_12px_hsl(var(--accent))] animate-bounce sm:h-6 sm:w-6" />
          ) : status === 'listening' ? (
            <MicOff size={22} className="text-destructive drop-shadow-[0_0_8px_hsl(var(--destructive))] sm:h-6 sm:w-6" />
          ) : status === 'monitoring' ? (
            <Radio size={22} className="text-accent drop-shadow-[0_0_8px_hsl(var(--accent))] animate-pulse sm:h-6 sm:w-6" />
          ) : (
            <Mic size={22} className="text-accent drop-shadow-[0_0_8px_hsl(var(--accent))] sm:h-6 sm:w-6" />
          )}
          <span className="text-[8px] sm:text-[9px] font-bold tracking-widest text-primary mt-0.5 font-mono">
            {isWakeWordDetected
              ? 'AWOKEN'
              : status === 'listening'
              ? 'STOP'
              : status === 'thinking'
              ? 'THINK'
              : status === 'monitoring'
              ? 'MONITOR'
              : 'SPEAK'}
          </span>
        </button>
      </div>

      {/* Dynamic Status Readout Label */}
      <div className={cn('text-center my-1 font-mono text-[11px] sm:text-xs tracking-widest shrink-0', orbitron.className)}>
        {isWakeWordDetected ? (
          <span className="text-accent font-bold animate-pulse">⚡ "HERMES" AWOKEN! RECORDING COMMAND...</span>
        ) : status === 'listening' ? (
          <span className="text-destructive animate-pulse">● RECORDING... (SPEAK YOUR COMMAND)</span>
        ) : status === 'thinking' ? (
          <span className="text-accent animate-pulse">⚡ INFERENCE RUNNING IN WSL AGENT...</span>
        ) : status === 'speaking' ? (
          <span className="text-emerald-400">🔊 HERMES RESPONDING...</span>
        ) : status === 'monitoring' ? (
          <span className="text-accent flex items-center justify-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span>LISTENING FOR "HERMES"... (SAY WAKE-WORD)</span>
          </span>
        ) : (
          <span className="text-primary/80">READY // CLICK MIC OR TYPE BELOW</span>
        )}
      </div>

      {/* Dedicated Microphone Input Audio Visualizer (Reveals when listening / speaking) */}
      {status === 'listening' || status === 'monitoring' || isVoiceActive ? (
        <div className="w-full my-1 sm:my-1.5 rounded-2xl border border-destructive/40 bg-background/80 p-2 backdrop-blur-md shadow-[0_0_25px_hsl(var(--destructive)/0.15)] transition-all duration-300 animate-in fade-in zoom-in-95 shrink-0">
          {/* Visualizer Top Bar */}
          <div className="flex items-center justify-between border-b border-primary/20 pb-1 mb-1.5">
            <div className="flex items-center gap-1.5">
              <Mic
                size={11}
                className={cn(
                  'transition-colors',
                  isVoiceActive ? 'text-destructive animate-pulse' : 'text-primary'
                )}
              />
              <span className="text-[9px] font-mono font-bold tracking-wider text-primary">
                MICROPHONE INPUT // 24-BAND ACOUSTIC FFT
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Voice Activity Status Pill */}
              <div
                className={cn(
                  'flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-mono border transition-all',
                  isVoiceActive
                    ? 'border-destructive/70 bg-destructive/20 text-destructive font-black shadow-[0_0_8px_hsl(var(--destructive)/0.5)] animate-pulse'
                    : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-semibold'
                )}
              >
                <span
                  className={cn(
                    'h-1.5 w-1.5 rounded-full',
                    isVoiceActive ? 'bg-destructive animate-ping' : 'bg-emerald-400'
                  )}
                />
                <span>{isVoiceActive ? 'VOICE DETECTED' : 'MIC ACTIVE'}</span>
              </div>

              {/* Live Input dBFS Meter */}
              <span
                className={cn(
                  'text-[9px] font-mono font-bold transition-colors',
                  isVoiceActive ? 'text-destructive font-black' : 'text-primary/70'
                )}
              >
                {inputDb} dB
              </span>
            </div>
          </div>

          {/* 24-Band Live Acoustic Equalizer Bars with Peak-Hold LEDs */}
          <div className="relative flex items-end justify-between gap-[2px] h-7 sm:h-8 w-full px-0.5">
            {frequencyBars.map((val, idx) => {
              const peak = micPeaks[idx] || val;
              const isHot = val > 55 || (isVoiceActive && val > 30);
              const isPeakHot = peak > 65;

              return (
                <div key={idx} className="relative flex-1 flex flex-col justify-end items-center h-full">
                  {/* Floating Peak-Hold LED */}
                  <div
                    className={cn(
                      'absolute w-full h-[2px] rounded-full transition-all duration-75',
                      isPeakHot
                        ? 'bg-destructive shadow-[0_0_5px_hsl(var(--destructive))]'
                        : peak > 35
                        ? 'bg-accent shadow-[0_0_4px_hsl(var(--accent))]'
                        : 'bg-primary/80 shadow-[0_0_2px_hsl(var(--primary))]'
                    )}
                    style={{ bottom: `${Math.min(96, Math.max(0, peak))}%` }}
                  />

                  {/* Equalizer Bar */}
                  <div
                    className={cn(
                      'w-full rounded-t-[1px] transition-all duration-75 ease-out',
                      isHot
                        ? 'bg-gradient-to-t from-primary via-emerald-400 to-destructive shadow-[0_0_6px_hsl(var(--destructive)/0.5)]'
                        : isVoiceActive
                        ? 'bg-gradient-to-t from-primary via-accent to-emerald-400 shadow-[0_0_4px_hsl(var(--accent)/0.3)]'
                        : 'bg-primary/40'
                    )}
                    style={{ height: `${Math.min(100, Math.max(6, val))}%` }}
                  />
                </div>
              );
            })}
          </div>

          {/* Acoustic Frequency Bin Markers */}
          <div className="flex justify-between items-center text-[7px] text-muted-foreground/60 px-0.5 pt-0.5 font-mono">
            <span>80Hz</span>
            <span>250Hz</span>
            <span>800Hz</span>
            <span>2.5kHz</span>
            <span>5kHz</span>
            <span>10kHz</span>
          </div>

          {/* 16-Segment Horizontal LED Level VU Meter */}
          <div className="flex items-center gap-1 mt-1 pt-1 border-t border-primary/10">
            <span className="text-[7px] font-mono text-muted-foreground uppercase">RMS LEVEL:</span>
            <div className="flex-1 flex items-center gap-[1.5px] h-1.5 sm:h-2">
              {Array.from({ length: 16 }).map((_, i) => {
                const activeThreshold = (i + 1) / 16;
                const isLit = audioLevel >= activeThreshold * 0.45;
                const isRed = i >= 13;
                const isYellow = i >= 9 && i < 13;

                return (
                  <div
                    key={i}
                    className={cn(
                      'flex-1 h-full rounded-[1px] transition-all duration-75',
                      isLit
                        ? isRed
                          ? 'bg-destructive shadow-[0_0_4px_hsl(var(--destructive))]'
                          : isYellow
                          ? 'bg-amber-400 shadow-[0_0_3px_hsl(var(--amber-400))]'
                          : 'bg-emerald-400 shadow-[0_0_3px_hsl(var(--emerald-400))]'
                        : 'bg-primary/15'
                    )}
                  />
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Standby Input Banner when idle */
        <div className="w-full flex items-center justify-between px-3 py-1 rounded-xl border border-primary/20 bg-background/50 text-[10px] font-mono text-muted-foreground my-1 shrink-0">
          <div className="flex items-center gap-1.5">
            <Mic size={12} className="text-primary/70" />
            <span>MICROPHONE INPUT: STANDBY // CLICK MIC TO ACTIVATE</span>
          </div>
          <span className="text-[8px] text-primary/50 tracking-wider">48kHz / PCM</span>
        </div>
      )}

      {/* Transcript or AI Response Box */}
      <div className="w-full min-h-[50px] max-h-28 sm:max-h-32 overflow-y-auto rounded-lg border border-primary/25 bg-background/60 p-2.5 text-xs font-sans text-center text-foreground/90 my-1 shadow-inner shrink-0">
        {response ? (
          <div className="text-left font-sans space-y-1">
            <div className="flex items-center justify-between text-accent font-bold font-mono text-[10px]">
              <span>HERMES AGENT:</span>
              <button
                onClick={() => speakText(response)}
                className="hover:underline flex items-center gap-1 text-[9px] text-primary cursor-pointer"
                title="Replay Voice"
              >
                <Volume2 size={11} />
                <span>REPLAY</span>
              </button>
            </div>
            <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap">{response}</p>
          </div>
        ) : transcript ? (
          <div className="text-left">
            <span className="text-primary/70 font-mono text-[10px] block mb-0.5">YOU SAID:</span>
            <p className="text-accent font-semibold italic">"{transcript}"</p>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center gap-2 text-destructive font-mono text-[11px]">
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        ) : (
          <span className="text-muted-foreground text-[10px] sm:text-[11px] font-mono leading-relaxed">
            {isSupported
              ? mode === 'auto'
                ? 'Ambient wake-word mode is active. Simply say "Hermes" followed by your command.'
                : 'Click the central microphone to speak, or type your query in the fallback box below.'
              : 'Web Speech API not detected in browser. Use text input below.'}
          </span>
        )}
      </div>

      {/* Action Footer: Continue in Chat or Replay */}
      {response && onOpenChatWithSession && (
        <div className="w-full flex items-center justify-end gap-2 my-1 shrink-0">
          <Button
            size="sm"
            variant="outline"
            onClick={handleOpenChat}
            className="text-[11px] h-7 border-primary/30 text-accent hover:bg-primary/20 flex items-center gap-1 font-mono cursor-pointer"
          >
            <span>CONTINUE IN CHAT</span>
            <ArrowRight size={12} />
          </Button>
        </div>
      )}

      {/* Text Prompt Input Fallback */}
      <form onSubmit={handleTextSubmit} className="relative w-full mt-1.5 shrink-0">
        <Input
          value={typedInput}
          onChange={(e) => setTypedInput(e.target.value)}
          placeholder={status === 'thinking' ? 'Processing...' : 'Type voice command fallback...'}
          disabled={status === 'thinking'}
          className="h-10 w-full rounded-full border border-primary/30 bg-background/80 pr-12 pl-4 text-xs font-sans focus-visible:ring-1 focus-visible:ring-accent"
        />
        <Button
          type="submit"
          size="icon"
          disabled={status === 'thinking' || !typedInput.trim()}
          className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full border border-primary/40 bg-transparent text-primary hover:bg-primary hover:text-primary-foreground disabled:opacity-40"
        >
          <Send size={13} />
        </Button>
      </form>

      {/* Quick Voice Protocols & Command Actions Strip */}
      <div className="w-full mt-2.5 pt-2 border-t border-primary/20 shrink-0">
        <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground mb-1.5 px-0.5">
          <span className="flex items-center gap-1 text-primary/80">
            <Sparkles size={11} className="text-accent" />
            <span>QUICK PROTOCOL COMMANDS:</span>
          </span>
          <span className="text-[9px] text-accent/70">CLICK TO EXECUTE</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          <button
            type="button"
            onClick={() => sendVoiceQuery('Jarvis, report system readiness and hardware telemetry')}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg border border-primary/20 bg-primary/5 hover:bg-primary/20 hover:border-accent text-[10px] font-mono text-primary hover:text-accent transition-all text-left truncate cursor-pointer"
          >
            <Activity size={12} className="text-emerald-400 shrink-0" />
            <span className="truncate">System Readiness</span>
          </button>
          <button
            type="button"
            onClick={() => sendVoiceQuery('Execute perimeter port security audit in WSL')}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg border border-primary/20 bg-primary/5 hover:bg-primary/20 hover:border-accent text-[10px] font-mono text-primary hover:text-accent transition-all text-left truncate cursor-pointer"
          >
            <ShieldAlert size={12} className="text-accent shrink-0" />
            <span className="truncate">Security Audit</span>
          </button>
          <button
            type="button"
            onClick={() => sendVoiceQuery('Boost arc reactor and purge dirty memory')}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg border border-primary/20 bg-primary/5 hover:bg-primary/20 hover:border-accent text-[10px] font-mono text-primary hover:text-accent transition-all text-left truncate cursor-pointer"
          >
            <Zap size={12} className="text-destructive shrink-0" />
            <span className="truncate">Reactor Overclock</span>
          </button>
          <button
            type="button"
            onClick={() => {
              handleClose();
              if (onOpenChatWithSession) onOpenChatWithSession(currentSessionId);
            }}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg border border-primary/20 bg-primary/5 hover:bg-primary/20 hover:border-accent text-[10px] font-mono text-primary hover:text-accent transition-all text-left truncate cursor-pointer"
          >
            <ArrowRight size={12} className="text-primary shrink-0" />
            <span className="truncate">Open Full Chat</span>
          </button>
          <button
            type="button"
            onClick={() => speakText('Voice synthesizer audio feedback calibrated and operational.')}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg border border-primary/20 bg-primary/5 hover:bg-primary/20 hover:border-accent text-[10px] font-mono text-primary hover:text-accent transition-all text-left truncate cursor-pointer"
          >
            <Volume2 size={12} className="text-accent shrink-0" />
            <span className="truncate">Calibrate Voice</span>
          </button>
          <button
            type="button"
            onClick={() => {
              cancel();
              soundFx.playClick(800);
            }}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg border border-primary/20 bg-primary/5 hover:bg-destructive/20 hover:border-destructive text-[10px] font-mono text-muted-foreground hover:text-destructive transition-all text-left truncate cursor-pointer"
          >
            <X size={12} className="shrink-0" />
            <span className="truncate">Clear / Reset</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default VoiceHUD;
