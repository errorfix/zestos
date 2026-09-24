'use client';

import React, { useState, useEffect } from 'react';
import { Clock, Sparkles } from 'lucide-react';

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
      <div className="flex items-center justify-center gap-3 py-6">
        <div className="h-16 w-16 bg-slate-800/50 rounded-2xl animate-pulse" />
        <div className="h-16 w-16 bg-slate-800/50 rounded-2xl animate-pulse" />
        <div className="h-16 w-16 bg-slate-800/50 rounded-2xl animate-pulse" />
        <div className="h-16 w-16 bg-slate-800/50 rounded-2xl animate-pulse" />
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
    <div className="relative inline-block w-full max-w-xl mx-auto">
      {/* Subtle outer glow */}
      <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-rose-500/20 rounded-3xl blur-xl opacity-70 pointer-events-none" />

      <div className="relative bg-slate-900/80 backdrop-blur-xl border border-slate-700/70 p-4 sm:p-6 rounded-3xl shadow-2xl">
        <div className="flex items-center justify-between gap-2 mb-3.5 px-1">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-400">
            <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
            <span>Festival Countdown</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Starts Nov 30, 2026</span>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 sm:gap-3.5">
          {timeBlocks.map((block, idx) => (
            <div
              key={block.label}
              className="relative bg-slate-950/80 border border-slate-800 rounded-2xl p-2.5 sm:p-4 text-center group hover:border-amber-500/50 transition-colors"
            >
              <span className="block text-2xl sm:text-4xl font-extrabold font-mono text-white tracking-tight group-hover:text-amber-300 transition-colors">
                {String(block.value).padStart(2, '0')}
              </span>
              <span className="block text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                {block.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
