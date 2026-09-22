import Link from 'next/link';
import { Users, MapPin, Calendar, ArrowRight, Music, Sparkles, Trophy, UploadCloud } from 'lucide-react';
import { InitialEventData } from '@/lib/mockEvents';

interface EventCardProps {
  event: InitialEventData;
}

export default function EventCard({ event }: EventCardProps) {
  const isSolo = event.eventType === 'Individual' || (event.minTeamSize === 1 && event.maxTeamSize === 1);
  const isFree = event.feeAmount === 0;

  const getCategoryBadge = (category: string) => {
    if (category.startsWith('Cultural')) {
      return {
        bg: 'bg-purple-50',
        text: 'text-purple-700',
        border: 'border-purple-200',
      };
    }
    if (category.startsWith('Literary')) {
      return {
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200',
      };
    }
    if (category.startsWith('Informalz')) {
      return {
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200',
      };
    }
    if (category.startsWith('Gaming')) {
      return {
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
      };
    }
    return {
      bg: 'bg-slate-50',
      text: 'text-slate-700',
      border: 'border-slate-200',
    };
  };

  const badgeStyle = getCategoryBadge(event.category);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col justify-between hover:shadow-lg transition-all duration-200 group">
      <div className="p-6">
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}
            >
              {event.category}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
              {event.eventType}
            </span>
          </div>

          <div className="text-right">
            {isFree ? (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                FREE
              </span>
            ) : event.hasDayOptions ? (
              <div>
                <span className="text-base font-extrabold text-slate-900 block">
                  ₹150 <span className="text-xs font-normal text-slate-500">/ Day</span>
                </span>
                <span className="text-[11px] font-semibold text-[#1a73e8] block">
                  or ₹250 / Both Days
                </span>
              </div>
            ) : (
              <div>
                <span className="text-lg font-bold text-slate-900">
                  ₹{event.feeAmount / 100}
                </span>
                <span className="text-xs text-slate-500 block">
                  per {isSolo ? 'entry' : 'team'}
                </span>
              </div>
            )}
          </div>
        </div>

        <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#1a73e8] transition-colors leading-snug mb-2">
          {event.title}
        </h3>

        {event.description && (
          <p className="text-xs text-slate-600 mb-4 line-clamp-2 leading-relaxed">
            {event.description}
          </p>
        )}

        {/* Independent Prizes Tag */}
        {(event.prize1 || event.prize2) && (
          <div className="mb-4 p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 flex items-start gap-2">
            <Trophy className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="leading-tight">
              {event.prize1 && (
                <span className="block font-semibold">
                  1st: <strong className="text-slate-900">{event.prize1}</strong>
                </span>
              )}
              {event.prize2 && (
                <span className="text-[11px] text-amber-800 block mt-0.5">
                  2nd: {event.prize2}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Constraints & Requirements */}
        <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>
              {isSolo ? (
                <span className="text-slate-800 font-medium">Solo Entry (1 Attendee)</span>
              ) : (
                <span>
                  Team Size: <strong className="text-slate-800">{event.minTeamSize} – {event.maxTeamSize} Members</strong>
                </span>
              )}
            </span>
          </div>

          {event.requiresTrackUpload && (
            <div className="flex items-center gap-2 text-purple-700 font-medium text-[11px]">
              <UploadCloud className="w-3.5 h-3.5 text-purple-500 shrink-0" />
              <span>Stage Audio/Video Track Required</span>
            </div>
          )}

          {event.venue && (
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{event.venue}</span>
            </div>
          )}

          {event.date && (
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{event.date}</span>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 bg-slate-50 border-t border-slate-100">
        <Link
          href={`/register?event=${event.id}`}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-white border border-slate-300 text-slate-800 hover:bg-[#1a73e8] hover:text-white hover:border-[#1a73e8] shadow-xs transition-all focus-visible:ring-2 focus-visible:ring-[#1a73e8]"
        >
          <span>{isFree ? 'Register Free' : 'Register for Event'}</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
