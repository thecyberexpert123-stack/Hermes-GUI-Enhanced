'use client';

import { useState, useEffect } from 'react';
import StartupAnimation from '@/components/os/startup-animation';
import HUD from '@/components/os/hud';

export default function Home() {
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    const bootTimer = setTimeout(() => {
      setBooting(false);
    }, 4500); // Corresponds to the length of the startup animation

    return () => clearTimeout(bootTimer);
  }, []);

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden">
      {booting ? <StartupAnimation /> : <HUD />}
    </div>
  );
}
