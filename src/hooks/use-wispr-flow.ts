'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { soundFx } from '@/lib/audio-synth';
import type { WisprUser, WisprKeybind, WisprDictation, WisprStatusResponse } from '@/lib/wispr-flow';

export interface UseWisprFlowOptions {
  pollingIntervalMs?: number;
  autoSubmitDefault?: boolean;
  onNewDictation?: (dictation: WisprDictation) => void;
  onAutoSubmit?: (text: string) => void;
}

export function useWisprFlow(options: UseWisprFlowOptions = {}) {
  const {
    pollingIntervalMs = 2500,
    autoSubmitDefault = false,
    onNewDictation,
    onAutoSubmit,
  } = options;

  const [isInstalled, setIsInstalled] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [version, setVersion] = useState('');
  const [user, setUser] = useState<WisprUser | null>(null);
  const [keybinds, setKeybinds] = useState<WisprKeybind[]>([]);
  const [recentDictations, setRecentDictations] = useState<WisprDictation[]>([]);
  const [lastDictation, setLastDictation] = useState<WisprDictation | null>(null);
  const [totalDictationsCount, setTotalDictationsCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [autoSubmit, setAutoSubmitState] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hermes_wispr_auto_submit');
      if (saved !== null) return saved === 'true';
    }
    return autoSubmitDefault;
  });

  const lastKnownIdRef = useRef<string | null>(null);
  const onNewDictationRef = useRef(onNewDictation);
  const onAutoSubmitRef = useRef(onAutoSubmit);
  const autoSubmitRef = useRef(autoSubmit);

  useEffect(() => {
    onNewDictationRef.current = onNewDictation;
  }, [onNewDictation]);

  useEffect(() => {
    onAutoSubmitRef.current = onAutoSubmit;
  }, [onAutoSubmit]);

  useEffect(() => {
    autoSubmitRef.current = autoSubmit;
  }, [autoSubmit]);

  const setAutoSubmit = useCallback((val: boolean) => {
    setAutoSubmitState(val);
    autoSubmitRef.current = val;
    if (typeof window !== 'undefined') {
      localStorage.setItem('hermes_wispr_auto_submit', String(val));
    }
    soundFx.playClick(val ? 1200 : 800);
  }, []);

  const refresh = useCallback(async () => {
    try {
      setIsSyncing(true);
      const res = await fetch('/api/system/wispr-flow', { cache: 'no-store' });
      if (!res.ok) return;

      const data: WisprStatusResponse = await res.json();
      setIsInstalled(data.installed);
      setIsRunning(data.running);
      setVersion(data.version);
      setUser(data.user);
      setKeybinds(data.keybinds);
      setRecentDictations(data.recentDictations || []);
      setTotalDictationsCount(data.totalDictationsCount || 0);

      const latest = data.lastDictation;
      if (latest) {
        if (lastKnownIdRef.current && lastKnownIdRef.current !== latest.id) {
          // New dictation arrived!
          soundFx.playWakeWordChime();
          if (onNewDictationRef.current) {
            onNewDictationRef.current(latest);
          }
          if (autoSubmitRef.current && onAutoSubmitRef.current && latest.formattedText) {
            onAutoSubmitRef.current(latest.formattedText);
          }
        }
        lastKnownIdRef.current = latest.id;
        setLastDictation(latest);
      }
    } catch (err) {
      console.warn('Wispr Flow sync notice:', err);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const launchApp = useCallback(async () => {
    soundFx.playClick(1000);
    try {
      const res = await fetch('/api/system/wispr-flow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'launch' }),
      });
      const data = await res.json();
      setTimeout(refresh, 1000);
      return data;
    } catch (err) {
      console.warn('Wispr launch notice:', err);
    }
  }, [refresh]);

  const triggerPtt = useCallback(async () => {
    soundFx.playClick(1100);
    try {
      const res = await fetch('/api/system/wispr-flow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ptt' }),
      });
      const data = await res.json();
      setTimeout(refresh, 1500);
      return data;
    } catch (err) {
      console.warn('Wispr trigger notice:', err);
    }
  }, [refresh]);

  // Initial load and periodic polling
  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, pollingIntervalMs);
    return () => clearInterval(interval);
  }, [refresh, pollingIntervalMs]);

  return {
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
  };
}
