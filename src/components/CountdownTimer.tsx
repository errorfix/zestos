'use client';

import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function CountdownTimer() {
  // Festival target date: November 30, 2026, 09:00:00 AM IST
  const targetDate = new Date('2026-11-30T09:00:00+05:30').getTime();

  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center gap-3 py-4">
        <div className="h-14 w-14 bg-slate-100 rounded-xl animate-pulse" />
        <div className="h-14 w-14 bg-slate-100 rounded-xl animate-pulse" />
        <div className="h-14 w-14 bg-slate-100 rounded-xl animate-pulse" />
        <div className="h-14 w-14 bg-slate-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  const timeBlocks = [
    { label: 'DAYS', value: timeLeft.days },
    { label: 'HOURS', value: timeLeft.hours },
    { label: 'MINUTES', value: timeLeft.minutes },
    { label: 'SECONDS', value: timeLeft.seconds },
  ];

  return (
    <div className="inline-block w-full max-w-lg mx-auto">
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between gap-2 mb-3 px-1">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-700">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Festival Countdown</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>November 30, 2026</span>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {timeBlocks.map((block) => (
            <div
              key={block.label}
              className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 sm:p-3 text-center"
            >
              <span className="block text-xl sm:text-3xl font-black font-mono text-slate-900 tracking-tight">
                {String(block.value).padStart(2, '0')}
              </span>
              <span className="block text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                {block.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
