'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { orbitron } from '@/lib/fonts';
import {
  Waves,
  X,
  Mic,
  Radio,
  ExternalLink,
  RefreshCw,
  Zap,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
  ArrowRight,
  Copy,
  Keyboard,
  User,
  Activity,
  Send,
} from 'lucide-react';
import { soundFx } from '@/lib/audio-synth';
import { Button } from '@/components/ui/button';
import { useWisprFlow } from '@/hooks/use-wispr-flow';
import type { WisprDictation } from '@/lib/wispr-flow';

interface WisprFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPrompt?: (text: string, autoSubmit?: boolean) => void;
}

export const WisprFlowModal: React.FC<WisprFlowModalProps> = ({
  isOpen,
  onClose,
  onSelectPrompt,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const {
    isInstalled,
    isRunning,
    version,
    user,
    keybinds,
    recentDictations,
    lastDictation,
    totalDictationsCount,
    isSyncing,
    autoSubmit,
    setAutoSubmit,
    launchApp,
    triggerPtt,
    refresh,
  } = useWisprFlow({
    pollingIntervalMs: isOpen ? 1500 : 4000,
  });

  if (!isOpen) return null;

  const handleCopy = (dictation: WisprDictation) => {
    soundFx.playClick(1000);
    navigator.clipboard.writeText(dictation.formattedText || dictation.pastedText);
    setCopiedId(dictation.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleUsePrompt = (text: string, executeNow: boolean) => {
    soundFx.playClick(1200);
    if (onSelectPrompt) {
      onSelectPrompt(text, executeNow);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-background/80 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-2xl max-h-[90vh] bg-background/95 border border-accent/40 rounded-3xl shadow-[0_0_60px_hsl(var(--accent)/0.25)] overflow-hidden">
        {/* Cybernetic Scanlines */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] opacity-25" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-primary/20 z-10 shrink-0 bg-background/90">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-2xl bg-accent/20 border border-accent/50 flex items-center justify-center text-accent shadow-[0_0_15px_hsl(var(--accent)/0.4)]">
              <Waves size={20} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className={cn('text-sm sm:text-base font-bold tracking-wider text-accent', orbitron.className)}>
                  WISPR FLOW // WINDOWS ENGINE
                </h2>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-accent/15 border border-accent/40 text-accent">
                  v{version}
                </span>
              </div>
              <p className="text-[10px] font-mono text-muted-foreground">
                Deep Neural Dictation Bridge &bull; Windows Host Integration
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                soundFx.playClick();
                refresh();
              }}
              className={cn(
                'p-1.5 rounded-full border border-primary/30 text-primary hover:bg-primary/20 transition-all cursor-pointer',
                isSyncing && 'animate-spin text-accent'
              )}
              title="Refresh Dictation Stream"
            >
              <RefreshCw size={14} />
            </button>
            <button
              onClick={() => {
                soundFx.playClick();
                onClose();
              }}
              className="p-1.5 rounded-full border border-primary/30 text-primary hover:bg-primary/20 hover:text-accent transition-all cursor-pointer"
              title="Close Panel"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 scrollbar-thin z-10">
          {/* Status & User Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Engine Telemetry Card */}
            <div className="p-3.5 rounded-2xl border border-primary/25 bg-primary/5 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1.5 uppercase">
                  <Activity size={12} className="text-emerald-400" />
                  Engine State
                </span>
                <span
                  className={cn(
                    'px-2 py-0.5 rounded-full text-[9px] font-mono font-bold border flex items-center gap-1',
                    isRunning
                      ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400 shadow-[0_0_10px_hsl(var(--emerald-500)/0.2)]'
                      : 'border-destructive/50 bg-destructive/10 text-destructive'
                  )}
                >
                  <span className={cn('h-1.5 w-1.5 rounded-full', isRunning ? 'bg-emerald-400 animate-ping' : 'bg-destructive')} />
                  {isRunning ? 'HOST ACTIVE' : 'OFFLINE'}
                </span>
              </div>

              <div className="space-y-1 text-xs font-mono">
                <div className="flex justify-between text-muted-foreground">
                  <span>Dictation Hotkey:</span>
                  <span className="text-foreground font-bold text-accent">Caps Lock [PTT]</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Total Transcriptions:</span>
                  <span className="text-foreground font-bold">{totalDictationsCount} captures</span>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-3 pt-2 border-t border-primary/15">
                <Button
                  size="sm"
                  onClick={triggerPtt}
                  className="flex-1 h-7 text-[10px] font-mono bg-accent/20 hover:bg-accent/30 text-accent border border-accent/50 cursor-pointer"
                >
                  <Mic size={12} className="mr-1" />
                  Toggle PTT [Caps Lock]
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={launchApp}
                  className="h-7 text-[10px] font-mono border-primary/30 text-primary hover:bg-primary/20 cursor-pointer"
                >
                  <ExternalLink size={12} className="mr-1" />
                  Focus App
                </Button>
              </div>
            </div>

            {/* Authenticated User Card */}
            <div className="p-3.5 rounded-2xl border border-primary/25 bg-primary/5 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1.5 uppercase">
                  <User size={12} className="text-accent" />
                  Wispr Flow Profile
                </span>
                <span className="text-[9px] font-mono text-emerald-400 font-bold">CONNECTED</span>
              </div>

              <div className="flex items-center gap-3 my-1">
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="h-10 w-10 rounded-full border border-accent/40 shadow-[0_0_10px_hsl(var(--accent)/0.3)]"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center text-accent font-bold">
                    {user?.name?.[0] || 'W'}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-xs font-bold text-foreground truncate">{user?.name || 'Anish Mondal'}</div>
                  <div className="text-[10px] font-mono text-muted-foreground truncate">{user?.email || 'milti.mondal@gmail.com'}</div>
                </div>
              </div>

              {/* Auto Submit Switcher */}
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-primary/15">
                <span className="text-[10px] font-mono text-muted-foreground">Auto-Ingest into Hermes:</span>
                <button
                  type="button"
                  onClick={() => setAutoSubmit(!autoSubmit)}
                  className={cn(
                    'px-2 py-0.5 rounded-full text-[9px] font-mono font-bold border transition-all cursor-pointer',
                    autoSubmit
                      ? 'border-accent bg-accent/25 text-accent shadow-[0_0_10px_hsl(var(--accent)/0.4)]'
                      : 'border-muted text-muted-foreground hover:bg-muted/20'
                  )}
                >
                  {autoSubmit ? 'AUTO-PROMPT: ON' : 'MANUAL REVIEW'}
                </button>
              </div>
            </div>
          </div>

          {/* Keybindings Strip */}
          <div className="p-3 rounded-2xl border border-primary/20 bg-background/60">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono text-primary font-bold flex items-center gap-1.5">
                <Keyboard size={12} />
                ACTIVE WINDOWS SHORTCUTS
              </span>
              <span className="text-[9px] font-mono text-muted-foreground">GLOBAL SYSTEM WIDE</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[10px] font-mono">
              {keybinds.slice(0, 4).map((kb, i) => (
                <div key={i} className="p-1.5 rounded-lg border border-primary/15 bg-primary/5 flex flex-col justify-between">
                  <span className="text-muted-foreground capitalize text-[9px]">{kb.action.replace('_', ' ')}</span>
                  <span className="text-foreground font-bold mt-0.5 text-accent">{kb.keys}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Live Dictation Stream */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles size={13} className="text-accent animate-pulse" />
                <span className={cn('text-xs font-bold tracking-wider text-primary', orbitron.className)}>
                  RECENT DICTATIONS FEED
                </span>
              </div>
              <span className="text-[9px] font-mono text-muted-foreground">REAL-TIME SQLITE INGESTION</span>
            </div>

            {recentDictations.length === 0 ? (
              <div className="p-8 text-center rounded-2xl border border-dashed border-primary/30 text-muted-foreground font-mono text-xs">
                No Wispr Flow dictations recorded yet. Press <span className="text-accent font-bold">Caps Lock</span> to dictate on Windows!
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentDictations.map((dictation) => {
                  const isLatest = lastDictation?.id === dictation.id;
                  const text = dictation.formattedText || dictation.pastedText;

                  return (
                    <div
                      key={dictation.id}
                      className={cn(
                        'p-3 sm:p-3.5 rounded-2xl border transition-all',
                        isLatest
                          ? 'border-accent/60 bg-accent/5 shadow-[0_0_20px_hsl(var(--accent)/0.15)]'
                          : 'border-primary/20 bg-background/70 hover:border-primary/40'
                      )}
                    >
                      {/* Top metadata row */}
                      <div className="flex items-center justify-between text-[10px] font-mono mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-bold">
                            {dictation.app}
                          </span>
                          {isLatest && (
                            <span className="px-1.5 py-0.5 rounded bg-accent/20 text-accent font-bold animate-pulse">
                              LATEST
                            </span>
                          )}
                          {dictation.detectedLanguage && (
                            <span className="text-muted-foreground uppercase">{dictation.detectedLanguage}</span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-muted-foreground">
                          {dictation.duration && (
                            <span>{dictation.duration.toFixed(1)}s</span>
                          )}
                          {dictation.e2eLatency && (
                            <span className="text-accent/80 font-bold">{dictation.e2eLatency}ms</span>
                          )}
                          <span>{new Date(dictation.timestamp).toLocaleTimeString()}</span>
                        </div>
                      </div>

                      {/* Transcribed Text */}
                      <p className="text-xs sm:text-sm text-foreground/90 font-sans leading-relaxed whitespace-pre-wrap my-1 font-medium">
                        &ldquo;{text}&rdquo;
                      </p>

                      {/* Action buttons */}
                      <div className="flex items-center justify-end gap-2 mt-2 pt-2 border-t border-primary/10">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCopy(dictation)}
                          className="h-6 px-2 text-[10px] font-mono text-muted-foreground hover:text-foreground"
                        >
                          {copiedId === dictation.id ? (
                            <>
                              <CheckCircle2 size={11} className="mr-1 text-emerald-400" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy size={11} className="mr-1" />
                              Copy
                            </>
                          )}
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUsePrompt(text, false)}
                          className="h-6 px-2.5 text-[10px] font-mono border-primary/30 text-primary hover:bg-primary/20 cursor-pointer"
                        >
                          Insert Prompt
                        </Button>

                        <Button
                          size="sm"
                          onClick={() => handleUsePrompt(text, true)}
                          className="h-6 px-2.5 text-[10px] font-mono bg-accent/25 hover:bg-accent/35 text-accent border border-accent/50 cursor-pointer"
                        >
                          <Send size={10} className="mr-1" />
                          Send to Hermes
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WisprFlowModal;
