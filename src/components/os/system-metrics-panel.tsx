'use client';

import { Battery, Cpu, Disc, HardDrive, MemoryStick, Network } from 'lucide-react';
import type { FullSystemMetrics } from '@/hooks/use-system-metrics';
import JarvisPanel from './JarvisPanel';
import MetricGauge from './metric-gauge';

const PowerIndicator = ({ level, charging }: { level: number; charging: boolean }) => (
  <div className="flex items-center gap-3">
    <div className="w-24">
      <MetricGauge name="Power" value={level} color="hsl(var(--chart-5))" icon={<Battery size={20}/>} />
    </div>
    <div className="text-sm">
      <p>Status: <span className="font-bold">{charging ? 'Charging' : 'Discharging'}</span></p>
      <p>Level: <span className="font-bold">{level.toFixed(0)}%</span></p>
    </div>
  </div>
);

const StorageIndicator = ({ diskUsage, total, used }: { diskUsage: number; total: number, used: number }) => (
  <div className="space-y-2 text-sm">
    <div className="flex justify-between items-center">
      <span>Total Capacity:</span>
      <span className="font-bold">{total} GB</span>
    </div>
    <div className="flex justify-between items-center">
      <span>Used Space:</span>
      <span className="font-bold">{used.toFixed(0)} GB</span>
    </div>
    <div className="w-full bg-primary/10 h-2 rounded-full">
        <div className="bg-primary h-full rounded-full" style={{width: `${diskUsage}%`}}/>
    </div>
  </div>
);


const SystemMetricsDisplay = ({ metrics }: { metrics: FullSystemMetrics }) => {
  return (
    <div className="flex flex-col gap-8">
      <JarvisPanel title="Core Metrics" className="w-72">
        <div className="grid grid-cols-3 gap-2">
            <MetricGauge name="CPU" value={metrics.cpuUsage} color="hsl(var(--chart-1))" icon={<Cpu size={24} />} compact />
            <MetricGauge name="GPU" value={metrics.gpuUsage} color="hsl(var(--chart-2))" icon={<Disc size={24} />} compact />
            <MetricGauge name="RAM" value={metrics.ramUsage} color="hsl(var(--chart-3))" icon={<MemoryStick size={24} />} compact />
        </div>
      </JarvisPanel>

      <JarvisPanel title="Sub-Systems" className="w-72">
        <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm">
                <Network size={20} className="text-primary"/>
                <div>
                    <p>Network Status</p>
                    <p className="font-bold">{metrics.networkInMbps.toFixed(1)} Mbps ↓ / {metrics.networkOutMbps.toFixed(1)} Mbps ↑</p>
                </div>
            </div>
             <StorageIndicator diskUsage={metrics.diskUsage} total={1024} used={1024 * (metrics.diskUsage / 100)} />
        </div>
      </JarvisPanel>

       <JarvisPanel title="Power" className="w-72">
        <PowerIndicator level={metrics.batteryLevel} charging={metrics.batteryCharging} />
      </JarvisPanel>
    </div>
  );
};

export default SystemMetricsDisplay;
