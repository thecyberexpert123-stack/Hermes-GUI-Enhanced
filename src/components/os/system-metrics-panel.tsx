import type { SystemMetrics } from '@/hooks/use-system-metrics';
import MetricGauge from './metric-gauge';
import MetricDisplay from './metric-display';
import { Battery, Cpu, Disc, HardDrive, MemoryStick, Network } from 'lucide-react';

interface SystemMetricsPanelProps {
  metrics: SystemMetrics;
  side: 'left' | 'right';
}

const SystemMetricsPanel = ({ metrics, side }: SystemMetricsPanelProps) => {
  const leftMetrics = (
    <>
      <MetricGauge name="CPU" value={metrics.cpuUsage} color="hsl(var(--chart-1))" icon={<Cpu size={24} />} />
      <MetricGauge name="GPU" value={metrics.gpuUsage} color="hsl(var(--chart-2))" icon={<Disc size={24} />} />
      <MetricGauge name="RAM" value={metrics.ramUsage} color="hsl(var(--chart-3))" icon={<MemoryStick size={24} />} />
    </>
  );

  const rightMetrics = (
    <>
      <MetricDisplay name="Disk Usage" value={`${metrics.diskUsage.toFixed(0)}%`} icon={<HardDrive size={20}/>} />
      <MetricDisplay name="Network" value={`${metrics.networkInMbps.toFixed(1)} ↓ / ${metrics.networkOutMbps.toFixed(1)} ↑`} unit="Mbps" icon={<Network size={20} />} />
      <MetricDisplay name="Battery" value={`${metrics.batteryLevel.toFixed(0)}%`} status={metrics.batteryCharging ? 'Charging' : 'Discharging'} icon={<Battery size={20}/>} />
    </>
  );

  return (
    <div className={`flex h-full flex-col justify-center gap-6 ${side === 'left' ? 'items-start' : 'items-end'}`}>
      {side === 'left' ? leftMetrics : rightMetrics}
    </div>
  );
};

export default SystemMetricsPanel;
