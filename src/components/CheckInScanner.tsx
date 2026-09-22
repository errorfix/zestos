'use client';

import React, { useState, useEffect, useRef, useTransition, useCallback } from 'react';
import jsQR from 'jsqr';
import {
  Camera,
  CameraOff,
  FlipHorizontal,
  Volume2,
  VolumeX,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Scan,
  History,
  Clock,
  Sparkles,
  RotateCcw,
  Keyboard,
  Video,
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
  const [activeTab, setActiveTab] = useState<'camera' | 'manual'>('camera');

  // Camera State
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Manual Inputs
  const [ticketInput, setTicketInput] = useState<string>('');
  const [signatureInput, setSignatureInput] = useState<string>('');

  // Scanning cooldown to prevent double processing
  const scanCooldownRef = useRef<boolean>(false);
  const animationFrameIdRef = useRef<number | null>(null);

  // Verification State
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
  const playSound = useCallback((type: 'success' | 'warning' | 'error') => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
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
      } else if (type === 'warning') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440.0, audioCtx.currentTime); // A4
        osc.frequency.setValueAtTime(349.23, audioCtx.currentTime + 0.15); // F4
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);
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
  }, [soundEnabled]);

  // Execute verification against /api/checkin
  const performCheckIn = useCallback(async (ticketCode: string, signature?: string) => {
    if (!ticketCode.trim()) return;

    startTransition(async () => {
      try {
        const res = await fetch('/api/checkin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ticketCode: ticketCode.trim(),
            signature: signature?.trim() || undefined,
          }),
        });

        const data = await res.json();

        if (res.ok && data.success) {
          if (data.status === 'CHECKED_IN') {
            playSound('success');
          } else if (data.status === 'ALREADY_CHECKED_IN') {
            playSound('warning');
          } else {
            playSound('error');
          }

          const resultObj = {
            success: data.success,
            ticketCode: data.ticketCode,
            attendeeName: data.attendeeName,
            eventTitle: data.eventTitle,
            status: data.status,
            message: data.message,
            checkedInAt: data.checkedInAt,
          };

          setLastResult(resultObj);

          setHistory((prev) => [
            {
              id: `${Date.now()}_${Math.random()}`,
              ticketCode: data.ticketCode,
              attendeeName: data.attendeeName,
              eventTitle: data.eventTitle,
              status: data.status,
              message: data.message,
              timestamp: new Date().toLocaleTimeString(),
            },
            ...prev.slice(0, 29), // keep recent 30 scans
          ]);
        } else {
          playSound('error');
          const errorObj = {
            success: false,
            ticketCode: ticketCode.trim(),
            attendeeName: 'Unknown Attendee',
            eventTitle: 'Verification Failed',
            status: 'INVALID' as const,
            message: data.error || 'Failed to verify ticket pass.',
          };
          setLastResult(errorObj);
        }
      } catch (err) {
        playSound('error');
        setLastResult({
          success: false,
          ticketCode: ticketCode.trim(),
          attendeeName: 'Error',
          eventTitle: 'Network or Terminal Issue',
          status: 'INVALID',
          message: (err as Error).message || 'Network communication failure.',
        });
      }
    });
  }, [playSound]);

  // Parse QR Code raw string (either JSON payload or plain code)
  const handleQrDetected = useCallback((rawText: string) => {
    if (scanCooldownRef.current) return;

    let codeToVerify = rawText.trim();
    let sigToVerify: string | undefined;

    if (codeToVerify.startsWith('{') && codeToVerify.endsWith('}')) {
      try {
        const qrJson = JSON.parse(codeToVerify);
        if (qrJson.code) codeToVerify = qrJson.code;
        if (qrJson.sig) sigToVerify = qrJson.sig;
      } catch {
        // Fall back to raw string
      }
    }

    if (!codeToVerify) return;

    // Trigger cooldown for 2.5 seconds to prevent spamming
    scanCooldownRef.current = true;
    performCheckIn(codeToVerify, sigToVerify);

    setTimeout(() => {
      scanCooldownRef.current = false;
    }, 2500);
  }, [performCheckIn]);

  // Frame processing loop with jsQR
  const tick = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });

        if (code && code.data) {
          handleQrDetected(code.data);
        }
      }
    }

    if (cameraActive) {
      animationFrameIdRef.current = requestAnimationFrame(tick);
    }
  }, [cameraActive, handleQrDetected]);

  // Start Camera Stream
  useEffect(() => {
    let stream: MediaStream | null = null;

    if (cameraActive && activeTab === 'camera') {
      setCameraError(null);
      navigator.mediaDevices
        ?.getUserMedia({
          video: {
            facingMode: facingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        })
        .then((s) => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(() => {});
          }
          animationFrameIdRef.current = requestAnimationFrame(tick);
        })
        .catch((err) => {
          console.error('Camera access error:', err);
          setCameraError(
            'Unable to access camera video feed. Please allow camera permissions in your browser or switch to Manual Code Entry.'
          );
        });
    }

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraActive, facingMode, activeTab, tick]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketInput.trim()) return;
    performCheckIn(ticketInput, signatureInput);
  };

  const handleFlipCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left/Main Column: Scanner Console */}
      <div className="lg:col-span-7 space-y-6">
        {/* Portal Mode Switcher */}
        <div className="flex items-center justify-between bg-white p-2 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('camera')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'camera'
                  ? 'bg-[#1a73e8] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>Live Camera Scanner</span>
            </button>

            <button
              onClick={() => setActiveTab('manual')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'manual'
                  ? 'bg-[#1a73e8] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Keyboard className="w-3.5 h-3.5" />
              <span>Manual Entry</span>
            </button>
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            title={soundEnabled ? 'Mute Audio Chime' : 'Enable Audio Chime'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>

        {/* 1. Live Camera Viewfinder Portal */}
        {activeTab === 'camera' && (
          <div className="bg-slate-950 rounded-3xl border border-slate-800 p-5 shadow-xl text-white relative overflow-hidden">
            {/* Viewfinder Controls Top Bar */}
            <div className="flex items-center justify-between mb-4 z-10 relative">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Camera QR Portal • Ready
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleFlipCamera}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
                  title="Flip between back/front lens"
                >
                  <FlipHorizontal className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Flip Lens</span>
                </button>

                <button
                  onClick={() => setCameraActive(!cameraActive)}
                  className={`p-1.5 rounded-xl transition-colors ${
                    cameraActive ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-red-600 text-white'
                  }`}
                  title={cameraActive ? 'Pause Camera' : 'Resume Camera'}
                >
                  {cameraActive ? <Camera className="w-4 h-4" /> : <CameraOff className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Video Viewfinder Box */}
            <div className="relative aspect-video w-full max-h-[380px] bg-black rounded-2xl overflow-hidden flex items-center justify-center border border-slate-800">
              {cameraError ? (
                <div className="p-6 text-center max-w-sm">
                  <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
                  <p className="text-xs text-slate-300 mb-4">{cameraError}</p>
                  <button
                    onClick={() => setActiveTab('manual')}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-[#1a73e8] text-white hover:bg-[#1557b0]"
                  >
                    Switch to Manual Keypad
                  </button>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    playsInline
                    autoPlay
                    muted
                    className="w-full h-full object-cover"
                  />
                  <canvas ref={canvasRef} className="hidden" />

                  {/* High-Tech Target Box & Laser Beam Overlay */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-60 h-60 sm:w-64 sm:h-64 relative border-2 border-dashed border-blue-400/40 rounded-2xl shadow-inner">
                      {/* Corner Targeting Brackets */}
                      <span className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-[#1a73e8] rounded-tl-lg" />
                      <span className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-[#1a73e8] rounded-tr-lg" />
                      <span className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-[#1a73e8] rounded-bl-lg" />
                      <span className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-[#1a73e8] rounded-br-lg" />

                      {/* Animated Laser Scan Beam */}
                      {cameraActive && (
                        <div className="w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#38bdf8] animate-[bounce_2.5s_infinite]" />
                      )}
                    </div>
                  </div>

                  {/* Status Overlay */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700 text-[11px] font-medium text-slate-300">
                    Align attendee QR code inside targeting frame
                  </div>
                </>
              )}
            </div>

            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 px-1">
              <span>Automatic Instant Decode with Cryptographic Verification</span>
              <span>2.5s Cooldown Safeguard</span>
            </div>
          </div>
        )}

        {/* 2. Manual Keypad Fallback Form */}
        {activeTab === 'manual' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Keyboard className="w-5 h-5 text-[#1a73e8]" />
              Manual Code Validation
            </h2>
            <p className="text-xs text-slate-500 mb-5">
              Use for attendees with damaged screens or when barcode scanners paste direct input.
            </p>

            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ticket Code or QR JSON Payload <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={ticketInput}
                  onChange={(e) => setTicketInput(e.target.value)}
                  placeholder="e.g. LV-TKT-2026-X89K"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-mono text-slate-900 bg-white focus:border-[#1a73e8]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cryptographic Signature (Optional if using full ticket code)
                </label>
                <input
                  type="text"
                  value={signatureInput}
                  onChange={(e) => setSignatureInput(e.target.value)}
                  placeholder="Optional HMAC signature"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-mono text-slate-900 bg-white focus:border-[#1a73e8]"
                />
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-3 rounded-xl text-sm font-bold bg-[#1a73e8] hover:bg-[#1557b0] text-white shadow-sm transition-all disabled:opacity-50"
              >
                {isProcessing ? 'Verifying Entry...' : 'Verify & Grant Entry'}
              </button>
            </form>
          </div>
        )}

        {/* Live Scan Result Banner */}
        {lastResult && (
          <div
            className={`p-6 rounded-3xl border-2 transition-all shadow-md ${
              lastResult.status === 'CHECKED_IN'
                ? 'bg-emerald-50 border-emerald-500 text-emerald-950'
                : lastResult.status === 'ALREADY_CHECKED_IN'
                ? 'bg-amber-50 border-amber-500 text-amber-950'
                : 'bg-red-50 border-red-500 text-red-950'
            }`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  lastResult.status === 'CHECKED_IN'
                    ? 'bg-emerald-200 text-emerald-800'
                    : lastResult.status === 'ALREADY_CHECKED_IN'
                    ? 'bg-amber-200 text-amber-800'
                    : 'bg-red-200 text-red-800'
                }`}
              >
                {lastResult.status === 'CHECKED_IN' ? (
                  <CheckCircle2 className="w-7 h-7" />
                ) : lastResult.status === 'ALREADY_CHECKED_IN' ? (
                  <AlertTriangle className="w-7 h-7" />
                ) : (
                  <XCircle className="w-7 h-7" />
                )}
              </div>

              <div className="flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span
                    className={`px-3 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wider ${
                      lastResult.status === 'CHECKED_IN'
                        ? 'bg-emerald-600 text-white'
                        : lastResult.status === 'ALREADY_CHECKED_IN'
                        ? 'bg-amber-600 text-white'
                        : 'bg-red-600 text-white'
                    }`}
                  >
                    {lastResult.status === 'CHECKED_IN'
                      ? '✓ ENTRY APPROVED'
                      : lastResult.status === 'ALREADY_CHECKED_IN'
                      ? '⚠ RE-ENTRY WARNING'
                      : '✕ ACCESS DENIED'}
                  </span>

                  <span className="font-mono text-xs font-bold text-slate-700 bg-white/80 px-2 py-0.5 rounded-md border">
                    {lastResult.ticketCode}
                  </span>
                </div>

                <h3 className="text-xl font-extrabold mt-2 text-slate-900">
                  {lastResult.attendeeName}
                </h3>
                <p className="text-sm font-semibold text-slate-700">
                  {lastResult.eventTitle}
                </p>
                <p className="text-xs mt-1 text-slate-600">{lastResult.message}</p>

                {lastResult.checkedInAt && (
                  <div className="mt-2 text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Checked In: {new Date(lastResult.checkedInAt).toLocaleTimeString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right Column: Real-Time Gate Logs Audit */}
      <div className="lg:col-span-5">
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-[#1a73e8]" />
              <h3 className="text-sm font-bold text-slate-900">
                Gate Entry Audit Log ({history.length})
              </h3>
            </div>

            <button
              onClick={() => setHistory([])}
              className="text-[11px] text-slate-400 hover:text-slate-600 transition-colors"
            >
              Clear
            </button>
          </div>

          {history.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
              <Scan className="w-6 h-6 mx-auto mb-2 opacity-40 text-slate-400" />
              <span>Awaiting first attendee scan...</span>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs transition-all hover:bg-slate-100/80"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{item.attendeeName}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.status === 'CHECKED_IN'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.status === 'ALREADY_CHECKED_IN'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {item.status === 'CHECKED_IN' ? 'In' : item.status === 'ALREADY_CHECKED_IN' ? 'Duplicate' : 'Invalid'}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 block truncate max-w-[200px]">
                      {item.eventTitle} • {item.ticketCode}
                    </span>
                  </div>

                  <span className="text-[10px] font-mono text-slate-400 shrink-0">
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
