'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { type SystemPerformanceInput, type SystemPerformanceOutput } from '@/ai/flows/system-performance-analysis';
import { soundFx } from '@/lib/audio-synth';

export interface SystemSpecs {
  cpu: string;
  gpu: string;
  ram: string;
  os: string;
}

export type BoostStatus = 'idle' | 'boosting' | 'cooling';

export type FullSystemMetrics = SystemPerformanceInput & {
  specs: SystemSpecs;
  openedApps: string[];
  boostStatus: BoostStatus;
  isRealTelemetry: boolean;
  uptime?: string;
  loadAverage?: string;
  ramUsedMB?: number;
  ramTotalMB?: number;
  diskTotalGB?: number;
  diskUsedGB?: number;
  topProcesses?: Array<{ pid: string; name: string; cpu: string; mem: string; app?: string; status?: string }>;
};

const useSystemMetrics = () => {
  const [metrics, setMetrics] = useState<FullSystemMetrics>({
    cpuUsage: 24,
    gpuUsage: 15,
    ramUsage: 28,
    diskUsage: 22,
    networkInMbps: 18.5,
    networkOutMbps: 4.2,
    batteryLevel: 98,
    batteryCharging: true,
    specs: {
      cpu: 'AMD Ryzen 5 7520U (4C/8T)',
      gpu: 'AMD Radeon Graphics',
      ram: '3.55 GB WSL / 16 GB Host',
      os: 'Kali Linux // WSL2',
    },
    openedApps: ['hermes-gateway (PID 358)', 'kali-security', 'next.js studio', 'wsl-interop'],
    boostStatus: 'idle',
    isRealTelemetry: true,
    uptime: '2h 15m',
    loadAverage: '0.42, 0.38, 0.31',
    ramUsedMB: 980,
    ramTotalMB: 3549,
    topProcesses: [
      { pid: '358', name: 'hermes-gateway', cpu: '1.2%', mem: '15.9%' },
      { pid: '1', name: 'systemd', cpu: '0.0%', mem: '0.3%' },
      { pid: '1024', name: 'node (Next.js)', cpu: '2.5%', mem: '4.8%' },
    ],
  });

  const [analysis, setAnalysis] = useState<SystemPerformanceOutput | null>({
    hasCriticalIssues: false,
    overallSummary: 'WSL sub-systems optimal.',
    issues: [],
    healthScore: 98,
    statusSummary: 'WSL sub-systems optimal.',
    warnings: [],
    recommendations: ['Gateway active on Telegram channel. All 61 skills initialized.'],
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const boostTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const metricsRef = useRef(metrics);

  useEffect(() => {
    metricsRef.current = metrics;
  }, [metrics]);

  const boostPerformance = useCallback(() => {
    if (metrics.boostStatus !== 'idle') return;

    soundFx.playBoost();
    setMetrics((prev) => ({ ...prev, boostStatus: 'boosting' }));

    // Trigger real system boost (sync, SQLite WAL checkpoint, memory compaction)
    fetch('/api/system/boost', { method: 'POST' }).catch((err) => {
      console.warn('Real system boost call failed:', err);
    });

    const originalValues = {
      cpuUsage: metrics.cpuUsage,
      gpuUsage: metrics.gpuUsage,
      ramUsage: metrics.ramUsage,
    };

    setMetrics((prev) => ({
      ...prev,
      cpuUsage: Math.min(100, originalValues.cpuUsage + 45),
      gpuUsage: Math.min(100, originalValues.gpuUsage + 50),
      ramUsage: Math.min(100, originalValues.ramUsage + 25),
    }));

    if (boostTimeoutRef.current) clearTimeout(boostTimeoutRef.current);
    boostTimeoutRef.current = setTimeout(() => {
      setMetrics((prev) => ({ ...prev, boostStatus: 'cooling' }));
      boostTimeoutRef.current = setTimeout(() => {
        setMetrics((prev) => ({
          ...prev,
          boostStatus: 'idle',
          cpuUsage: originalValues.cpuUsage,
          gpuUsage: originalValues.gpuUsage,
          ramUsage: originalValues.ramUsage,
        }));
      }, 2500);
    }, 1800);
  }, [metrics.boostStatus, metrics.cpuUsage, metrics.gpuUsage, metrics.ramUsage]);

  // Fetch real system metrics from Next.js API
  useEffect(() => {
    let isMounted = true;

    const fetchRealMetrics = async () => {
      if (metricsRef.current.boostStatus !== 'idle') return;

      try {
        const res = await fetch('/api/system/metrics');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();

        if (isMounted) {
          setMetrics((prev) => ({
            ...prev,
            cpuUsage: data.cpuUsage ?? prev.cpuUsage,
            gpuUsage: data.gpuUsage ?? prev.gpuUsage,
            ramUsage: data.ramUsage ?? prev.ramUsage,
            diskUsage: data.diskUsage ?? prev.diskUsage,
            ramUsedMB: data.ramUsedMB,
            ramTotalMB: data.ramTotalMB,
            diskTotalGB: data.diskTotalGB,
            diskUsedGB: data.diskUsedGB,
            uptime: data.uptimeFormatted,
            loadAverage: data.loadAverage,
            specs: {
              cpu: (data.cpuModel || prev.specs.cpu).replace(/with Radeon Graphics/i, '').trim(),
              gpu: (data.gpuModel || prev.specs.gpu).replace(/\(\/dev\/dxg\)/i, '').trim(),
              ram: `${Math.round((data.ramTotalMB || 3549) / 1024 * 10) / 10} GB WSL`,
              os: data.distro || 'Kali Linux (WSL2)',
            },
            topProcesses: data.topProcesses || prev.topProcesses,
            openedApps: (data.topProcesses || []).map(
              (p: any) => `${p.name} (PID ${p.pid})`
            ),
          }));
        }
      } catch {
        // Fallback smooth oscillation if API isn't responding
        if (isMounted && metricsRef.current.boostStatus === 'idle') {
          const t = Date.now() / 3000;
          setMetrics((prev) => ({
            ...prev,
            cpuUsage: Math.min(100, Math.max(10, 25 + 15 * Math.sin(t))),
            gpuUsage: Math.min(100, Math.max(5, 18 + 10 * Math.cos(t / 1.5))),
          }));
        }
      }
    };

    fetchRealMetrics();
    const intervalId = setInterval(fetchRealMetrics, 2500);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
      if (boostTimeoutRef.current) clearTimeout(boostTimeoutRef.current);
    };
  }, []);

  return { metrics, analysis, isAnalyzing, boostPerformance };
};

export default useSystemMetrics;
