'use client';

import { useState, useEffect, useCallback } from 'react';
import StartupAnimation from '@/components/os/startup-animation';
import HUD from '@/components/os/hud';
import ChatMode from '@/components/os/chat-mode';
import { cn } from '@/lib/utils';

export type AppMode = 'hud' | 'chat';

export default function Home() {
  const [booting, setBooting] = useState(true);
  const [mode, setMode] = useState<AppMode>('chat');
  const [activeSessionId, setActiveSessionId] = useState<string | undefined>(undefined);

  const handleFinishBoot = useCallback((targetMode?: AppMode) => {
    if (targetMode) setMode(targetMode);
    setBooting(false);
  }, []);

  useEffect(() => {
    const bootTimer = setTimeout(() => {
      setBooting(false);
    }, 9500);

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
        "relative flex min-h-screen w-full items-center justify-center overflow-hidden select-none",
        !booting && 'bg-background'
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
