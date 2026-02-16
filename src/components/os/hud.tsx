'use client';

import useSystemMetrics from '@/hooks/use-system-metrics';
import CentralCore from './central-core';
import SystemMetricsDisplay from './system-metrics-panel';
import SystemAnalysisPanel from './system-analysis-panel';
import InfoListPanel from './InfoListPanel';
import Clock from './Clock';
import BoostButton from './BoostButton';
import { MessageSquare, SlidersHorizontal } from 'lucide-react';
import { type AppMode } from '@/app/page';
import { cn } from '@/lib/utils';

const HUD = ({ setMode }: { setMode: (mode: AppMode) => void }) => {
  const { metrics, analysis, isAnalyzing, boostPerformance } = useSystemMetrics();

  const boostOverlayClass = cn(
    "fixed inset-0 z-50 pointer-events-none transition-opacity duration-1000",
    {
      'opacity-0': metrics.boostStatus === 'idle',
      'opacity-100 animate-boost-flash': metrics.boostStatus === 'boosting',
      'opacity-0': metrics.boostStatus === 'cooling',
    }
  );

  return (
    <div className="relative h-screen w-screen p-4 animate-fade-in font-headline text-primary/90">
      <div className={boostOverlayClass} style={{
        backgroundImage: 'radial-gradient(circle, hsl(var(--primary) / 0.3) 0%, transparent 60%)',
      }}/>
      
      {/* Top Bar */}
      <header className="absolute top-4 left-4 right-4 flex justify-between items-start">
        <Clock />
        <div className="flex items-center gap-4 text-primary tracking-widest text-sm">
            <div className="flex items-center gap-2">
                <SlidersHorizontal size={16} />
                <span>NEON OS // J.A.R.V.I.S. v1.0</span>
            </div>
            <button onClick={() => setMode('chat')} className="rounded-md p-1 transition-all hover:bg-primary/10 hover:text-accent hover:shadow-[0_0_15px_hsl(var(--primary)/0.3)]" title="Switch to Chat Mode">
                <MessageSquare size={16} />
            </button>
        </div>
      </header>
      
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <CentralCore />
      </div>

      {/* Left Panels */}
      <div className="absolute left-4 top-1/4 h-1/2 flex flex-col justify-around">
        <SystemMetricsDisplay metrics={metrics} />
      </div>

       {/* Right Panels */}
       <div className="absolute right-4 top-1/4 h-1/2 flex flex-col justify-around">
          <InfoListPanel title="User PC Specs" items={Object.entries(metrics.specs).map(([key, value]) => `${key.toUpperCase()}: ${value}`)} />
          <InfoListPanel title="Opened Apps" items={metrics.openedApps} />
       </div>


      <footer className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
        <BoostButton boostStatus={metrics.boostStatus} onClick={boostPerformance} />
        <SystemAnalysisPanel analysis={analysis} isAnalyzing={isAnalyzing} />
      </footer>
    </div>
  );
};

export default HUD;
