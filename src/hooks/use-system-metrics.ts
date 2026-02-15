'use client';

import { useState, useEffect, useRef } from 'react';
import { analyzeSystemPerformance, type SystemPerformanceInput, type SystemPerformanceOutput } from '@/ai/flows/system-performance-analysis';

export type SystemMetrics = SystemPerformanceInput;

const useSystemMetrics = () => {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    cpuUsage: 30,
    gpuUsage: 15,
    ramUsage: 45,
    diskUsage: 50,
    networkInMbps: 25,
    networkOutMbps: 5,
    batteryLevel: 100,
    batteryCharging: true,
  });

  const [analysis, setAnalysis] = useState<SystemPerformanceOutput | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const timeRef = useRef(0);

  useEffect(() => {
    const updateMetrics = () => {
      timeRef.current += 0.5;
      const t = timeRef.current;

      setMetrics(prevMetrics => {
        const newMetrics: SystemMetrics = {
          cpuUsage: 45 + 40 * Math.sin(t / 5),
          gpuUsage: 30 + 25 * Math.sin(t / 8 + 2),
          ramUsage: 50 + 20 * Math.cos(t / 6),
          diskUsage: prevMetrics.diskUsage, // Keep disk usage stable unless changed elsewhere
          networkInMbps: 20 + 18 * Math.abs(Math.sin(t / 3)),
          networkOutMbps: 8 + 7 * Math.abs(Math.cos(t / 4)),
          batteryLevel: prevMetrics.batteryCharging 
            ? Math.min(100, prevMetrics.batteryLevel + 0.1)
            : Math.max(0, prevMetrics.batteryLevel - 0.05),
          batteryCharging: prevMetrics.batteryCharging,
        };

        // Randomly toggle battery charging status
        if (Math.random() < 0.005) {
          newMetrics.batteryCharging = !newMetrics.batteryCharging;
        }

        // Clamp values
        Object.keys(newMetrics).forEach(key => {
            const k = key as keyof SystemMetrics;
            if (typeof newMetrics[k] === 'number') {
                if(k !== 'networkInMbps' && k !== 'networkOutMbps') {
                    (newMetrics[k] as number) = Math.max(0, Math.min(100, newMetrics[k] as number));
                }
            }
        });
        
        return newMetrics;
      });
    };

    const intervalId = setInterval(updateMetrics, 2000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const performAnalysis = async () => {
      if (isAnalyzing) return;
      setIsAnalyzing(true);
      try {
        const result = await analyzeSystemPerformance(metrics);
        setAnalysis(result);
      } catch (error) {
        console.error("Error analyzing system performance:", error);
      } finally {
        setIsAnalyzing(false);
      }
    };

    const analysisTimer = setTimeout(performAnalysis, 2100);
    return () => clearTimeout(analysisTimer);
  }, [metrics]);

  return { metrics, analysis, isAnalyzing };
};

export default useSystemMetrics;
