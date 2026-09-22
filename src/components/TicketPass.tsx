'use client';

import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import {
  ShieldCheck,
  Printer,
  CheckCircle,
  Copy,
  ExternalLink,
  Lock,
  Calendar,
  AlertTriangle,
  QrCode as QrIcon,
} from 'lucide-react';
import { buildQrPayload } from '@/lib/crypto';

export interface TicketPassData {
  id: string;
  ticketCode: string;
  status: string;
  securityHash: string;
  fullName: string;
  leadEmail: string;
  eventTitle: string;
  eventCategory: string;
  eventDate?: string;
  eventVenue?: string;
}

interface TicketPassProps {
  ticket: TicketPassData;
}

export default function TicketPass({ ticket }: TicketPassProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
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

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, qrPayload, {
        width: 180,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'H',
      });
    }
  }, [qrPayload]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(ticket.ticketCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden transition-all max-w-xl mx-auto my-4">
      {/* Top Banner / Event Bar */}
      <div className="bg-[#1a73e8] text-white p-5 flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-100">
            Lingaya&apos;s Vidyapeeth • Official Entry Pass
          </span>
          <h3 className="text-xl font-bold tracking-tight mt-0.5">{ticket.eventTitle}</h3>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-white text-[#1a73e8] shadow-sm">
          {ticket.eventCategory}
        </span>
      </div>

      <div className="p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Cryptographic QR Code Canvas */}
          <div className="flex flex-col items-center bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <canvas ref={canvasRef} className="rounded-xl shadow-xs" />
            <span className="text-[11px] font-semibold text-slate-500 mt-2 flex items-center gap-1">
              <Lock className="w-3 h-3 text-slate-400" />
              HMAC-SHA256 Encoded
            </span>
          </div>

          {/* Attendee & Pass Details */}
          <div className="flex-1 w-full space-y-4">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Attendee Name
              </span>
              <h4 className="text-lg font-bold text-slate-900">{ticket.fullName}</h4>
              <p className="text-xs text-slate-500">{ticket.leadEmail}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Ticket Code
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="font-mono text-sm font-bold text-[#1a73e8] bg-[#e8f0fe] px-2 py-0.5 rounded-lg border border-[#d2e3fc]">
                    {ticket.ticketCode}
                  </span>
                  <button
                    onClick={handleCopyCode}
                    aria-label="Copy ticket code"
                    className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                {copied && <span className="text-[10px] text-emerald-600 font-semibold">Copied!</span>}
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Gate Status
                </span>
                <div className="mt-0.5">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                    <CheckCircle className="w-3 h-3" />
                    {ticket.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Cryptographic Signature Hash
              </span>
              <code className="text-[11px] block font-mono text-slate-600 bg-slate-100 px-2 py-1 rounded-md overflow-x-auto truncate">
                {ticket.securityHash}
              </code>
            </div>
          </div>
        </div>

        {/* Live Cryptographic Verification Box */}
        {verificationResult && (
          <div
            className={`mt-6 p-4 rounded-2xl border text-xs ${
              verificationResult.valid
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-red-50 border-red-200 text-red-900'
            }`}
          >
            <div className="flex items-center gap-2 font-bold mb-1">
              {verificationResult.valid ? (
                <>
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Verified Authentic Ticket Pass</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span>Validation Warning</span>
                </>
              )}
            </div>
            <p>{verificationResult.message || verificationResult.reason}</p>
          </div>
        )}

        {/* Pass Actions */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 no-print">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            Print / Save Pass
          </button>

          <button
            onClick={handleTestVerification}
            disabled={isVerifying}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-[#1a73e8] bg-[#e8f0fe] hover:bg-[#d2e3fc] transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            {isVerifying ? 'Verifying...' : 'Verify Cryptographic Hash'}
          </button>
        </div>
      </div>
    </div>
  );
}
