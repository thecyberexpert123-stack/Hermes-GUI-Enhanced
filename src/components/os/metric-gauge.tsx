'use client';

import { ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import React from 'react';
import { cn } from '@/lib/utils';

interface MetricGaugeProps {
  name: string;
  value: number;
  color: string;
  icon: React.ReactNode;
  compact?: boolean;
}

const MetricGauge = ({ name, value, color, icon, compact = false }: MetricGaugeProps) => {
  const data = [{ name, value: value, fill: color }];

  const wrapperClass = compact ? "w-full" : "w-64";
  const containerSize = compact ? "h-20 w-20" : "h-32 w-32";
  const titleSize = compact ? "text-xs" : "text-sm";
  const valueSize = compact ? "text-lg" : "text-2xl";

  return (
    <div className={cn("flex flex-col items-center", wrapperClass)} style={{ '--glow-color': color } as React.CSSProperties}>
       <p className={cn("font-medium text-primary/80", titleSize)}>{name}</p>
        <div className={cn("relative", containerSize)}>
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              innerRadius="70%"
              outerRadius="90%"
              data={data}
              startAngle={90}
              endAngle={-270}
              barSize={compact ? 8 : 12}
            >
              <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
              <RadialBar
                background={{ fill: 'hsl(var(--primary) / 0.1)' }}
                dataKey="value"
                angleAxisId={0}
                cornerRadius={compact ? 4: 6}
              />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn("font-bold text-foreground", valueSize)}>
              {value.toFixed(0)}
              <span className={cn("font-normal text-primary/80", compact ? 'text-xs' : 'text-base')}>%</span>
            </span>
          </div>
        </div>
    </div>
  );
};

export default MetricGauge;
