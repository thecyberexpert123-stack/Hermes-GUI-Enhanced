'use client';

import { ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import React from 'react';

interface MetricGaugeProps {
  name: string;
  value: number;
  color: string;
  icon: React.ReactNode;
}

const MetricGauge = ({ name, value, color, icon }: MetricGaugeProps) => {
  const data = [{ name, value: value, fill: color }];

  return (
    <Card className="w-64 border-primary/20 bg-card/70 backdrop-blur-sm shadow-[0_0_20px_hsl(var(--primary)/0.15),inset_0_0_5px_hsl(var(--primary)/0.1)]" style={{ '--glow-color': color } as React.CSSProperties}>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-primary/80">{name}</CardTitle>
        <div className="text-primary [filter:drop-shadow(0_0_2px_var(--glow-color))]">{icon}</div>
      </CardHeader>
      <CardContent className="flex items-center justify-center p-0">
        <div className="relative h-32 w-32">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              innerRadius="70%"
              outerRadius="90%"
              data={data}
              startAngle={90}
              endAngle={-270}
              barSize={12}
            >
              <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
              <RadialBar
                background={{ fill: 'hsl(var(--primary) / 0.1)' }}
                dataKey="value"
                angleAxisId={0}
                cornerRadius={6}
              />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-foreground">
              {value.toFixed(0)}
              <span className="text-base font-normal text-primary/80">%</span>
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MetricGauge;
