'use client';

import React, { useState, useTransition } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Scan,
  Search,
  History,
  Clock,
  Sparkles,
  RotateCcw,
} from 'lucide-react';

interface CheckInLogItem {
  id: string;
  ticketCode: string;
  attendeeName: string;
  eventTitle: string;
  status: 'CHECKED_IN' | 'ALREADY_CHECKED_IN' | 'INVALID';
  message: string;
  timestamp: string;
}

export default function CheckInScanner() {
  const [ticketInput, setTicketInput] = useState<string>('');
  const [signatureInput, setSignatureInput] = useState<string>('');
  const [lastResult, setLastResult] = useState<{
    success: boolean;
    ticketCode: string;
    attendeeName: string;
    eventTitle: string;
    status: 'CHECKED_IN' | 'ALREADY_CHECKED_IN' | 'INVALID';
    message: string;
    checkedInAt?: string;
  } | null>(null);

  const [history, setHistory] = useState<CheckInLogItem[]>([]);
  const [isProcessing, startTransition] = useTransition();

  // Play audio chime for gatekeepers using Web Audio API
  const playSound = (type: 'success' | 'error') => {
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === 'success') {
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.frequency.setValueAtTime(880.0, audioCtx.currentTime + 0.1); // A5
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.35);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220.0, audioCtx.currentTime); // A3
        osc.frequency.setValueAtTime(164.81, audioCtx.currentTime + 0.15); // E3
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);
      }
    } catch {
      // AudioContext unavailable or restricted
    }
  };

  const handleScanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const raw = ticketInput.trim();
    if (!raw) return;

    // Check if input is a JSON string from a scanned QR code
    let codeToVerify = raw;
    let sigToVerify = signatureInput.trim() || undefined;

    if (raw.startsWith('{') && raw.endsWith('}')) {
      try {
        const qrJson = JSON.parse(raw);
        if (qrJson.code) {
          codeToVerify = qrJson.code;
        }
        if (qrJson.sig) {
          sigToVerify = qrJson.sig;
        }
      } catch {
        // Not valid JSON, continue with raw input
      }
    }

    startTransition(async () => {
      try {
        const res = await fetch('/api/checkin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ticketCode: codeToVerify,
            signature: sigToVerify,
          }),
        });

        const data = await res.json();
        const success = data.success === true;

        playSound(success ? 'success' : 'error');

        setLastResult(data);

        // Add to history
        setHistory((prev) => [
          {
            id: `${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            ticketCode: data.ticketCode || codeToVerify,
            attendeeName: data.attendeeName || 'Unknown',
            eventTitle: data.eventTitle || 'Campus Event',
            status: data.status || (success ? 'CHECKED_IN' : 'INVALID'),
            message: data.message || 'Scanned',
            timestamp: new Date().toLocaleTimeString(),
          },
          ...prev.slice(0, 19), // keep last 20
        ]);

        // Clear input for next attendee scan
        setTicketInput('');
        setSignatureInput('');
      } catch (err) {
        playSound('error');
        setLastResult({
          success: false,
          ticketCode: codeToVerify,
          attendeeName: 'Error',
          eventTitle: 'System Error',
          status: 'INVALID',
          message: (err as Error).message || 'Network error verifying ticket',
        });
      }
    });
  };

  const successfulCount = history.filter((h) => h.status === 'CHECKED_IN').length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Scanner & Manual Input Panel */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#1a73e8]">
                Gate Access Engine
              </span>
              <h2 className="text-xl font-bold text-slate-900">
                Attendee Pass Scanner
              </h2>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#e8f0fe] text-[#1a73e8] border border-[#d2e3fc] flex items-center gap-1.5">
              <Scan className="w-3.5 h-3.5" />
              Scanner Ready
            </span>
          </div>

          <form onSubmit={handleScanSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="ticketCode"
                className="block text-sm font-semibold text-slate-800 mb-1.5"
              >
                Scan QR Payload or Enter Ticket Code
              </label>
              <div className="relative">
                <input
                  id="ticketCode"
                  type="text"
                  required
                  autoFocus
                  value={ticketInput}
                  onChange={(e) => setTicketInput(e.target.value)}
                  placeholder="e.g. LV-TKT-2026-X89K or paste scanned QR JSON"
                  className="w-full pl-11 pr-28 py-3.5 rounded-2xl border-2 border-slate-300 text-slate-900 font-mono text-base focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/20 bg-white"
                />
                <Scan className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <button
                  type="submit"
                  disabled={isProcessing || !ticketInput.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2 rounded-xl text-sm font-bold bg-[#1a73e8] hover:bg-[#1557b0] text-white transition-all disabled:opacity-50"
                >
                  {isProcessing ? 'Verifying...' : 'Check In'}
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-1.5">
                Tip: USB barcode scanners and mobile cameras act as keyboard inputs and submit automatically.
              </p>
            </div>
          </form>

          {/* Real-time Scan Result Banner */}
          {lastResult && (
            <div
              className={`mt-6 p-6 rounded-2xl border-2 transition-all ${
                lastResult.status === 'CHECKED_IN'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : lastResult.status === 'ALREADY_CHECKED_IN'
                  ? 'bg-amber-50 border-amber-300 text-amber-950'
                  : 'bg-red-50 border-red-300 text-red-950'
              }`}
            >
              <div className="flex items-start gap-4">
                {lastResult.status === 'CHECKED_IN' ? (
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0 mt-0.5" />
                ) : lastResult.status === 'ALREADY_CHECKED_IN' ? (
                  <AlertTriangle className="w-8 h-8 text-amber-600 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-8 h-8 text-red-600 shrink-0 mt-0.5" />
                )}

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider">
                      {lastResult.status === 'CHECKED_IN'
                        ? 'Access Granted • Valid Entry'
                        : lastResult.status === 'ALREADY_CHECKED_IN'
                        ? 'Security Alert • Already Used'
                        : 'Access Denied • Invalid Pass'}
                    </span>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-white/80">
                      {lastResult.ticketCode}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold mt-1">
                    {lastResult.attendeeName}
                  </h3>
                  <p className="text-sm font-medium mt-0.5">
                    {lastResult.eventTitle}
                  </p>

                  <p className="text-xs mt-2 font-medium opacity-90">
                    {lastResult.message}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Session Stats & Recent Gate Logs */}
      <div className="space-y-6">
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center justify-between">
            <span>Session Gate Metrics</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
              <span className="text-xs font-semibold text-emerald-700 block">
                Checked In Now
              </span>
              <span className="text-2xl font-extrabold text-emerald-900 mt-1 block">
                {successfulCount}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-semibold text-slate-600 block">
                Total Scanned
              </span>
              <span className="text-2xl font-extrabold text-slate-900 mt-1 block">
                {history.length}
              </span>
            </div>
          </div>
        </div>

        {/* Live History Feed */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <History className="w-4 h-4 text-slate-400" />
              Recent Scans
            </h3>
            <span className="text-xs text-slate-400">Last 20</span>
          </div>

          {history.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">
              No scans recorded in this browser session yet.
            </p>
          ) : (
            <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 text-xs flex items-center justify-between gap-2"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          item.status === 'CHECKED_IN'
                            ? 'bg-emerald-500'
                            : item.status === 'ALREADY_CHECKED_IN'
                            ? 'bg-amber-500'
                            : 'bg-red-500'
                        }`}
                      />
                      <span className="font-bold text-slate-800">{item.attendeeName}</span>
                    </div>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      {item.ticketCode} • {item.eventTitle}
                    </span>
                  </div>

                  <span className="text-[10px] text-slate-400 font-mono shrink-0">
                    {item.timestamp}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
