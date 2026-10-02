'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  User,
  ExternalLink,
  Maximize2,
} from 'lucide-react';

export interface ParticipantImageViewerProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  participantName?: string;
  subtitle?: string;
}

export default function ParticipantImageViewerModal({
  isOpen,
  onClose,
  imageUrl,
  participantName = 'Participant Photo',
  subtitle,
}: ParticipantImageViewerProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialPinchDist, setInitialPinchDist] = useState<number | null>(null);
  const [initialScale, setInitialScale] = useState(1);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Reset view state when a new image is opened or modal toggles
  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
      setIsDragging(false);
      setImageLoaded(false);
      setLoadError(false);

      // Lock body scroll
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen, imageUrl]);

  const handleZoomIn = useCallback(() => {
    setScale((prev) => Math.min(prev + 0.35, 4));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale((prev) => {
      const next = Math.max(prev - 0.35, 0.5);
      if (next <= 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  }, []);

  const handleResetZoom = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  // Keyboard navigation shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        handleZoomIn();
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        handleZoomOut();
      } else if (e.key === '0') {
        e.preventDefault();
        handleResetZoom();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handleZoomIn, handleZoomOut, handleResetZoom]);

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch handlers for mobile pan & pinch-to-zoom
  const getTouchDistance = (touches: React.TouchList) => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && scale > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      });
    } else if (e.touches.length === 2) {
      setIsDragging(false);
      setInitialPinchDist(getTouchDistance(e.touches));
      setInitialScale(scale);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging && scale > 1) {
      setPosition({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y,
      });
    } else if (e.touches.length === 2 && initialPinchDist) {
      const currentDist = getTouchDistance(e.touches);
      const ratio = currentDist / initialPinchDist;
      const nextScale = Math.min(Math.max(initialScale * ratio, 0.5), 4);
      setScale(nextScale);
      if (nextScale <= 1) {
        setPosition({ x: 0, y: 0 });
      }
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setInitialPinchDist(null);
  };

  // Double click / double tap toggles zoom
  const handleDoubleClick = () => {
    if (scale > 1.2) {
      handleResetZoom();
    } else {
      setScale(2.2);
    }
  };

  // Download image helper
  const handleDownload = () => {
    if (!imageUrl) return;
    const link = document.createElement('a');
    link.href = imageUrl;
    const cleanName = participantName.replace(/[^a-zA-Z0-9_-]/g, '_');
    link.download = `${cleanName}_photo.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen || !imageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex flex-col justify-between bg-slate-950/90 backdrop-blur-md select-none animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-label={`Photo viewer for ${participantName}`}
    >
      {/* ── Top Header Navigation Bar ───────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4 bg-slate-950/70 border-b border-white/10 z-20">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white shrink-0">
            <User className="w-4 h-4 text-slate-300" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-white truncate">
              {participantName}
            </h3>
            {subtitle && (
              <p className="text-[11px] text-slate-400 truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Top Right Close Button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleDownload}
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all"
            title="Download original photo"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Save</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
            title="Close image viewer (Esc)"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">Close</span>
            <kbd className="hidden md:inline-block ml-1 px-1.5 py-0.5 text-[10px] font-mono bg-rose-700/60 rounded text-rose-100">
              ESC
            </kbd>
          </button>
        </div>
      </div>

      {/* ── Main Interactive Image Canvas ──────────────────────────────────── */}
      <div
        ref={containerRef}
        className="flex-1 relative w-full h-full flex items-center justify-center overflow-hidden touch-none p-4"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={(e) => {
          // If clicked directly on the canvas background, close modal
          if (e.target === containerRef.current) {
            onClose();
          }
        }}
        style={{
          cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
        }}
      >
        {/* Loading Spinner */}
        {!imageLoaded && !loadError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-3 pointer-events-none">
            <div className="w-9 h-9 border-3 border-amber-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-semibold text-slate-300">Loading Photo...</span>
          </div>
        )}

        {/* Load Error State */}
        {loadError && (
          <div className="p-6 rounded-2xl bg-white/10 border border-white/10 text-center max-w-sm">
            <User className="w-12 h-12 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-white mb-1">Image Preview Unavailable</p>
            <p className="text-xs text-slate-400 mb-4">The participant photo data could not be rendered.</p>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-semibold transition"
            >
              Close Viewer
            </button>
          </div>
        )}

        {/* The Scaled Participant Image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imageRef}
          src={imageUrl}
          alt={participantName}
          onLoad={() => setImageLoaded(true)}
          onError={() => setLoadError(true)}
          onDoubleClick={handleDoubleClick}
          draggable={false}
          className={`max-w-[92vw] max-h-[72vh] sm:max-w-[85vw] sm:max-h-[75vh] object-contain rounded-2xl shadow-2xl border border-white/15 select-none ${
            isDragging ? '' : 'transition-transform duration-150 ease-out'
          } ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          style={{
            transform: `translate3d(${position.x}px, ${position.y}px, 0px) scale(${scale})`,
            transformOrigin: 'center center',
          }}
        />

        {/* Mobile double tap hint overlay */}
        {scale === 1 && imageLoaded && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none bg-slate-900/70 border border-white/10 text-slate-300 px-3 py-1 rounded-full text-[11px] font-medium backdrop-blur-xs hidden xs:block opacity-75">
            Double tap to zoom • Pinch / Scroll to adjust
          </div>
        )}
      </div>

      {/* ── Bottom Floating Control Toolbar (Mobile-Friendly Pill) ─────────── */}
      <div className="p-4 flex items-center justify-center z-20">
        <div className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-full bg-slate-900/90 border border-white/15 backdrop-blur-xl shadow-2xl text-white">
          {/* Zoom Out Button */}
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={scale <= 0.5}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center hover:bg-white/15 active:scale-90 transition-all disabled:opacity-30 disabled:pointer-events-none"
            title="Zoom Out (-)"
            aria-label="Zoom Out"
          >
            <ZoomOut className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-slate-200" />
          </button>

          {/* Current Zoom Percentage (Click to Reset) */}
          <button
            type="button"
            onClick={handleResetZoom}
            className="px-2.5 py-1 text-xs font-mono font-bold rounded-lg hover:bg-white/15 transition-colors text-amber-400"
            title="Click to reset zoom to 100%"
          >
            {Math.round(scale * 100)}%
          </button>

          {/* Zoom In Button */}
          <button
            type="button"
            onClick={handleZoomIn}
            disabled={scale >= 4}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center hover:bg-white/15 active:scale-90 transition-all disabled:opacity-30 disabled:pointer-events-none"
            title="Zoom In (+)"
            aria-label="Zoom In"
          >
            <ZoomIn className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-slate-200" />
          </button>

          <div className="w-px h-5 bg-white/20 mx-0.5" />

          {/* Reset Zoom & Pan */}
          <button
            type="button"
            onClick={handleResetZoom}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center hover:bg-white/15 active:scale-90 transition-all text-slate-200"
            title="Reset Zoom & Pan (0)"
            aria-label="Reset Zoom and Pan"
          >
            <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          {/* Quick Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center hover:bg-rose-500/20 active:scale-90 transition-all text-rose-400 hover:text-rose-300 ml-0.5"
            title="Close viewer"
            aria-label="Close viewer"
          >
            <X className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
