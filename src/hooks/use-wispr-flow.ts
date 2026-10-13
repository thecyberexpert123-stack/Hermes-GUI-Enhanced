'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { soundFx } from '@/lib/audio-synth';
import type { WisprUser, WisprKeybind, WisprDictation, WisprStatusResponse } from '@/lib/wispr-flow';

export type WisprExecutionMode = 'manual_approve' | 'auto_execute';
export type WisprActivationMode = 'key_ptt' | 'hands_free';

export interface UseWisprFlowOptions {
  pollingIntervalMs?: number;
  autoSubmitDefault?: boolean;
  defaultExecutionMode?: WisprExecutionMode;
  defaultActivationMode?: WisprActivationMode;
  autoLaunch?: boolean;
  onNewDictation?: (dictation: WisprDictation) => void;
  onAutoSubmit?: (text: string) => void;
  onPendingApproval?: (dictation: WisprDictation) => void;
}

export function useWisprFlow(options: UseWisprFlowOptions = {}) {
  const {
    pollingIntervalMs = 2500,
    autoSubmitDefault = false,
    defaultExecutionMode = 'manual_approve',
    defaultActivationMode = 'key_ptt',
    autoLaunch = true,
    onNewDictation,
    onAutoSubmit,
    onPendingApproval,
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

  // Execution Mode: 'manual_approve' vs 'auto_execute'
  const [executionMode, setExecutionModeState] = useState<WisprExecutionMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hermes_wispr_execution_mode');
      if (saved === 'auto_execute' || saved === 'manual_approve') return saved;
      const legacyAuto = localStorage.getItem('hermes_wispr_auto_submit');
      if (legacyAuto !== null) return legacyAuto === 'true' ? 'auto_execute' : 'manual_approve';
    }
    return autoSubmitDefault ? 'auto_execute' : defaultExecutionMode;
  });

  // Activation Mode: 'key_ptt' (Caps Lock) vs 'hands_free' (Keyless continuous ambient)
  const [activationMode, setActivationModeState] = useState<WisprActivationMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hermes_wispr_activation_mode');
      if (saved === 'hands_free' || saved === 'key_ptt') return saved;
    }
    return defaultActivationMode;
  });

  // Pending dictation waiting for operator approval
  const [pendingDictation, setPendingDictation] = useState<WisprDictation | null>(null);

  const autoLaunchAttemptedRef = useRef(false);
  const lastKnownIdRef = useRef<string | null>(null);
  const onNewDictationRef = useRef(onNewDictation);
  const onAutoSubmitRef = useRef(onAutoSubmit);
  const onPendingApprovalRef = useRef(onPendingApproval);
  const executionModeRef = useRef(executionMode);
  const activationModeRef = useRef(activationMode);

  useEffect(() => {
    onNewDictationRef.current = onNewDictation;
  }, [onNewDictation]);

  useEffect(() => {
    onAutoSubmitRef.current = onAutoSubmit;
  }, [onAutoSubmit]);

  useEffect(() => {
    onPendingApprovalRef.current = onPendingApproval;
  }, [onPendingApproval]);

  useEffect(() => {
    executionModeRef.current = executionMode;
  }, [executionMode]);

  useEffect(() => {
    activationModeRef.current = activationMode;
  }, [activationMode]);

  const setExecutionMode = useCallback((mode: WisprExecutionMode) => {
    setExecutionModeState(mode);
    executionModeRef.current = mode;
    if (typeof window !== 'undefined') {
      localStorage.setItem('hermes_wispr_execution_mode', mode);
      localStorage.setItem('hermes_wispr_auto_submit', String(mode === 'auto_execute'));
    }
    soundFx.playClick(mode === 'auto_execute' ? 1200 : 900);
  }, []);

  const setActivationMode = useCallback((mode: WisprActivationMode) => {
    setActivationModeState(mode);
    activationModeRef.current = mode;
    if (typeof window !== 'undefined') {
      localStorage.setItem('hermes_wispr_activation_mode', mode);
    }
    soundFx.playClick(mode === 'hands_free' ? 1300 : 900);
  }, []);

  const approveDictation = useCallback((target?: WisprDictation | string) => {
    const textToApprove = typeof target === 'string'
      ? target
      : (target?.formattedText || target?.pastedText || pendingDictation?.formattedText || pendingDictation?.pastedText || '');
    const clean = textToApprove.trim();
    if (clean) {
      soundFx.playChirp();
      setPendingDictation(null);
      if (onAutoSubmitRef.current) {
        onAutoSubmitRef.current(clean);
      }
    }
    return clean;
  }, [pendingDictation]);

  const discardDictation = useCallback(() => {
    soundFx.playClick(700);
    setPendingDictation(null);
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

      // Silent Auto-Launch Wispr Flow if installed but not running
      if (data.installed && !data.running && autoLaunch && !autoLaunchAttemptedRef.current) {
        autoLaunchAttemptedRef.current = true;
        fetch('/api/system/wispr-flow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'launch' }),
        }).catch(() => {});
      }

      const latest = data.lastDictation;
      if (latest) {
        if (lastKnownIdRef.current && lastKnownIdRef.current !== latest.id) {
          // New dictation arrived!
          soundFx.playWakeWordChime();
          if (onNewDictationRef.current) {
            onNewDictationRef.current(latest);
          }
          const text = (latest.formattedText || latest.pastedText || '').trim();
          if (text) {
            if (executionModeRef.current === 'auto_execute') {
              if (onAutoSubmitRef.current) {
                onAutoSubmitRef.current(text);
              }
            } else {
              setPendingDictation(latest);
              if (onPendingApprovalRef.current) {
                onPendingApprovalRef.current(latest);
              }
            }
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
    // Execution & Approval
    executionMode,
    setExecutionMode,
    // Activation (Keyless vs Hotkey)
    activationMode,
    setActivationMode,
    // Pending Approval
    pendingDictation,
    setPendingDictation,
    approveDictation,
    discardDictation,
    // Backward compatibility
    autoSubmit: executionMode === 'auto_execute',
    setAutoSubmit: (val: boolean) => setExecutionMode(val ? 'auto_execute' : 'manual_approve'),
    // Actions
    launchApp,
    triggerPtt,
    refresh,
  };
}
