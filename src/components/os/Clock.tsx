'use client';

import { useState, useEffect } from 'react';

const Clock = () => {
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    const timerId = setInterval(() => setDate(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);

  const time = date.toLocaleTimeString('en-US', { hour12: false });
  const day = date.toLocaleDateString('en-US', { weekday: 'long' });
  const month = date.toLocaleDateString('en-US', { month: 'long' });
  const dayOfMonth = date.getDate();

  return (
    <div className="flex items-center gap-4 text-primary">
        <div className="grid grid-cols-2 text-center leading-none">
            <div className="text-4xl font-bold border-r-2 border-primary/50 pr-3">{month.substring(0,3).toUpperCase()}</div>
            <div className="text-4xl font-bold pl-3">{dayOfMonth}</div>
            <div className="col-span-2 text-xs tracking-widest">{day.toUpperCase()}</div>
        </div>
        <div className="text-2xl font-semibold tabular-nums">
            {time}
        </div>
    </div>
  );
};

export default Clock;
