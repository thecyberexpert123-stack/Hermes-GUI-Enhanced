'use client';

import { useState, useEffect, useCallback } from 'react';
import StartupAnimation from '@/components/os/startup-animation';
import HUD from '@/components/os/hud';
import ChatMode from '@/components/os/chat-mode';
import { cn } from '@/lib/utils';

export type AppMode = 'hud' | 'chat';

export default function Home() {
  const [booting, setBooting] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('skipBoot') === '1' || urlParams.get('skip') === '1') return false;
        if (navigator.userAgent.includes('Electron')) return false;
        if (sessionStorage.getItem('hermes_boot_seen') === 'true') return false;
      } catch {}
    }
    return true;
  });
  const [mode, setMode] = useState<AppMode>(() => {
    if (typeof window !== 'undefined') {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const req = urlParams.get('mode') as AppMode | null;
        if (req === 'hud' || req === 'chat') return req;
      } catch {}
    }
    return 'chat';
  });
  const [activeSessionId, setActiveSessionId] = useState<string | undefined>(undefined);

  const handleFinishBoot = useCallback((targetMode?: AppMode) => {
    if (targetMode) setMode(targetMode);
    setBooting(false);
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('hermes_boot_seen', 'true');
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const skipBootParam = urlParams.get('skipBoot') === '1' || urlParams.get('skip') === '1';
        const requestedMode = urlParams.get('mode') as AppMode | null;
        if (requestedMode === 'hud' || requestedMode === 'chat') {
          setMode(requestedMode);
        }

        const isElectron = navigator.userAgent.includes('Electron');
        const alreadySeen = sessionStorage.getItem('hermes_boot_seen') === 'true';

        if (skipBootParam || isElectron || alreadySeen) {
          setBooting(false);
          return;
        }
      } catch {}
    }

    // Snappy fallback safety timer: auto-resolve within 2.5s max
    const bootTimer = setTimeout(() => {
      setBooting(false);
      try {
        sessionStorage.setItem('hermes_boot_seen', 'true');
      } catch {}
    }, 2500);

    return () => clearTimeout(bootTimer);
  }, []);

  const handleSelectSession = (sessionId: string) => {
    setActiveSessionId(sessionId);
    setMode('chat');
  };

  const renderContent = () => {
    switch (mode) {
      case 'hud':
        return (
          <HUD
            setMode={setMode}
            onSelectSession={handleSelectSession}
          />
        );
      case 'chat':
        return (
          <ChatMode
            setMode={setMode}
            initialSessionId={activeSessionId}
            onSelectSession={handleSelectSession}
          />
        );
      default:
        return <HUD setMode={setMode} onSelectSession={handleSelectSession} />;
    }
  };

  return (
    <div
      className={cn(
        "relative flex min-h-screen w-full items-center justify-center overflow-hidden select-none bg-background text-foreground"
      )}
    >
      {booting ? (
        <StartupAnimation onComplete={handleFinishBoot} />
      ) : (
        renderContent()
      )}
    </div>
  );
}
