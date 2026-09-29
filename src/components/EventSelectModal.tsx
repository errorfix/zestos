'use client';

import React, { useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';
import EventSelectorGrid from '@/components/EventSelectorGrid';
import { InitialEventData } from '@/lib/mockEvents';

export interface EventSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: InitialEventData[];
  selectedEventId?: string;
  onSelectEvent: (event: InitialEventData) => void;
  title?: string;
  subtitle?: string;
}

export default function EventSelectModal({
  isOpen,
  onClose,
  events,
  selectedEventId,
  onSelectEvent,
  title = 'Select Competition or Activity',
  subtitle = 'Choose which campus competition or arena this squad or contingent entry is competing in.',
}: EventSelectModalProps) {
  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col z-10 animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between gap-4 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#1a73e8]" /> Official Event Catalog
              </span>
              <span className="text-xs text-slate-500 font-medium">Contingent Cart Selector</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{title}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content: EventSelectorGrid */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1">
          <EventSelectorGrid
            events={events}
            selectedEventId={selectedEventId}
            onSelectEvent={(evt) => {
              onSelectEvent(evt);
              onClose();
            }}
            showStepHeader={false}
            hideHeader={true}
            maxHeightClass="max-h-[50vh]"
          />
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between shrink-0 text-xs text-slate-500">
          <span>Click any competition card to select it for your squad.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 transition shadow-xs"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
