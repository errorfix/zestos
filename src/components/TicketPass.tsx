'use client';

import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import {
  ShieldCheck,
  CheckCircle,
  Copy,
  ExternalLink,
  Lock,
  Music,
  UploadCloud,
  CheckCircle2,
  Download,
  User,
  GraduationCap,
  Phone,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { buildQrPayload } from '@/lib/crypto';

export interface TicketPassData {
  id: string;
  ticketCode: string;
  status: string;
  securityHash: string;
  fullName: string;
  leadEmail: string;
  leadPhone?: string | null;
  college?: string | null;
  photoUrl?: string | null;
  eventTitle: string;
  eventCategory: string;
  eventDate?: string;
  eventVenue?: string;
  dayOption?: string | null;
  trackUploadUrl?: string | null;
  trackNotes?: string | null;
  requiresTrackUpload?: boolean;
}

interface TicketPassProps {
  ticket: TicketPassData;
  autoDownload?: boolean;
}

export default function TicketPass({ ticket, autoDownload }: TicketPassProps) {
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);
  const [verificationResult, setVerificationResult] = useState<{
    valid: boolean;
    message?: string;
    reason?: string;
  } | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  const qrPayload = buildQrPayload(
    ticket.ticketCode,
    ticket.leadEmail,
    ticket.fullName,
    ticket.eventTitle,
    ticket.securityHash
  );

  // Generate QR code onto canvas
  useEffect(() => {
    if (qrCanvasRef.current) {
      QRCode.toCanvas(qrCanvasRef.current, qrPayload, {
        width: 170,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'H',
      });
    }
  }, [qrPayload]);

  // Handle auto-download when flag is active
  useEffect(() => {
    const shouldAutoDownload =
      autoDownload ||
      (typeof window !== 'undefined' &&
        new URLSearchParams(window.location.search).get('autoDownload') === 'true');

    if (shouldAutoDownload) {
      const timer = setTimeout(() => {
        handleDownloadPass();
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [autoDownload]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(ticket.ticketCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Render high-resolution portrait composite badge for PNG download
  const handleDownloadPass = async () => {
    if (isDownloading) return;
    setIsDownloading(true);

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = 720;
      const height = 1160;
      canvas.width = width;
      canvas.height = height;

      // 1. Background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      // Card Header gradient
      const headerGrad = ctx.createLinearGradient(0, 0, width, 240);
      headerGrad.addColorStop(0, '#1e3a8a');
      headerGrad.addColorStop(1, '#2563eb');
      ctx.fillStyle = headerGrad;
      ctx.fillRect(0, 0, width, 240);

      // Lanyard slot pill
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect((width - 90) / 2, 16, 90, 14, 7);
      ctx.fill();

      // University & Fest Title
      ctx.fillStyle = '#bfdbfe';
      ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText("LINGAYA'S VIDYAPEETH • DEEMED TO BE UNIVERSITY", width / 2, 70);

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 38px system-ui, -apple-system, sans-serif';
      ctx.fillText('ZEST 2K26 OFFICIAL PASS', width / 2, 120);

      // Day Badge on Header
      const dayLabel =
        ticket.dayOption === 'BOTH_DAYS'
          ? 'BOTH DAYS ALL-ACCESS (OCT 30 & 31)'
          : ticket.dayOption === 'DAY_2'
          ? 'DAY 2 PASS (OCT 31)'
          : 'DAY 1 PASS (OCT 30)';

      ctx.fillStyle = '#dbeafe';
      ctx.beginPath();
      ctx.roundRect((width - 420) / 2, 145, 420, 36, 18);
      ctx.fill();

      ctx.fillStyle = '#1e40af';
      ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
      ctx.fillText(dayLabel, width / 2, 169);

      // Event title pill
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
      ctx.fillText(ticket.eventTitle.slice(0, 38), width / 2, 218);

      // 2. Attendee Photo & Details
      const avatarY = 270;
      const avatarSize = 130;
      const avatarX = (width - avatarSize) / 2;

      // Draw photo or avatar placeholder
      if (ticket.photoUrl) {
        try {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject();
            img.src = ticket.photoUrl!;
          });

          ctx.save();
          ctx.beginPath();
          ctx.arc(width / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(img, avatarX, avatarY, avatarSize, avatarSize);
          ctx.restore();

          // Border around photo
          ctx.strokeStyle = '#2563eb';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(width / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
          ctx.stroke();
        } catch {
          drawPlaceholderAvatar(ctx, avatarX, avatarY, avatarSize);
        }
      } else {
        drawPlaceholderAvatar(ctx, avatarX, avatarY, avatarSize);
      }

      // Attendee Name
      ctx.fillStyle = '#0f172a';
      ctx.font = '900 32px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(ticket.fullName, width / 2, 440);

      // College Name
      ctx.fillStyle = '#475569';
      ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
      ctx.fillText(ticket.college || "Lingaya's Vidyapeeth", width / 2, 475);

      // Contact No & Email
      const contactInfo = [ticket.leadPhone, ticket.leadEmail].filter(Boolean).join(' • ');
      ctx.fillStyle = '#64748b';
      ctx.font = '16px system-ui, -apple-system, sans-serif';
      ctx.fillText(contactInfo, width / 2, 505);

      // Divider line
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(80, 530);
      ctx.lineTo(width - 80, 530);
      ctx.stroke();

      // 3. QR Code Box
      const qrBoxSize = 340;
      const qrBoxX = (width - qrBoxSize) / 2;
      const qrBoxY = 560;

      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.roundRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 24);
      ctx.fill();
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.stroke();

      if (qrCanvasRef.current) {
        ctx.drawImage(qrCanvasRef.current, qrBoxX + 30, qrBoxY + 30, 280, 280);
      }

      // Ticket Code Below QR
      ctx.fillStyle = '#1e3a8a';
      ctx.font = '900 34px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(ticket.ticketCode, width / 2, 945);

      ctx.fillStyle = '#16a34a';
      ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
      ctx.fillText(`GATE STATUS: ${ticket.status} • VERIFIED`, width / 2, 980);

      // Signature hash
      ctx.fillStyle = '#94a3b8';
      ctx.font = '13px monospace';
      ctx.fillText(`HMAC-SHA256: ${ticket.securityHash.slice(0, 36)}...`, width / 2, 1020);

      // Footer
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(0, height - 70, width, 70);
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
      ctx.fillText("Valid Photo ID & Gate Entry Pass • Lingaya's FestOS v2.0", width / 2, height - 28);

      // Export PNG
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ZEST2K26_PASS_${ticket.ticketCode}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setDownloadSuccess(true);
        setTimeout(() => setDownloadSuccess(false), 3000);
      }
    } catch (e) {
      console.error('Pass download error:', e);
    } finally {
      setIsDownloading(false);
    }
  };

  const drawPlaceholderAvatar = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number
  ) => {
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 48px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('👤', x + size / 2, y + size / 2 + 16);
  };

  const handleTestVerification = async () => {
    setIsVerifying(true);
    try {
      const res = await fetch('/api/verify-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketCode: ticket.ticketCode,
          leadEmail: ticket.leadEmail,
          signature: ticket.securityHash,
        }),
      });
      const data = await res.json();
      setVerificationResult(data);
    } catch {
      setVerificationResult({ valid: false, reason: 'Network or verification service failure.' });
    } finally {
      setIsVerifying(false);
    }
  };

  const dayLabel =
    ticket.dayOption === 'BOTH_DAYS'
      ? 'Both Days All-Access'
      : ticket.dayOption === 'DAY_2'
      ? 'Day 2 Pass'
      : 'Day 1 Pass';

  return (
    <div className="flex flex-col items-center my-6">
      {/* ────────────────── VERTICAL PORTRAIT BADGE CARD ────────────────── */}
      <div
        ref={cardRef}
        className="w-full max-w-sm bg-white rounded-[32px] border-2 border-slate-300 shadow-2xl overflow-hidden transition-all relative"
      >
        {/* Lanyard Hole Cutout Styling */}
        <div className="w-full bg-[#1a56db] pt-3 pb-1 flex justify-center">
          <div className="w-20 h-3 bg-white/30 rounded-full border border-white/40" />
        </div>

        {/* Top Header Banner */}
        <div className="bg-gradient-to-b from-[#1a56db] to-[#1e40af] text-white px-5 pt-3 pb-6 text-center relative">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-200 block">
            LINGAYA&apos;S VIDYAPEETH
          </span>
          <h3 className="text-2xl font-black tracking-tight text-white mt-0.5">
            ZEST 2K26
          </h3>
          <p className="text-[11px] text-blue-100 font-semibold tracking-wide">
            OFFICIAL ENTRY PASS
          </p>

          {/* Access Duration Pill */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 mt-2.5 rounded-full text-[11px] font-extrabold bg-white text-[#1a56db] shadow-sm">
            <Calendar className="w-3 h-3 text-[#1a56db]" />
            <span>{dayLabel}</span>
          </div>

          <div className="mt-2 text-xs font-bold text-white/95 truncate">
            {ticket.eventTitle}
          </div>
        </div>

        {/* Badge Card Body (Vertical Portrait) */}
        <div className="px-6 pt-5 pb-6 text-center space-y-4">
          {/* Attendee Photo Frame */}
          <div className="flex justify-center -mt-10">
            <div className="relative">
              {ticket.photoUrl ? (
                <img
                  src={ticket.photoUrl}
                  alt={ticket.fullName}
                  className="w-24 h-28 object-cover rounded-2xl border-4 border-white shadow-lg bg-slate-100"
                />
              ) : (
                <div className="w-24 h-24 rounded-2xl border-4 border-white shadow-lg bg-slate-100 flex items-center justify-center text-slate-400">
                  <User className="w-10 h-10" />
                </div>
              )}
              <span className="absolute -bottom-2 -right-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500 text-white shadow-xs">
                Verified
              </span>
            </div>
          </div>

          {/* Attendee Identity */}
          <div>
            <h4 className="text-xl font-black text-slate-900 leading-tight">
              {ticket.fullName}
            </h4>
            {ticket.college && (
              <p className="text-xs font-semibold text-slate-600 flex items-center justify-center gap-1 mt-1">
                <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate max-w-[260px]">{ticket.college}</span>
              </p>
            )}
            <div className="flex items-center justify-center gap-3 text-[11px] text-slate-500 mt-1">
              {ticket.leadPhone && (
                <span className="flex items-center gap-1 font-medium">
                  <Phone className="w-3 h-3 text-slate-400" />
                  {ticket.leadPhone}
                </span>
              )}
              <span className="truncate max-w-[150px]">{ticket.leadEmail}</span>
            </div>
          </div>

          {/* Cryptographic QR Code Container */}
          <div className="flex flex-col items-center bg-slate-50 p-4 rounded-3xl border border-slate-200 shadow-inner">
            <canvas ref={qrCanvasRef} className="rounded-xl shadow-xs" />
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600 mt-2">
              <Lock className="w-3 h-3 text-[#1a56db]" />
              <span>HMAC-SHA256 Signed • Gate Scan</span>
            </div>
          </div>

          {/* Ticket Code Box */}
          <div className="bg-slate-100/90 rounded-2xl p-2.5 border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
              Ticket Pass Code
            </span>
            <div className="flex items-center justify-center gap-2 mt-0.5">
              <span className="font-mono text-lg font-black text-[#1a56db] tracking-wide">
                {ticket.ticketCode}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                aria-label="Copy ticket code"
                className="p-1 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
            {copied && (
              <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">
                Copied to clipboard!
              </span>
            )}
          </div>

          {/* Gate Status Pill */}
          <div className="flex items-center justify-between px-2 pt-1 text-xs">
            <span className="text-slate-500 font-medium">Entry Status:</span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              {ticket.status}
            </span>
          </div>

          {/* Signature Hash Preview */}
          <div className="pt-2 border-t border-slate-100 text-[10px] font-mono text-slate-400 truncate">
            Sig: {ticket.securityHash.slice(0, 24)}...
          </div>
        </div>

        {/* Card Footer Stripe */}
        <div className="bg-slate-900 text-white text-[10px] font-bold py-2 text-center uppercase tracking-wider">
          Present at Security & Gate Check-In
        </div>
      </div>

      {/* Stage Media Notification (if applicable) */}
      {ticket.requiresTrackUpload && (
        <div className="w-full max-w-sm mt-3 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-bold text-amber-900 flex items-center gap-1.5">
              <Music className="w-3.5 h-3.5 text-amber-700" />
              Stage Soundtrack Deck
            </span>
            {ticket.trackUploadUrl ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                Attached
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900">
                Pending
              </span>
            )}
          </div>
          {ticket.trackUploadUrl ? (
            <a
              href={ticket.trackUploadUrl.startsWith('http') ? ticket.trackUploadUrl : `https://${ticket.trackUploadUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#1a73e8] underline font-bold truncate block"
            >
              {ticket.trackUploadUrl}
            </a>
          ) : (
            <p className="text-slate-600 text-[11px]">
              Stage technicians require your backing music or karaoke before showtime.
            </p>
          )}
        </div>
      )}

      {/* Verification Box */}
      {verificationResult && (
        <div
          className={`w-full max-w-sm mt-3 p-3 rounded-2xl border text-xs ${
            verificationResult.valid
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          <div className="flex items-center gap-1.5 font-bold mb-0.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>{verificationResult.valid ? 'Verified Authentic Gate Pass' : 'Verification Issue'}</span>
          </div>
          <p>{verificationResult.message || verificationResult.reason}</p>
        </div>
      )}

      {/* Action Buttons: High-Resolution PNG Pass Download */}
      <div className="w-full max-w-sm mt-4 flex flex-col gap-2.5 no-print">
        <button
          type="button"
          onClick={handleDownloadPass}
          disabled={isDownloading}
          className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl text-sm font-bold bg-[#1a73e8] hover:bg-[#1557b0] text-white shadow-md transition-all active:scale-[0.98]"
        >
          {isDownloading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Generating HQ Pass PNG...</span>
            </>
          ) : downloadSuccess ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>Official Pass (PNG) Downloaded!</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>Download Official Pass (PNG)</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleTestVerification}
          disabled={isVerifying}
          className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold text-[#1a73e8] bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{isVerifying ? 'Checking Cryptography...' : 'Verify Cryptographic Signature'}</span>
        </button>
      </div>
    </div>
  );
}
