'use client';

import useSystemMetrics from '@/hooks/use-system-metrics';
import CentralCore from './central-core';
import SystemMetricsPanel from './system-metrics-panel';
import SystemAnalysisPanel from './system-analysis-panel';
import { Grid, MessageSquare } from 'lucide-react';
import { type AppMode } from '@/app/page';

// A replacement for the 'Corner' icon that was removed from lucide-react.
const Corner = (props: React.HTMLAttributes<SVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    {...props}
  >
    <path d="M0 0 H 12 V 4 H 4 V 12 H 0 Z" />
  </svg>
);

const HUD = ({ setMode }: { setMode: (mode: AppMode) => void }) => {
  const { metrics, analysis, isAnalyzing } = useSystemMetrics();

  return (
    <div className="relative grid h-screen w-screen grid-cols-[1fr_auto_1fr] grid-rows-[1fr_auto_1fr] gap-4 p-4 animate-fade-in font-headline">
      {/* Corner decorations */}
      <Corner className="absolute top-4 left-4 h-8 w-8 text-primary/50" />
      <Corner className="absolute top-4 right-4 h-8 w-8 -scale-x-100 text-primary/50" />
      <Corner className="absolute bottom-4 left-4 h-8 w-8 -scale-y-100 text-primary/50" />
      <Corner className="absolute bottom-4 right-4 h-8 w-8 scale-x-[-1] scale-y-[-1] text-primary/50" />

      {/* Main Grid Items */}
      <div className="col-start-1 row-span-3">
        <SystemMetricsPanel metrics={metrics} side="left" />
      </div>

      <div className="col-start-3 row-span-3">
        <SystemMetricsPanel metrics={metrics} side="right" />
      </div>
      
      <div className="col-start-2 row-start-2 flex items-center justify-center">
        <CentralCore />
      </div>

      <div className="col-start-2 row-start-3 self-end">
        <SystemAnalysisPanel analysis={analysis} isAnalyzing={isAnalyzing} />
      </div>

      {/* Top Header */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-4 text-primary tracking-widest text-sm">
        <div className="flex items-center gap-2">
            <Grid size={16} />
            <span>NEON OS v1.0</span>
        </div>
        <button onClick={() => setMode('chat')} className="transition-colors hover:text-accent" title="Switch to Chat Mode">
            <MessageSquare size={16} />
        </button>
      </div>
    </div>
  );
};

export default HUD;
